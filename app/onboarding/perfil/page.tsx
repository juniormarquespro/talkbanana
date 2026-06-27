"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPerfilPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [tratamento, setTratamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/perfil-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: nome.trim(),
          tratamento: tratamento.trim() || nome.trim().split(" ")[0],
          onboarding_done: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar.");
      }

      router.push("/dashboard");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md fade-up">
        <div className="card-glass overflow-hidden">

          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(184,157,252,0.12)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#d4b05a" }}>
              Passo 2 de 2
            </p>
            <h1 className="text-lg font-bold text-white">Seu perfil</h1>
            <p className="text-sm mt-1" style={{ color: "#7a6a9a" }}>
              Como devemos te chamar?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-7 py-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#7a6a9a" }}>
                Nome completo *
              </label>
              <input
                type="text"
                placeholder="João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="input-base"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#7a6a9a" }}>
                Como prefere ser chamado? (opcional)
              </label>
              <input
                type="text"
                placeholder="João"
                value={tratamento}
                onChange={(e) => setTratamento(e.target.value)}
                className="input-base"
              />
              <p className="text-xs mt-1" style={{ color: "rgba(184,157,252,0.4)" }}>
                Apelido ou primeiro nome
              </p>
            </div>

            {erro && (
              <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
                {erro}
              </p>
            )}

            <button type="submit" disabled={loading || !nome.trim()} className="btn-primary mt-2">
              {loading ? "Salvando…" : "Concluir →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
