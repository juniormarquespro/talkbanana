import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { audio, mimeType, sourceLang, targetLang } = await req.json();
  if (!audio || !sourceLang || !targetLang)
    return NextResponse.json({ error: "Campos obrigatórios: audio, sourceLang, targetLang" }, { status: 400 });

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

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: formData,
  });
  if (!whisperRes.ok) {
    const detail = await whisperRes.text();
    return NextResponse.json({ error: "Erro na transcrição (Whisper)", detail }, { status: 500 });
  }
  const { text: transcript } = await whisperRes.json();
  if (!transcript?.trim())
    return NextResponse.json({ error: "Nenhum áudio detectado. Fale mais perto do microfone." }, { status: 400 });

  // 2. Claude Haiku — tradução
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
        content: `IMPORTANT: Detect the language of the transcribed text below. Then translate it to the OTHER language of the pair.

The conversation pair is: ${sourceLang} ↔ ${targetLang}.

Rules:
- If the text is in ${sourceLang}, translate it to ${targetLang}
- If the text is in ${targetLang}, translate it to ${sourceLang}
- Translate the INTENDED MEANING, not word-for-word
- Watch out for false friends between languages
- Return ONLY the translated text
- No explanations, no labels, no quotes, no original text

Transcribed text: ${transcript}`,
      }],
    }),
  });
  if (!claudeRes.ok) {
    const detail = await claudeRes.text();
    return NextResponse.json({ error: "Erro na tradução (Haiku)", detail }, { status: 500 });
  }
  const claudeData = await claudeRes.json();
  const translation = claudeData.content?.[0]?.text?.trim();
  if (!translation) return NextResponse.json({ error: "Tradução vazia" }, { status: 500 });

  // 3. TTS
  const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", voice: "nova", input: translation, response_format: "mp3" }),
  });
  if (!ttsRes.ok) {
    const detail = await ttsRes.text();
    return NextResponse.json({ error: "Erro no TTS", detail }, { status: 500 });
  }

  return NextResponse.json({
    transcript,
    translation,
    debug: { sourceLang, targetLang, haikuRaw: translation },
    audio: Buffer.from(await ttsRes.arrayBuffer()).toString("base64"),
  });
}
