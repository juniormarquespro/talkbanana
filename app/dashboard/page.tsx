import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/is-admin";
import { TERMS_VERSION } from "@/lib/terms-version";

async function logout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ cadastro?: string }> }) {
  await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, tratamento, creditos, plano, terms_accepted_version, onboarding_done")
    .eq("id", user.id)
    .single();

  const admin = isAdmin(user.email);

  if (!admin) {
    if (!perfil?.terms_accepted_version || perfil.terms_accepted_version !== TERMS_VERSION) {
      redirect("/onboarding/termos");
    }
    if (!perfil?.onboarding_done) {
      redirect("/onboarding/boas-vindas");
    }
  }

  const displayName =
    perfil?.tratamento?.trim() ||
    perfil?.nome_completo?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "usuário";

  const plano = perfil?.plano ?? "gratuito";
  const isPro = plano === "pro_mensal" || plano === "pro_anual";
  const creditos = perfil?.creditos ?? 0;
  const creditosBaixos = !isPro && creditos <= 3;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-30" style={{
        background: "rgba(10,8,0,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
      }}>
        <div className="flex items-center justify-between px-4 h-14">
          <span className="text-sm font-black tracking-widest uppercase flex items-center gap-2" style={{ color: "#f7c613" }}>
            🍌 TalkBanana
          </span>
          <div className="flex items-center gap-3">
            {admin && (
              <Link href="/admin" className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b",
              }}>⚙ Admin</Link>
            )}
            {!isPro && (
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                background: creditosBaixos ? "rgba(239,68,68,0.12)" : "rgba(201,168,76,0.08)",
                border: creditosBaixos ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(201,168,76,0.2)",
                color: creditosBaixos ? "#f87171" : "#c9a84c",
              }}>
                {creditos} crédito{creditos !== 1 ? "s" : ""}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
              background: isPro ? "rgba(247,198,19,0.15)" : "rgba(201,168,76,0.08)",
              border: isPro ? "1px solid rgba(247,198,19,0.4)" : "1px solid rgba(201,168,76,0.2)",
              color: isPro ? "#f7c613" : "#c9a84c",
            }}>
              {isPro ? "✦ Pro" : "Gratuito"}
            </span>
            <form action={logout}>
              <button type="submit" className="text-xs px-2.5 py-1 rounded-lg" style={{
                color: "rgba(201,168,76,0.5)", border: "1px solid rgba(201,168,76,0.12)",
                background: "transparent", cursor: "pointer",
              }}>Sair</button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#c9a84c" }}>
              Dashboard
            </p>
            <h1 className="text-3xl font-extrabold text-white">
              Olá, {displayName} 🍌
            </h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(201,168,76,0.7)" }}>
              Pronto para traduzir?
            </p>
          </div>

          {/* Banner créditos baixos */}
          {creditosBaixos && creditos > 0 && (
            <div className="rounded-xl p-4 mb-5 flex items-center justify-between gap-3" style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            }}>
              <p className="text-sm" style={{ color: "#f87171" }}>
                ⚠️ Restam apenas <strong>{creditos} crédito{creditos !== 1 ? "s" : ""}</strong>. Faça upgrade para traduções ilimitadas.
              </p>
              <Link href="/precos" className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap" style={{
                background: "rgba(247,198,19,0.15)", border: "1px solid rgba(247,198,19,0.4)", color: "#f7c613",
              }}>Ver planos</Link>
            </div>
          )}

          {/* Banner sem créditos */}
          {!isPro && creditos === 0 && (
            <div className="rounded-xl p-4 mb-5 flex items-center justify-between gap-3" style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
            }}>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
                🚫 Créditos esgotados. Assine o Pro para continuar traduzindo.
              </p>
              <Link href="/precos" className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap" style={{
                background: "rgba(247,198,19,0.2)", border: "1px solid rgba(247,198,19,0.6)", color: "#f7c613",
              }}>Assinar →</Link>
            </div>
          )}

          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/traduzir" className="rounded-2xl p-6 flex flex-col gap-3 transition-all active:scale-[0.98]" style={{
              background: "linear-gradient(to bottom, rgba(247,198,19,0.15), rgba(247,198,19,0.03))",
              border: "1px solid rgba(247,198,19,0.3)",
              backdropFilter: "blur(10px)",
            }}>
              <div className="text-3xl">🎙️</div>
              <h3 className="font-bold text-white text-lg">Traduzir ao vivo</h3>
              <p className="text-sm" style={{ color: "rgba(201,168,76,0.7)" }}>Fale e o app traduz em tempo real com Whisper + IA</p>
              <span className="text-xs font-semibold mt-auto self-end px-3 py-1 rounded-full" style={{
                background: "rgba(247,198,19,0.15)", color: "#f7c613", border: "1px solid rgba(247,198,19,0.3)",
              }}>Abrir →</span>
            </Link>

            <Link href="/precos" className="rounded-2xl p-6 flex flex-col gap-3 transition-all active:scale-[0.98]" style={{
              background: isPro
                ? "linear-gradient(to bottom, rgba(74,222,128,0.12), rgba(74,222,128,0.02))"
                : "linear-gradient(to bottom, rgba(201,168,76,0.1), rgba(201,168,76,0.02))",
              border: isPro ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(201,168,76,0.2)",
              backdropFilter: "blur(10px)",
            }}>
              <div className="text-3xl">{isPro ? "✦" : "⭐"}</div>
              <h3 className="font-bold text-white text-lg">{isPro ? "Plano Pro ativo" : "Upgrade para Pro"}</h3>
              <p className="text-sm" style={{ color: "rgba(201,168,76,0.7)" }}>
                {isPro ? "Sem limites de tradução. Obrigado pelo suporte!" : "Traduções ilimitadas e idiomas premium"}
              </p>
              <span className="text-xs font-semibold mt-auto self-end px-3 py-1 rounded-full" style={{
                background: isPro ? "rgba(74,222,128,0.15)" : "rgba(201,168,76,0.12)",
                color: isPro ? "#4ade80" : "#c9a84c",
                border: isPro ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(201,168,76,0.2)",
              }}>
                {isPro ? "Gerir plano →" : "Ver planos →"}
              </span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
