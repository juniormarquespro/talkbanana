"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ─── Custos estimados por tradução (USD) ─────────────────────────────────── */
const CUSTO_WHISPER_USD  = 0.003;   // ~30s de áudio × $0,006/min
const CUSTO_HAIKU_USD    = 0.00056; // ~200 in + 100 out tokens no Haiku 4.5
const CUSTO_TTS_USD      = 0.0015;  // ~100 chars × $0,000015/char (TTS-1)
const CUSTO_POR_TRAD_USD = CUSTO_WHISPER_USD + CUSTO_HAIKU_USD + CUSTO_TTS_USD; // ~$0,005
const USD_BRL            = 6.10;    // taxa fixa de referência

const CUSTO_POR_TRAD_BRL = CUSTO_POR_TRAD_USD * USD_BRL;
const INFRA_BRL          = 122; // Vercel Pro ~$20/mês ≈ R$122

const PLANOS_INFO = [
  { key: "gratuito",   nome: "Gratuito",   preco: 0,     creditos: 10,  cor: "201,168,76" },
  { key: "pro_mensal", nome: "Pro Mensal", preco: 59.90, creditos: 600, cor: "247,198,19" },
  { key: "pro_anual",  nome: "Pro Anual",  preco: 499/12,creditos: 600, cor: "74,222,128", anual: true },
];

interface Stats {
  totalUsers: number;
  proMensal: number;
  proAnual: number;
  gratuitos: number;
  semCreditos: number;
  mrr: number;
}

interface AdminUser {
  id: string;
  email: string;
  nome: string;
  plano: string;
  creditos: number;
  created_at: string;
  confirmado: boolean;
}

interface Props {
  stats: Stats;
}

const COR_PLANO: Record<string, string> = {
  gratuito:   "#c9a84c",
  pro_mensal: "#f7c613",
  pro_anual:  "#4ade80",
  master:     "#f97316",
  convidado:  "#a78bfa",
};

export default function AdminClient({ stats }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(new Set(["kpis"]));
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  /* ── Créditos bónus ── */
  const [bonusEmail, setBonusEmail] = useState("");
  const [bonusUser, setBonusUser] = useState<AdminUser | null>(null);
  const [bonusQtd, setBonusQtd] = useState(0);
  const [bonusStatus, setBonusStatus] = useState("");
  const [bonusLoading, setBonusLoading] = useState(false);
  const [bonusSug, setBonusSug] = useState<AdminUser[]>([]);
  const [bonusSugOpen, setBonusSugOpen] = useState(false);

  /* ── Definir plano ── */
  const [planoEmail, setPlanoEmail] = useState("");
  const [planoUser, setPlanoUser] = useState<AdminUser | null>(null);
  const [planoSel, setPlanoSel] = useState("gratuito");
  const [planoStatus, setPlanoStatus] = useState("");
  const [planoLoading, setPlanoLoading] = useState(false);
  const [planoSug, setPlanoSug] = useState<AdminUser[]>([]);
  const [planoSugOpen, setPlanoSugOpen] = useState(false);

  /* ── Lista de users ── */
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState("");

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Carrega lista de users uma vez
  useEffect(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .finally(() => setUsersLoading(false));
  }, []);

  /* ── Autocomplete helpers ── */
  function filterUsers(q: string) {
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(lower)).slice(0, 6);
  }

  function Sugestoes({ lista, onSelect }: { lista: AdminUser[]; onSelect: (u: AdminUser) => void }) {
    if (lista.length === 0) return null;
    return (
      <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(10,8,0,0.98)", border: "1px solid rgba(201,168,76,0.25)" }}>
        {lista.map((u) => (
          <button key={u.id} type="button" onMouseDown={() => onSelect(u)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
            <span className="text-sm text-white truncate">{u.email}</span>
            <span className="text-xs font-bold ml-2 px-2 py-0.5 rounded-full shrink-0"
              style={{ color: COR_PLANO[u.plano] ?? "#c9a84c", background: "rgba(255,255,255,0.05)", border: `1px solid ${COR_PLANO[u.plano] ?? "#c9a84c"}33` }}>
              {u.plano}
            </span>
          </button>
        ))}
      </div>
    );
  }

  /* ── Créditos bónus ── */
  async function aplicarBonus() {
    if (!bonusUser || !bonusQtd) return;
    setBonusLoading(true); setBonusStatus("");
    const res = await fetch("/api/admin/creditos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: bonusUser.id, quantidade: bonusQtd }),
    });
    if (res.ok) {
      const novos = bonusUser.creditos + bonusQtd;
      setBonusStatus(`✓ +${bonusQtd} créditos · Total: ${novos}`);
      setUsers((prev) => prev.map((u) => u.id === bonusUser!.id ? { ...u, creditos: novos } : u));
      setBonusUser((prev) => prev ? { ...prev, creditos: novos } : null);
      setBonusQtd(0);
    } else {
      const err = await res.json().catch(() => ({}));
      setBonusStatus(`Erro: ${err.error ?? "desconhecido"}`);
    }
    setBonusLoading(false);
  }

  /* ── Definir plano ── */
  async function aplicarPlano() {
    if (!planoUser) return;
    setPlanoLoading(true); setPlanoStatus("");
    const res = await fetch("/api/admin/set-plano", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: planoUser.id, plano: planoSel }),
    });
    if (res.ok) {
      setPlanoStatus(`✓ Plano ${planoSel} aplicado a ${planoUser.email}`);
      setUsers((prev) => prev.map((u) => u.id === planoUser!.id ? { ...u, plano: planoSel } : u));
      setPlanoEmail(""); setPlanoUser(null);
    } else {
      const err = await res.json().catch(() => ({}));
      setPlanoStatus(`Erro: ${err.error ?? "desconhecido"}`);
    }
    setPlanoLoading(false);
  }

  /* ── Apagar user ── */
  async function apagarUser(id: string) {
    setDeleteLoading(true); setDeleteStatus("");
    const res = await fetch("/api/admin/users", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteStatus("✓ Conta apagada.");
      setDeleteConfirm(null);
    } else {
      const err = await res.json().catch(() => ({}));
      setDeleteStatus(`Erro: ${err.error ?? "desconhecido"}`);
    }
    setDeleteLoading(false);
    setTimeout(() => setDeleteStatus(""), 4000);
  }

  const filteredUsers = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.nome.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Custos e margens por plano ─────────────────────────────────────────── */
  const assinantes: Record<string, number> = {
    gratuito: stats.gratuitos,
    pro_mensal: stats.proMensal,
    pro_anual: stats.proAnual,
  };

  const receitaMRR = stats.mrr;
  const custoIAMRR = (
    (stats.proMensal * 600 + stats.proAnual * 600) * CUSTO_POR_TRAD_BRL
  );
  const margemMRR = receitaMRR - custoIAMRR - INFRA_BRL;

  /* ─── Seção helper ─────────────────────────────────────────────────────────── */
  function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
    const isOpen = open.has(id);
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(26,21,0,0.5)", border: "1px solid rgba(201,168,76,0.15)" }}>
        <button type="button" onClick={() => toggle(id)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition">
          <div className="text-left">
            <p className="text-sm font-bold text-white">{title}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: "rgba(201,168,76,0.5)" }}>{sub}</p>}
          </div>
          <span className="text-xs transition-transform duration-200" style={{ color: "#c9a84c", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </button>
        {isOpen && <div className="border-t" style={{ borderColor: "rgba(201,168,76,0.1)" }}>{children}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0800" }}>
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-30" style={{
        background: "rgba(10,8,0,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,158,11,0.2)",
      }}>
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.push("/dashboard")}
            className="text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(247,198,19,0.12)", border: "1px solid rgba(247,198,19,0.3)", color: "#f7c613" }}>
            ← Dashboard
          </button>
          <span className="text-sm font-black tracking-widest text-white">🍌 Admin</span>
        </div>
      </nav>

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Utilizadores", value: stats.totalUsers, color: "247,198,19" },
              { label: "Pro Mensal",   value: stats.proMensal,  color: "247,198,19" },
              { label: "Pro Anual",    value: stats.proAnual,   color: "74,222,128" },
              { label: "Gratuitos",    value: stats.gratuitos,  color: "201,168,76" },
              { label: "Sem créditos", value: stats.semCreditos, color: "239,68,68" },
              { label: "MRR estimado", value: `R$${stats.mrr}`, color: "74,222,128" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4" style={{
                background: `linear-gradient(to bottom, rgba(${s.color},0.1), rgba(${s.color},0.02))`,
                border: `1px solid rgba(${s.color},0.2)`,
              }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: `rgba(${s.color},0.7)` }}>{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Resumo financeiro */}
          <Section id="financeiro" title="Resumo Financeiro" sub="Custos estimados e margens por plano">
            <div className="p-5 space-y-5">
              {/* Custo por tradução */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(201,168,76,0.6)" }}>Custo por tradução (estimativa)</p>
                <div className="space-y-2">
                  {[
                    { nome: "Whisper (OpenAI)",     valor: CUSTO_WHISPER_USD,   desc: "~30s de áudio" },
                    { nome: "Claude Haiku (Anthropic)", valor: CUSTO_HAIKU_USD, desc: "~300 tokens" },
                    { nome: "TTS-1 (OpenAI)",        valor: CUSTO_TTS_USD,     desc: "~100 chars" },
                  ].map((c) => (
                    <div key={c.nome} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-white">{c.nome}</span>
                        <span className="text-xs ml-2" style={{ color: "rgba(201,168,76,0.5)" }}>{c.desc}</span>
                      </div>
                      <span style={{ color: "#f87171" }}>${c.valor.toFixed(4)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
                    <span className="text-white">Total por tradução</span>
                    <span style={{ color: "#f87171" }}>${CUSTO_POR_TRAD_USD.toFixed(4)} ≈ R${CUSTO_POR_TRAD_BRL.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Margens por plano */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(201,168,76,0.6)" }}>Margens por plano (máx. uso de créditos)</p>
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(201,168,76,0.12)" }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                        {["Plano", "Preço/mês", "Créditos", "Custo IA", "Margem R$", "Margem %", "Users"].map((h) => (
                          <th key={h} className="px-3 py-2.5 text-left font-bold uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.6)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PLANOS_INFO.map((p) => {
                        const custoIA = p.creditos * CUSTO_POR_TRAD_BRL;
                        const margem = p.preco - custoIA;
                        const pct = p.preco > 0 ? (margem / p.preco) * 100 : null;
                        const count = assinantes[p.key] ?? 0;
                        return (
                          <tr key={p.key} style={{ borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
                            <td className="px-3 py-3">
                              <span className="font-bold px-2 py-0.5 rounded-full" style={{ background: `rgba(${p.cor},0.12)`, color: `rgb(${p.cor})` }}>
                                {p.nome}{p.anual ? " (÷12)" : ""}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-white font-medium">
                              {p.preco === 0 ? "Grátis" : `R$${p.preco.toFixed(2)}`}
                            </td>
                            <td className="px-3 py-3" style={{ color: "rgba(201,168,76,0.8)" }}>{p.creditos}</td>
                            <td className="px-3 py-3" style={{ color: "#f87171" }}>−R${custoIA.toFixed(2)}</td>
                            <td className="px-3 py-3 font-bold" style={{ color: margem >= 0 ? "#4ade80" : "#f87171" }}>
                              {p.preco === 0 ? `−R${custoIA.toFixed(2)}` : `R$${margem.toFixed(2)}`}
                            </td>
                            <td className="px-3 py-3 font-bold" style={{ color: pct !== null && pct >= 60 ? "#4ade80" : "#f87171" }}>
                              {pct !== null ? `${Math.round(pct)}%` : "—"}
                            </td>
                            <td className="px-3 py-3 text-white font-semibold">{count}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MRR summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Receita MRR",    value: `R$${receitaMRR}`,             color: "#4ade80" },
                  { label: "Custo IA est.",  value: `−R$${custoIAMRR.toFixed(0)}`, color: "#f87171" },
                  { label: "Margem líquida", value: `R$${margemMRR.toFixed(0)}`,   color: margemMRR >= 0 ? "#4ade80" : "#f87171" },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.1)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "rgba(201,168,76,0.5)" }}>{k.label}</p>
                    <p className="text-lg font-black" style={{ color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px]" style={{ color: "rgba(201,168,76,0.4)" }}>
                * Margem líquida = MRR − custo IA estimado − infra R${INFRA_BRL} (Vercel Pro). Custo IA assume 100% uso de créditos. Taxa: $1 = R${USD_BRL}.
              </p>
            </div>
          </Section>

          {/* Créditos Bónus */}
          <Section id="bonus" title="Créditos Bónus" sub="Adicionar créditos extra a um utilizador">
            <div className="p-5 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={bonusEmail}
                  onChange={(e) => {
                    setBonusEmail(e.target.value);
                    setBonusUser(null);
                    setBonusSug(filterUsers(e.target.value));
                    setBonusSugOpen(true);
                  }}
                  onBlur={() => setTimeout(() => setBonusSugOpen(false), 150)}
                  placeholder="Buscar por email…"
                  autoComplete="off"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", outline: "none" }}
                />
                {bonusSugOpen && <Sugestoes lista={bonusSug} onSelect={(u) => { setBonusEmail(u.email); setBonusUser(u); setBonusSug([]); setBonusSugOpen(false); }} />}
              </div>

              {bonusUser && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold px-2 py-0.5 rounded-full text-xs"
                      style={{ color: COR_PLANO[bonusUser.plano] ?? "#c9a84c", border: `1px solid ${COR_PLANO[bonusUser.plano] ?? "#c9a84c"}44`, background: "rgba(255,255,255,0.04)" }}>
                      {bonusUser.plano}
                    </span>
                    <span style={{ color: "#f7c613" }}>{bonusUser.creditos} créditos actuais</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number" min={1} max={9999} value={bonusQtd || ""}
                      onChange={(e) => setBonusQtd(Number(e.target.value))}
                      placeholder="Quantidade"
                      className="w-32 rounded-lg px-3 py-2 text-sm text-white"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", outline: "none" }}
                    />
                    {[10, 50, 100, 300].map((n) => (
                      <button key={n} type="button" onClick={() => setBonusQtd(n)}
                        className="px-3 py-2 rounded-lg text-xs font-bold"
                        style={{ background: "rgba(247,198,19,0.1)", border: "1px solid rgba(247,198,19,0.25)", color: "#f7c613" }}>
                        +{n}
                      </button>
                    ))}
                    <button
                      onClick={aplicarBonus}
                      disabled={bonusLoading || !bonusQtd}
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                      style={{ background: "rgba(247,198,19,0.15)", border: "1px solid rgba(247,198,19,0.4)", color: "#f7c613", opacity: !bonusQtd ? 0.5 : 1, cursor: bonusLoading || !bonusQtd ? "default" : "pointer" }}>
                      {bonusLoading ? "…" : "Aplicar"}
                    </button>
                  </div>
                </div>
              )}
              {bonusStatus && (
                <p className="text-sm font-bold" style={{ color: bonusStatus.startsWith("✓") ? "#4ade80" : "#f87171" }}>{bonusStatus}</p>
              )}
            </div>
          </Section>

          {/* Definir Plano */}
          <Section id="plano" title="Definir Plano" sub="Mudar o plano de um utilizador manualmente">
            <div className="p-5 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={planoEmail}
                  onChange={(e) => {
                    setPlanoEmail(e.target.value);
                    setPlanoUser(null);
                    setPlanoSug(filterUsers(e.target.value));
                    setPlanoSugOpen(true);
                  }}
                  onBlur={() => setTimeout(() => setPlanoSugOpen(false), 150)}
                  placeholder="Buscar por email…"
                  autoComplete="off"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", outline: "none" }}
                />
                {planoSugOpen && <Sugestoes lista={planoSug} onSelect={(u) => { setPlanoEmail(u.email); setPlanoUser(u); setPlanoSug([]); setPlanoSugOpen(false); }} />}
              </div>

              {planoUser && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <p className="text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>
                    Plano actual: <span className="font-bold" style={{ color: COR_PLANO[planoUser.plano] ?? "#c9a84c" }}>{planoUser.plano}</span>
                  </p>
                  <div className="flex gap-2 flex-wrap items-center">
                    {["gratuito", "pro_mensal", "pro_anual", "master", "convidado"].map((p) => (
                      <button key={p} onClick={() => setPlanoSel(p)}
                        className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: planoSel === p ? `rgba(${COR_PLANO[p]?.replace("#","") ?? "255,255,255"},0.12)` : "rgba(255,255,255,0.04)",
                          border: `1px solid ${planoSel === p ? (COR_PLANO[p] ?? "#c9a84c") : "rgba(201,168,76,0.15)"}`,
                          color: planoSel === p ? (COR_PLANO[p] ?? "#c9a84c") : "rgba(201,168,76,0.5)",
                        }}>
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={aplicarPlano}
                      disabled={planoLoading}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ background: "rgba(247,198,19,0.15)", border: "1px solid rgba(247,198,19,0.4)", color: "#f7c613", cursor: planoLoading ? "default" : "pointer" }}>
                      {planoLoading ? "…" : "Aplicar"}
                    </button>
                  </div>
                </div>
              )}
              {planoStatus && (
                <p className="text-sm font-bold" style={{ color: planoStatus.startsWith("✓") ? "#4ade80" : "#f87171" }}>{planoStatus}</p>
              )}
            </div>
          </Section>

          {/* Lista de utilizadores */}
          <Section id="users" title={`Utilizadores (${users.length})`} sub="Lista completa · apagar conta">
            <div className="p-5 space-y-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por email ou nome…"
                className="w-full rounded-xl px-4 py-3 text-sm text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", outline: "none" }}
              />

              {deleteStatus && (
                <p className="text-sm font-bold" style={{ color: deleteStatus.startsWith("✓") ? "#4ade80" : "#f87171" }}>{deleteStatus}</p>
              )}

              {usersLoading ? (
                <p className="text-sm text-center py-8" style={{ color: "rgba(201,168,76,0.5)" }}>Carregando…</p>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="rounded-xl px-4 py-3 flex items-center gap-3"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,168,76,0.08)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{u.email}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "rgba(201,168,76,0.5)" }}>
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          {!u.confirmado && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
                              não confirmado
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>{u.creditos} cred.</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ color: COR_PLANO[u.plano] ?? "#c9a84c", border: `1px solid ${COR_PLANO[u.plano] ?? "#c9a84c"}44`, background: "rgba(255,255,255,0.03)" }}>
                          {u.plano}
                        </span>
                        {deleteConfirm === u.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => apagarUser(u.id)} disabled={deleteLoading}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold"
                              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171", cursor: "pointer" }}>
                              {deleteLoading ? "…" : "Confirmar"}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 rounded-lg text-[10px]"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(201,168,76,0.5)", cursor: "pointer" }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(u.id)}
                            className="px-2 py-1 rounded-lg text-[10px]"
                            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer" }}>
                            Apagar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-center py-6" style={{ color: "rgba(201,168,76,0.4)" }}>Nenhum resultado.</p>
                  )}
                </div>
              )}
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
