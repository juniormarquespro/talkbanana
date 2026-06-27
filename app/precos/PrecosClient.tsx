"use client";

import { useState } from "react";
import Link from "next/link";

const PLANOS = [
  {
    id: "mensal",
    nome: "Pro Mensal",
    preco: "R$ 29",
    periodo: "/mês",
    economia: null,
    descricao: "Perfeito para começar sem compromisso",
    features: [
      "Traduções ilimitadas",
      "Todos os 9 idiomas",
      "Filtro de ruído avançado",
      "TTS em alta qualidade",
      "Histórico de conversas",
    ],
    cta: "Assinar mensal",
    accent: "247,198,19",
  },
  {
    id: "anual",
    nome: "Pro Anual",
    preco: "R$ 19",
    periodo: "/mês",
    economia: "Economize 35%",
    descricao: "O melhor custo-benefício · R$ 228/ano",
    features: [
      "Tudo do Pro Mensal",
      "Economize R$ 120/ano",
      "Suporte prioritário",
      "Acesso antecipado a novidades",
      "Selo de fundador 🍌",
    ],
    cta: "Assinar anual",
    accent: "201,168,76",
    destaque: true,
  },
];

interface Props {
  planoAtual: string;
  hasStripeCustomer: boolean;
}

export default function PrecosClient({ planoAtual, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const isPro = planoAtual === "pro_mensal" || planoAtual === "pro_anual";

  async function handleSubscribe(planoId: string) {
    setLoading(planoId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: planoId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-30" style={{
        background: "rgba(10,8,0,0.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
      }}>
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="text-sm font-black tracking-widest uppercase flex items-center gap-2" style={{ color: "#f7c613" }}>
            🍌 TalkBanana
          </Link>
          <span className="text-xs" style={{ color: "rgba(201,168,76,0.5)" }}>Planos</span>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto fade-up">

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white mb-3">Escolha o seu plano</h1>
            <p style={{ color: "rgba(201,168,76,0.7)" }}>
              {isPro ? "Você já é Pro! Gerencie sua assinatura abaixo." : "Traduções ilimitadas, sem limites."}
            </p>
          </div>

          {isPro && (
            <div className="rounded-2xl p-6 mb-6 text-center" style={{
              background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
            }}>
              <p className="text-lg font-bold text-white mb-1">✦ Plano {planoAtual === "pro_anual" ? "Pro Anual" : "Pro Mensal"} ativo</p>
              <p className="text-sm mb-4" style={{ color: "rgba(74,222,128,0.8)" }}>Obrigado por apoiar o TalkBanana!</p>
              {hasStripeCustomer && (
                <button onClick={handlePortal} disabled={loading === "portal"}
                  className="px-6 py-2 rounded-xl text-sm font-bold transition-all" style={{
                    background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)",
                    color: "#4ade80", cursor: "pointer",
                  }}>
                  {loading === "portal" ? "Abrindo…" : "Gerir assinatura →"}
                </button>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            {PLANOS.map(plano => (
              <div key={plano.id} className="rounded-2xl p-6 flex flex-col gap-4 relative" style={{
                background: plano.destaque
                  ? `linear-gradient(to bottom, rgba(${plano.accent},0.18), rgba(${plano.accent},0.04))`
                  : `linear-gradient(to bottom, rgba(${plano.accent},0.1), rgba(${plano.accent},0.02))`,
                border: `1px solid rgba(${plano.accent},${plano.destaque ? "0.45" : "0.2"})`,
                boxShadow: plano.destaque ? `0 0 40px rgba(${plano.accent},0.15)` : "none",
              }}>
                {plano.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest" style={{
                    background: `rgb(${plano.accent})`, color: "#000",
                  }}>Mais popular</div>
                )}
                {plano.economia && (
                  <span className="self-start px-2 py-0.5 rounded-full text-xs font-bold" style={{
                    background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)",
                  }}>{plano.economia}</span>
                )}

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: `rgb(${plano.accent})` }}>{plano.nome}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{plano.preco}</span>
                    <span className="text-sm mb-1" style={{ color: "rgba(201,168,76,0.6)" }}>{plano.periodo}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "rgba(201,168,76,0.6)" }}>{plano.descricao}</p>
                </div>

                <ul className="flex flex-col gap-2">
                  {plano.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgb(245,240,220)" }}>
                      <span style={{ color: `rgb(${plano.accent})` }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plano.id)}
                  disabled={!!loading || isPro}
                  className="mt-auto py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: isPro
                      ? "rgba(255,255,255,0.05)"
                      : `linear-gradient(to bottom, rgba(${plano.accent},0.55), rgba(${plano.accent},0.08))`,
                    border: isPro ? "1px solid rgba(255,255,255,0.1)" : `1px solid rgba(${plano.accent},0.8)`,
                    color: isPro ? "rgba(255,255,255,0.3)" : "rgb(245,240,220)",
                    cursor: isPro || loading ? "not-allowed" : "pointer",
                    boxShadow: !isPro ? `0 0 16px rgba(${plano.accent},0.25)` : "none",
                  }}
                >
                  {loading === plano.id ? "Redirecionando…" : isPro ? "Plano ativo" : plano.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-xs" style={{ color: "rgba(201,168,76,0.4)" }}>
            Pagamento seguro via Stripe · Cancele quando quiser
          </p>
        </div>
      </main>
    </div>
  );
}
