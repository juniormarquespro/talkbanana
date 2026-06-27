import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { audio, mimeType, sourceLang, targetLang, voiceA = "nova", voiceB = "onyx" } = await req.json();
  if (!audio || !sourceLang || !targetLang)
    return NextResponse.json({ error: "Campos obrigatórios: audio, sourceLang, targetLang" }, { status: 400 });

  // Verificar e debitar crédito (todos os planos debitam 1 por tradução)
  const { data: perfil } = await supabase
    .from("perfis")
    .select("plano, creditos")
    .eq("id", user.id)
    .single();

  const isPro = perfil?.plano === "pro_mensal" || perfil?.plano === "pro_anual";

  const { data: debitou } = await supabase.rpc("debitar_credito", { p_user_id: user.id });
  if (!debitou) {
    return NextResponse.json({
      error: "Créditos esgotados",
      creditos: 0,
      upgrade: true,
    }, { status: 402 });
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!OPENAI_KEY) return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 });
  if (!ANTHROPIC_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500 });

  // 1. Whisper — transcrição
  const audioBuffer = Buffer.from(audio, "base64");
  const ext = (mimeType || "").includes("mp4") || (mimeType || "").includes("m4a") ? "m4a" : "webm";
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: mimeType || "audio/webm" }), `audio.${ext}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: formData,
  });
  if (!whisperRes.ok) {
    const detail = await whisperRes.text();
    return NextResponse.json({ error: "Erro na transcrição", detail }, { status: 500 });
  }
  const whisperData = await whisperRes.json();
  const transcript: string = whisperData.text;
  const detectedCode: string = whisperData.language ?? "";

  if (!transcript?.trim())
    return NextResponse.json({ error: "Nenhum áudio detectado. Fale mais perto do microfone." }, { status: 400 });

  // 2. Claude Haiku — tradução + transliteração + deteção de idioma fiável
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `The conversation pair is: ${sourceLang} ↔ ${targetLang}.
Detect which language the text below is in, then translate it to the OTHER language of the pair.

Rules:
- Translate the INTENDED MEANING, not word-for-word
- Watch out for false friends

Reply using EXACTLY this format (no extra text outside the tags):
<source_lang>the language the text is written in (must be exactly "${sourceLang}" or "${targetLang}")</source_lang>
<translation>the translated text</translation>
<transliteration>Write how a native ${sourceLang} speaker would pronounce the TRANSLATION out loud, using only ${sourceLang} letters and spelling — no phonetic symbols, no original script. Goal: someone who only reads ${sourceLang} can say it correctly. Examples when ${sourceLang} is Português: "hello" → "rélo", "how are you?" → "rau ar iú?", "good morning" → "gud mórning", مرحبا → "már-ra-bá", 你好 → "ni-rau", bonjour → "bôn-jur". If the translation is already in ${sourceLang}, leave this empty.</transliteration>

Transcribed text: ${transcript}`,
      }],
    }),
  });
  if (!claudeRes.ok) {
    const detail = await claudeRes.text();
    return NextResponse.json({ error: "Erro na tradução (Haiku)", detail }, { status: 500 });
  }
  const claudeData = await claudeRes.json();
  const raw = claudeData.content?.[0]?.text ?? "";
  const haikuSourceLang = (raw.match(/<source_lang>([\s\S]*?)<\/source_lang>/) ?? [])[1]?.trim() ?? sourceLang;
  const translation = (raw.match(/<translation>([\s\S]*?)<\/translation>/) ?? [])[1]?.trim() ?? raw.trim();
  if (!translation) return NextResponse.json({ error: "Tradução vazia" }, { status: 500 });

  // Seleção de voz: se o utilizador falou sourceLang → tradução está em targetLang → voiceB
  //                se o utilizador falou targetLang → tradução está em sourceLang → voiceA
  const voice = haikuSourceLang === sourceLang ? voiceB : voiceA;
  const detectedLang = haikuSourceLang;

  // Transliteração só faz sentido quando a tradução está em targetLang (língua estrangeira).
  // Se a tradução voltou para sourceLang (língua nativa do utilizador), não é necessária.
  const translationIsInTargetLang = haikuSourceLang === sourceLang;
  const transliteration = translationIsInTargetLang
    ? ((raw.match(/<transliteration>([\s\S]*?)<\/transliteration>/) ?? [])[1]?.trim() ?? "")
    : "";

  // 3. TTS
  const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", voice, input: translation, response_format: "mp3" }),
  });
  if (!ttsRes.ok) {
    const detail = await ttsRes.text();
    return NextResponse.json({ error: "Erro no TTS", detail }, { status: 500 });
  }

  const creditosRestantes = (perfil?.creditos ?? 0) - 1;

  return NextResponse.json({
    transcript,
    translation,
    transliteration,
    detectedLang,
    audio: Buffer.from(await ttsRes.arrayBuffer()).toString("base64"),
    creditos: creditosRestantes,
    isPro,
  });
}
