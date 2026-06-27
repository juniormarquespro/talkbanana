"use client";

import { useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  proMensal: number;
  proAnual: number;
  gratuitos: number;
  semCreditos: number;
  mrr: number;
}

interface User {
  id: string;
  email: string | null;
  nome_completo: string | null;
  plano: string | null;
  creditos: number | null;
  created_at: string | null;
  onboarding_done: boolean | null;
}

interface Props {
  stats: Stats;
  recentUsers: User[];
}

export default function AdminClient({ stats, recentUsers }: Props) {
  const [creditosInput, setCreditosInput] = useState<Record<string, string>>({});
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const [msgUser, setMsgUser] = useState<Record<string, string>>({});

  async function adicionarCreditos(userId: string) {
    const qtd = parseInt(creditosInput[userId] || "0");
    if (!qtd || qtd <= 0) return;
    setLoadingUser(userId);
    try {
      const res = await fetch("/api/admin/creditos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, quantidade: qtd }),
      });
      const data = await res.json();
      setMsgUser(prev => ({ ...prev, [userId]: res.ok ? `✓ +${qtd} créditos` : data.error }));
      setCreditosInput(prev => ({ ...prev, [userId]: "" }));
    } finally {
      setLoadingUser(null);
      setTimeout(() => setMsgUser(prev => ({ ...prev, [userId]: "" })), 3000);
    }
  }

  const planoLabel = (plano: string | null) => {
    if (plano === "pro_mensal") return { label: "Pro Mensal", color: "#f7c613" };
    if (plano === "pro_anual") return { label: "Pro Anual", color: "#4ade80" };
    return { label: "Gratuito", color: "rgba(201,168,76,0.5)" };
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-30" style={{
        background: "rgba(10,8,0,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,158,11,0.2)",
      }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-black tracking-widest uppercase flex items-center gap-2" style={{ color: "#f7c613" }}>
              🍌 TalkBanana
            </Link>
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
              ⚙ Admin
            </span>
          </div>
          <span className="text-xs" style={{ color: "rgba(201,168,76,0.5)" }}>Painel de controlo</span>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {[
              { label: "Usuários totais", value: stats.totalUsers, color: "247,198,19" },
              { label: "Pro Mensal", value: stats.proMensal, color: "247,198,19" },
              { label: "Pro Anual", value: stats.proAnual, color: "74,222,128" },
              { label: "Gratuitos", value: stats.gratuitos, color: "201,168,76" },
              { label: "Sem créditos", value: stats.semCreditos, color: "239,68,68" },
              { label: "MRR estimado", value: `R$ ${stats.mrr}`, color: "74,222,128" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{
                background: `linear-gradient(to bottom, rgba(${s.color},0.1), rgba(${s.color},0.02))`,
                border: `1px solid rgba(${s.color},0.2)`,
              }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: `rgba(${s.color},0.7)` }}>{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabela de usuários */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.15)" }}>
            <div className="px-5 py-4" style={{ background: "rgba(18,14,0,0.8)", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
              <h2 className="font-bold text-white">Últimos 20 usuários</h2>
            </div>
            <div className="divide-y" style={{ "--divide-color": "rgba(201,168,76,0.06)" } as React.CSSProperties}>
              {recentUsers.map(u => {
                const { label, color } = planoLabel(u.plano);
                return (
                  <div key={u.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: "rgba(10,8,0,0.6)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.email ?? "—"}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(201,168,76,0.5)" }}>
                        {u.nome_completo ?? "Sem nome"} · {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                        {!u.onboarding_done && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Onboarding pendente</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `rgba(${color.replace("#","")},0.1)`, color, border: `1px solid rgba(${color},0.2)` }}>
                        {label}
                      </span>
                      {u.plano === "gratuito" && (
                        <span className="text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>
                          {u.creditos ?? 0} cred.
                        </span>
                      )}

                      {/* Dar créditos */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={999}
                          placeholder="0"
                          value={creditosInput[u.id] ?? ""}
                          onChange={e => setCreditosInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="w-14 rounded-lg px-2 py-1 text-xs text-center"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", color: "white" }}
                        />
                        <button
                          onClick={() => adicionarCreditos(u.id)}
                          disabled={loadingUser === u.id || !creditosInput[u.id]}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all"
                          style={{
                            background: "rgba(247,198,19,0.15)", border: "1px solid rgba(247,198,19,0.3)",
                            color: "#f7c613", cursor: "pointer",
                            opacity: !creditosInput[u.id] ? 0.4 : 1,
                          }}
                        >
                          {loadingUser === u.id ? "…" : "+ Cred."}
                        </button>
                        {msgUser[u.id] && (
                          <span className="text-xs font-bold" style={{ color: msgUser[u.id]?.startsWith("✓") ? "#4ade80" : "#f87171" }}>
                            {msgUser[u.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
