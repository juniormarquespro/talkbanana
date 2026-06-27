"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReloadButton from "@/components/ReloadButton";
import { usePreventNavigation } from "@/hooks/usePreventNavigation";
import { Logo } from "@/components/Logo";

const IDIOMAS = [
  { value: "Português", label: "🇧🇷 Português" },
  { value: "English", label: "🇬🇧 English" },
  { value: "Español", label: "🇪🇸 Español" },
  { value: "Català", label: "🏴 Català" },
  { value: "Français", label: "🇫🇷 Français" },
  { value: "Italiano", label: "🇮🇹 Italiano" },
  { value: "Deutsch", label: "🇩🇪 Deutsch" },
  { value: "Árabe", label: "🇸🇦 Árabe" },
  { value: "Chinês simplificado", label: "🇨🇳 中文" },
];

type VoiceGender = "feminino" | "masculino";
const VOICE_MAP: Record<VoiceGender, string> = { feminino: "nova", masculino: "onyx" };

interface Props {
  creditosIniciais: number;
  isPro: boolean;
  isAdmin: boolean;
}

export default function TraduzirClient({ creditosIniciais, isPro, isAdmin }: Props) {
  const [sourceLang, setSourceLang] = useState("Português");
  const [targetLang, setTargetLang] = useState("English");
  const [creditos, setCreditos] = useState(creditosIniciais);
  const [semCreditos, setSemCreditos] = useState(creditosIniciais <= 0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("Pronto para gravar");
  const [statusType, setStatusType] = useState<"idle" | "recording" | "processing" | "done" | "error">("idle");
  const [result, setResult] = useState<{ transcript: string; translation: string; transliteration?: string; audio?: string; from?: string; to?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noiseOn, setNoiseOn] = useState(true);
  const [gateLevel, setGateLevel] = useState(50);
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState("");
  const [voiceA, setVoiceA] = useState<VoiceGender>("feminino");
  const [voiceB, setVoiceB] = useState<VoiceGender>("masculino");
  // refs para evitar closure desatualizada no useCallback
  const voiceARef = useRef<VoiceGender>("feminino");
  const voiceBRef = useRef<VoiceGender>("masculino");
  const sourceLangRef = useRef(sourceLang);
  const targetLangRef = useRef(targetLang);
  voiceARef.current = voiceA;
  voiceBRef.current = voiceB;
  sourceLangRef.current = sourceLang;
  targetLangRef.current = targetLang;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startMsRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const awaitingStreamRef = useRef(false);
  const unlockedAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPressRef = useRef(0);

  function startTimer() {
    startMsRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startMsRef.current) / 1000);
      const display = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      setTimer(s >= 25 ? `${display} ⚠` : display);
    }, 500);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer("");
  }

  function startWaveform() {
    if (!analyserRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const bufLen = analyserRef.current.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(data);
      const W = canvasRef.current!.width, H = canvasRef.current!.height;
      ctx.clearRect(0, 0, W, H);
      const barW = W / bufLen - 1;
      for (let i = 0; i < bufLen; i++) {
        const v = data[i] / 255;
        const bH = Math.max(2, v * H * 0.9);
        ctx.fillStyle = `hsl(42,70%,${45 + v * 25}%)`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(i * (barW + 1), (H - bH) / 2, barW, bH, 1);
        else ctx.rect(i * (barW + 1), (H - bH) / 2, barW, bH);
        ctx.fill();
      }
    }
    draw();
  }
  function stopWaveform() {
    cancelAnimationFrame(rafRef.current);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function getSupportedMime() {
    const c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    return c.find(t => MediaRecorder.isTypeSupported(t)) || "";
  }

  const startRecording = useCallback(async () => {
    if (isProcessing) return;
    setError(null);
    setResult(null);
    stopRequestedRef.current = false;
    awaitingStreamRef.current = true;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      awaitingStreamRef.current = false;
      setError("Permissão de microfone negada. Permita o acesso ao microfone.");
      setIsRecording(false);
      return;
    }
    awaitingStreamRef.current = false;

    if (stopRequestedRef.current) {
      stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      setStatus("Pronto para gravar");
      setStatusType("idle");
      return;
    }

    let recordStream = stream;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      if (noiseOn) {
        const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 100;
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4000;
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const gate = ctx.createScriptProcessor(2048, 1, 1);
        let silent = 0;
        gate.onaudioprocess = (e) => {
          const inp = e.inputBuffer.getChannelData(0);
          const out = e.outputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < inp.length; i++) sum += inp[i] * inp[i];
          const rms = Math.sqrt(sum / inp.length);
          const thresh = (gateLevel / 100) * 0.045;
          if (rms > thresh) { silent = 0; out.set(inp); }
          else { silent++; if (silent > 8) out.fill(0); else out.set(inp); }
        };
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -24; comp.knee.value = 8; comp.ratio.value = 6;
        comp.attack.value = 0.005; comp.release.value = 0.15;
        const dest = ctx.createMediaStreamDestination();
        source.connect(hp); hp.connect(lp); lp.connect(gate); gate.connect(comp); comp.connect(dest);
        if (dest.stream.getAudioTracks().length > 0) recordStream = dest.stream;
      }
    } catch { /* fallback sem filtro */ }

    chunksRef.current = [];
    const mime = getSupportedMime();
    const mr = new MediaRecorder(recordStream, mime ? { mimeType: mime } : {});
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      stopWaveform();
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      processRecording(mime || "audio/webm");
    };

    mr.start(100);
    setIsRecording(true);
    startMsRef.current = Date.now();
    setStatus("Gravando…");
    setStatusType("recording");
    startTimer();
    startWaveform();

    // Limite de 1 minuto
    maxDurationRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") finalizeStop();
    }, 30000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, noiseOn, gateLevel]);

  function handlePress() {
    if (isProcessing || semCreditos) return;
    const now = Date.now();
    if (now - lastPressRef.current < 2000) return;
    lastPressRef.current = now;
    if (isRecording) {
      finalizeStop();
      return;
    }
    unlockedAudioRef.current = new Audio();
    unlockedAudioRef.current.play().catch(() => {});
    startRecording();
  }

  function handleRelease() {
    if (awaitingStreamRef.current) { stopRequestedRef.current = true; }
  }

  function finalizeStop() {
    if (!mediaRecorderRef.current) return;
    if (maxDurationRef.current) { clearTimeout(maxDurationRef.current); maxDurationRef.current = null; }
    setIsRecording(false);
    mediaRecorderRef.current.stop();
  }

  async function processRecording(mimeType: string) {
    setIsProcessing(true);
    setStatus("Transcrevendo…");
    setStatusType("processing");
    stopTimer();

    const blob = new Blob(chunksRef.current, { type: mimeType });
    if (blob.size < 100) {
      setStatus("Nenhum áudio captado. Tente de novo.");
      setStatusType("error");
      setIsProcessing(false);
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setStatus("Traduzindo…");
      const res = await fetch("/api/traduzir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          mimeType,
          sourceLang: sourceLangRef.current,
          targetLang: targetLangRef.current,
          voiceA: VOICE_MAP[voiceARef.current],
          voiceB: VOICE_MAP[voiceBRef.current],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          setSemCreditos(true);
          setCreditos(0);
          setError("Créditos esgotados. Assine o Pro para continuar.");
          setStatus("Sem créditos.");
          setStatusType("error");
        } else {
          setError(data.error || "Erro desconhecido.");
          setStatus("Erro.");
          setStatusType("error");
        }
        return;
      }

      if (data.creditos !== null && data.creditos !== undefined) {
        setCreditos(data.creditos);
        if (data.creditos <= 0) setSemCreditos(true);
      }

      const from = data.detectedLang || sourceLang;
      const to = from === sourceLang ? targetLang : sourceLang;
      setResult({ transcript: data.transcript, translation: data.translation, transliteration: data.transliteration || "", audio: data.audio, from, to });
      setStatus(`${from} → ${to}`);
      setStatusType("done");
      if (data.audio) playAudio(data.audio);

    } catch {
      setError("Falha de rede. Verifique a ligação.");
      setStatus("Erro.");
      setStatusType("error");
    } finally {
      setIsProcessing(false);
    }
  }

  function playAudio(base64: string) {
    const src = "data:audio/mp3;base64," + base64;
    if (audioRef.current) audioRef.current.pause();
    const audio = unlockedAudioRef.current || new Audio();
    audio.src = src;
    audio.playbackRate = speed;
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audio.play().catch(() => {});
    audioRef.current = audio;
  }

  function togglePlay() {
    if (!result?.audio) return;
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    } else if (audioRef.current?.src) {
      audioRef.current.play().catch(() => {});
    } else {
      playAudio(result.audio);
    }
  }

  async function shareResult() {
    if (!result) return;
    if (result.audio && typeof navigator !== "undefined" && navigator.canShare) {
      try {
        const bytes = atob(result.audio);
        const buf = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
        const blob = new Blob([buf], { type: "audio/mp3" });
        const file = new File([blob], "talkbanana.mp3", { type: "audio/mp3" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "TalkBanana" });
          return;
        }
      } catch { /* fallback abaixo */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent("🍌 " + result.translation)}`, "_blank");
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  usePreventNavigation(isProcessing);

  const statusColor = {
    idle: "#c9a84c",
    recording: "#dc3232",
    processing: "#FFC107",
    done: "#4caf77",
    error: "#f87171",
  }[statusType];

  return (
    <div className="min-h-screen">

      {/* Modal de processamento */}
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{
          background: "rgba(10,8,0,0.80)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}>
          <div className="flex flex-col items-center gap-5 px-8 py-8 rounded-2xl text-center mx-4" style={{
            background: "rgba(26,21,0,0.95)",
            border: "1px solid rgba(201,168,76,0.15)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(255,193,7,0.06)",
            maxWidth: 320, width: "100%",
          }}>
            {/* Spinner */}
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full" style={{ border: "4px solid rgba(201,168,76,0.12)" }} />
              <div className="absolute inset-0 rounded-full" style={{
                border: "4px solid transparent",
                borderTopColor: "#FFC107",
                animation: "spin 0.9s linear infinite",
              }} />
            </div>
            <p className="font-semibold text-base leading-snug" style={{ color: "#f5f0dc" }}>
              {status}
            </p>
            <p className="text-xs flex items-center gap-1.5" style={{ color: "rgba(255,193,7,0.8)" }}>
              <span>⚠️</span> Não feches nem saias desta página
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-30" style={{
        background: "rgba(10,8,0,0.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
      }}>
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard">
            <Logo size={28} variant="dark" textSize="0.9rem" />
          </Link>
          <div className="flex items-center gap-2">
            <ReloadButton />
            {isAdmin && (
              <Link href="/admin" className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(245,240,220,0.7)",
              }}>
                ⚙ Admin
              </Link>
            )}
            {creditos !== null && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                background: semCreditos ? "rgba(239,68,68,0.12)" : creditos <= (isPro ? 50 : 3) ? "rgba(239,68,68,0.08)" : "rgba(201,168,76,0.08)",
                border: semCreditos ? "1px solid rgba(239,68,68,0.3)" : creditos <= (isPro ? 50 : 3) ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(201,168,76,0.2)",
                color: semCreditos || creditos <= (isPro ? 50 : 3) ? "#f87171" : "#c9a84c",
              }}>
                {isPro && <span style={{ color: "#FFC107" }}>✦ </span>}{creditos} crédito{creditos !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto flex flex-col gap-6 items-center fade-up">

          {/* Banner sem créditos */}
          {semCreditos && (
            <div className="w-full rounded-xl p-4 flex items-center justify-between gap-3" style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)",
            }}>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
                🚫 Créditos esgotados. Adquira um pacote ou assine o Pro.
              </p>
              <Link href="/precos" className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap" style={{
                background: "rgba(255,193,7,0.15)", border: "1px solid rgba(255,193,7,0.5)", color: "#FFC107",
              }}>Assinar →</Link>
            </div>
          )}

          {/* Card Idioma 01 + Card Idioma 02 */}
          <div className="flex gap-3 w-full">
            {([
              { id: "src", num: "01", val: sourceLang, set: setSourceLang, voice: voiceA, setVoice: setVoiceA },
              { id: "tgt", num: "02", val: targetLang, set: setTargetLang, voice: voiceB, setVoice: setVoiceB },
            ] as const).map((cfg) => (
              <div key={cfg.id} className="flex-1 rounded-2xl p-4 flex flex-col gap-2" style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)",
              }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>Idioma {cfg.num}</p>
                <select
                  value={cfg.val}
                  onChange={(e) => cfg.set(e.target.value)}
                  className="w-full rounded-full px-3 py-2.5 text-sm font-bold"
                  style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)",
                    color: "rgb(245,240,220)", appearance: "none",
                  }}
                >
                  {IDIOMAS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <div className="flex gap-1">
                  {(["feminino", "masculino"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => cfg.setVoice(g)}
                      className="flex-1 text-[11px] font-bold py-1 rounded-full transition-all"
                      style={{
                        background: cfg.voice === g ? "rgba(255,193,7,0.12)" : "rgba(255,255,255,0.04)",
                        border: cfg.voice === g ? "1px solid rgba(255,193,7,0.35)" : "1px solid rgba(201,168,76,0.12)",
                        color: cfg.voice === g ? "#FFC107" : "rgba(201,168,76,0.4)",
                      }}
                    >
                      {g === "feminino" ? "♀" : "♂"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Botão gravar */}
          <div className="flex flex-col items-center gap-4">

            {/* Wave bars acima do botão */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 32, opacity: isRecording ? 1 : 0.3, transition: "opacity 0.3s" }}>
              {[0, 0.15, 0.3, 0.45, 0.3, 0.15, 0].map((delay, i) => (
                <span key={i} style={{
                  display: "block",
                  width: 4,
                  height: 6,
                  borderRadius: 3,
                  background: isRecording ? "#dc3232" : "#c9a84c",
                  animationName: isRecording ? "waveActive" : "waveIdle",
                  animationDuration: isRecording ? "0.65s" : "1.8s",
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: `${delay}s`,
                }} />
              ))}
            </div>

            <button
              onMouseDown={(e) => { e.preventDefault(); handlePress(); }}
              onMouseUp={handleRelease}
              onTouchStart={(e) => { e.preventDefault(); handlePress(); }}
              onTouchEnd={handleRelease}
              className="relative flex flex-col items-center justify-center gap-2 rounded-full transition-all select-none"
              style={{
                width: 220, height: 220,
                background: isRecording
                  ? "radial-gradient(circle at 50% 40%, rgba(220,50,50,0.15) 0%, #0a0800 100%)"
                  : "radial-gradient(circle at 50% 40%, rgba(18,14,0,1) 0%, #0a0800 100%)",
                border: isRecording ? "2px solid #dc3232" : isProcessing ? "2px solid #FFC107" : "2px solid rgba(201,168,76,0.4)",
                boxShadow: isRecording
                  ? "0 0 60px 10px rgba(220,50,50,0.3), 0 0 100px 30px rgba(220,50,50,0.1)"
                  : "0 0 50px 6px rgba(201,168,76,0.2), 0 0 100px 30px rgba(201,168,76,0.08)",
                cursor: isProcessing ? "default" : "pointer",
                touchAction: "none",
              }}
            >
              <svg width={72} height={72} viewBox="0 0 24 24" fill="none" stroke={isRecording ? "#dc3232" : isProcessing ? "#FFC107" : "#c9a84c"} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: isRecording ? "#dc3232" : isProcessing ? "#FFC107" : "rgba(201,168,76,0.8)" }}>
                {isProcessing ? "Aguarde…" : isRecording ? "Toque para parar" : "Toque para gravar"}
              </span>
            </button>

            <p className="text-xs text-center max-w-xs" style={{ color: "rgba(201,168,76,0.5)" }}>
              Toque para iniciar · Toque novamente para parar · Máx. 30 s
            </p>

            {/* Timer grande */}
            {timer && (
              <div className="font-mono font-black tabular-nums" style={{
                fontSize: "3rem", letterSpacing: "0.05em", lineHeight: 1,
                color: timer.includes("⚠") ? "#f87171" : "#dc3232",
                textShadow: timer.includes("⚠") ? "0 0 20px rgba(248,113,113,0.5)" : "0 0 20px rgba(220,50,50,0.4)",
              }}>
                {timer.replace(" ⚠", "")}
                {timer.includes("⚠") && <span style={{ fontSize: "1.5rem", marginLeft: "0.3rem" }}>⚠</span>}
              </div>
            )}

            {isRecording && <canvas ref={canvasRef} width={300} height={48} className="rounded-xl" style={{ background: "rgba(0,0,0,0.4)" }} />}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: statusColor }}>
            <div className="w-2 h-2 rounded-full" style={{ background: statusColor, animation: statusType === "recording" || statusType === "processing" ? "blink 0.8s ease infinite" : "none" }} />
            {status}
          </div>

          {/* Error */}
          {error && (
            <div className="w-full rounded-xl p-4 text-sm" style={{ background: "rgba(220,50,50,0.08)", border: "1px solid rgba(220,50,50,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          {/* Result — layout original */}
          {result && (
            <div className="w-full rounded-2xl overflow-hidden" style={{ background: "rgba(26,21,0,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(201,168,76,0.6)" }}>🎙 {result.from}</p>
                <p className="text-base leading-relaxed" style={{ color: "rgb(245,240,220)" }}>{result.transcript}</p>
              </div>
              <div className="p-4" style={{ borderLeft: "3px solid #FFC107", background: "rgba(255,193,7,0.05)" }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c9a84c" }}>🔁 {result.to}</p>
                <p className="text-xl font-semibold leading-relaxed" style={{ color: "#FFC107" }}>{result.translation}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(result.translation).catch(() => {}); }}
                    className="text-xs font-bold flex items-center gap-1"
                    style={{ color: "#c9a84c", background: "none", border: "none", cursor: "pointer" }}
                  >
                    📋 Copiar
                  </button>
                  <button
                    onClick={shareResult}
                    className="text-xs font-bold flex items-center gap-1"
                    style={{ color: "#c9a84c", background: "none", border: "none", cursor: "pointer" }}
                  >
                    📤 Partilhar
                  </button>
                  {result.audio && (
                    <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#FFC107", border: "none", cursor: "pointer" }}>
                      {isPlaying
                        ? <svg width={16} height={16} viewBox="0 0 24 24" fill="#000"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                        : <svg width={16} height={16} viewBox="0 0 24 24" fill="#000"><path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                      }
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs" style={{ color: "rgba(201,168,76,0.5)" }}>Velocidade</span>
                    <input type="range" min={0.5} max={1} step={0.05} value={speed}
                      onChange={e => setSpeed(parseFloat(e.target.value))}
                      className="w-20 accent-yellow-400" />
                    <span className="text-xs font-bold w-6" style={{ color: "#FFC107" }}>{speed === 1 ? "1×" : `${speed.toFixed(2)}×`}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card Transliteração */}
          <div className="w-full rounded-2xl p-4 flex flex-col gap-2" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)",
          }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>Transliteração</p>
            {result?.transliteration ? (
              <p className="text-2xl font-semibold leading-snug" style={{ color: "#f5f0dc", letterSpacing: "0.04em" }}>
                {result.transliteration}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "rgba(201,168,76,0.25)" }}>
                Grave uma frase para ver a pronúncia fonética aqui.
              </p>
            )}
          </div>

          {/* Card Controles */}
          <div className="w-full rounded-2xl p-4 flex flex-col gap-3" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)",
          }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>Controles</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>Filtro de ruído</span>
              <button
                onClick={() => setNoiseOn(!noiseOn)}
                className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all"
                style={{
                  background: noiseOn ? "rgba(255,193,7,0.12)" : "rgba(255,255,255,0.05)",
                  border: noiseOn ? "1px solid rgba(255,193,7,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  color: noiseOn ? "#FFC107" : "rgba(201,168,76,0.5)",
                }}
              >
                🎙 {noiseOn ? "Ativo" : "Off"}
              </button>
            </div>
            {noiseOn && (
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>Corte</span>
                <input type="range" min={0} max={100} step={5} value={gateLevel}
                  onChange={e => setGateLevel(Number(e.target.value))}
                  className="flex-1 accent-yellow-400" />
                <span className="text-xs font-bold w-8 text-right" style={{ color: "#FFC107" }}>
                  {gateLevel === 0 ? "Off" : `${gateLevel}%`}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blink      { 0%,100%{opacity:1}  50%{opacity:0.3} }
        @keyframes waveIdle   { 0%,100%{height:5px} 50%{height:16px} }
        @keyframes waveActive { 0%,100%{height:8px} 50%{height:32px} }
      `}</style>
    </div>
  );
}
