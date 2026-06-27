"use client";

import { useState } from "react";
import Link from "next/link";

const PONTOS = [
  {
    icon: "🔒",
    titulo: "Seus dados são protegidos",
    texto: "Tratamos seus dados de acordo com a LGPD. Não vendemos suas informações pessoais.",
  },
  {
    icon: "©️",
    titulo: "Propriedade intelectual",
    texto: "Todo o conteúdo da plataforma é protegido por direitos autorais.",
  },
  {
    icon: "🚫",
    titulo: "Uso responsável",
    texto: "É proibido usar a plataforma para fins ilegais ou fraudulentos.",
  },
  {
    icon: "💳",
    titulo: "Créditos e pagamentos",
    texto: "Créditos são pessoais, intransferíveis e não reembolsáveis após o uso.",
  },
];

export default function OnboardingTermosPage() {
  const [aceito, setAceito] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAceitar() {
    if (!aceito || loading) return;
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/aceitar-termos", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao salvar. Tente novamente.");
      window.location.href = "/onboarding/boas-vindas";
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg fade-up">
        <div className="card-glass overflow-hidden">

          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(184,157,252,0.12)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#d4b05a" }}>
              Passo 1 de 2
            </p>
            <h1 className="text-lg font-bold text-white">Antes de continuar ✨</h1>
            <p className="text-sm mt-1" style={{ color: "#7a6a9a" }}>
              Leia os pontos principais e aceite os nossos termos.
            </p>
          </div>

          <div className="px-7 py-5 flex flex-col gap-4">
            {PONTOS.map(p => (
              <div key={p.titulo} className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#d4b05a" }}>{p.titulo}</p>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: "#7a6a9a" }}>{p.texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mx-7 mb-5 rounded-xl px-4 py-3"
            style={{ background: "rgba(184,157,252,0.05)", border: "1px solid rgba(184,157,252,0.1)" }}
          >
            <p className="text-xs" style={{ color: "#7a6a9a" }}>Leia os documentos completos:</p>
            <div className="flex gap-4 mt-1">
              <Link href="/termos-de-uso" target="_blank" className="text-xs font-semibold underline" style={{ color: "#b89dfc" }}>
                Termos de Uso →
              </Link>
              <Link href="/politica-de-privacidade" target="_blank" className="text-xs font-semibold underline" style={{ color: "#b89dfc" }}>
                Política de Privacidade →
              </Link>
            </div>
          </div>

          <div className="px-7 pb-5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={aceito} onChange={e => setAceito(e.target.checked)} className="sr-only" />
                <div
                  className="w-5 h-5 rounded flex items-center justify-center transition-all"
                  style={{
                    background: aceito ? "rgba(139,76,247,0.7)" : "rgba(15,8,35,0.8)",
                    border: aceito ? "1px solid rgba(139,76,247,0.9)" : "1px solid rgba(184,157,252,0.3)",
                  }}
                >
                  {aceito && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm leading-relaxed" style={{ color: "#c4b8e0" }}>
                Li e aceito os{" "}
                <Link href="/termos-de-uso" target="_blank" className="underline" style={{ color: "#b89dfc" }}>Termos de Uso</Link>{" "}
                e a{" "}
                <Link href="/politica-de-privacidade" target="_blank" className="underline" style={{ color: "#b89dfc" }}>Política de Privacidade</Link>.
              </span>
            </label>
          </div>

          {erro && (
            <p className="mx-7 mb-3 text-sm text-center py-2 px-4 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
              {erro}
            </p>
          )}

          <div className="px-7 pb-7">
            <button onClick={handleAceitar} disabled={!aceito || loading} className="btn-primary">
              {loading ? "Salvando…" : "Aceitar e continuar →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
