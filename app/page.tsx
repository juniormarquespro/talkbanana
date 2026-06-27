"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo, LogoMark } from "@/components/Logo";

const FEATURES = [
  { icon: "🎙", title: "Voz Natural", desc: "Fale normalmente — o Whisper AI transcreve com precisão mesmo em ambientes ruidosos." },
  { icon: "🧠", title: "IA que Entende Contexto", desc: "Claude AI traduz o SIGNIFICADO, não palavra por palavra. Sem erros de falsos amigos." },
  { icon: "🔊", title: "Pronúncia Nativa", desc: "Ouça como um nativo soa de verdade — voz sintetizada profissional em cada idioma." },
  { icon: "🔤", title: "Transliteração", desc: "Leia como pronunciar em português. Sem precisar aprender um alfabeto novo." },
  { icon: "⚡", title: "Resposta em Segundos", desc: "Pipeline completo em menos de 5 segundos. Perfeito para conversas ao vivo." },
  { icon: "🌍", title: "9 Idiomas Suportados", desc: "PT · EN · ES · CA · FR · IT · DE · AR · 中文. Mais idiomas em breve." },
];

const STEPS = [
  { n: "01", icon: "🎙", title: "Fale", desc: "Toque no botão e fale qualquer coisa. Funciona com sotaque, ruído, tudo." },
  { n: "02", icon: "✨", title: "IA Processa", desc: "Whisper transcreve. Claude AI traduz o significado real. TTS sintetiza a voz." },
  { n: "03", icon: "🔊", title: "Ouça e Use", desc: "Tradução toca automaticamente. Copie o texto, partilhe ou ouça mais devagar." },
];

const IDIOMAS = [
  { flag: "🇧🇷", name: "Português" },
  { flag: "🇬🇧", name: "English" },
  { flag: "🇪🇸", name: "Español" },
  { flag: "🏴", name: "Català" },
  { flag: "🇫🇷", name: "Français" },
  { flag: "🇮🇹", name: "Italiano" },
  { flag: "🇩🇪", name: "Deutsch" },
  { flag: "🇸🇦", name: "Árabe" },
  { flag: "🇨🇳", name: "中文" },
];

const PLANOS = [
  {
    id: "gratuito",
    nome: "Grátis",
    preco: "R$0",
    periodo: "",
    desc: "Para experimentar",
    creditos: "10 traduções",
    destaque: false,
    items: ["10 créditos ao criar conta", "Todos os 9 idiomas", "Transliteração incluída", "Voz masculina e feminina"],
  },
  {
    id: "pro_mensal",
    nome: "Pro",
    preco: "R$59,90",
    periodo: "/mês",
    desc: "Para uso frequente",
    creditos: "600 traduções/mês",
    destaque: true,
    items: ["600 créditos/mês (renovam dia 1)", "Todos os 9 idiomas", "Transliteração incluída", "Voz masculina e feminina", "Suporte prioritário"],
  },
  {
    id: "pack",
    nome: "Pacotes Avulso",
    preco: "A partir de R$9,90",
    periodo: "",
    desc: "Para uso esporádico",
    creditos: "60 a 300 créditos",
    destaque: false,
    items: ["60 créditos por R$9,90", "150 créditos por R$24,90", "300 créditos por R$59,90", "Nunca expiram"],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "cadastro">("cadastro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToAuth(t: "login" | "cadastro" = "cadastro") {
    setTab(t);
    authRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/signup";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type: "error", text: data.error }); setLoading(false); return; }
    if (tab === "cadastro") { setMsg({ type: "success", text: data.message || "Verifique seu email." }); setLoading(false); return; }
    const supabase = createClient();
    await supabase.auth.refreshSession();
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    window.location.href = "/api/auth/google";
  }

  return (
    <div style={{ background: "#0a0800", minHeight: "100vh", color: "#f5f0dc" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: navScrolled ? "rgba(10,8,0,0.92)" : "transparent",
        backdropFilter: navScrolled ? "blur(16px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(201,168,76,0.12)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={30} variant="dark" textSize="1rem" />
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={() => scrollToAuth("login")} style={{
              background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "rgba(201,168,76,0.8)",
              borderRadius: "0.5rem", padding: "0.45rem 1rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            }}>Entrar</button>
            <button onClick={() => scrollToAuth("cadastro")} style={{
              background: "linear-gradient(135deg, rgba(247,198,19,0.55), rgba(201,168,76,0.25))",
              border: "1px solid rgba(247,198,19,0.7)", color: "#f5f0dc",
              borderRadius: "0.5rem", padding: "0.45rem 1.1rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 0 16px rgba(247,198,19,0.2)",
            }}>Começar grátis</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", paddingTop: "7rem", paddingBottom: "5rem" }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(247,198,19,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative" }}>
          {/* Logo hero */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <Logo size={72} variant="dark" textSize="2rem" />
          </div>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <span style={{
              background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.25)",
              color: "#FFC107", borderRadius: "999px", padding: "0.3rem 0.9rem", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", fontFamily: "'Poppins', sans-serif",
            }}>✦ POWERED BY OPENAI + CLAUDE AI</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4.2rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.25rem", letterSpacing: "-0.02em", fontFamily: "'Poppins', sans-serif" }}>
            Fale qualquer coisa.<br />
            <span style={{ color: "#FFC107" }}>Ela traduz instantaneamente.</span>
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: "rgba(255,255,255,0.55)", maxWidth: 540, margin: "0 auto 0.5rem", lineHeight: 1.7 }}>
            Tradução de voz em tempo real com IA. Toque, fale e ouça a tradução com voz nativa — em segundos.
          </p>
          <p style={{ fontSize: "0.82rem", color: "rgba(255,193,7,0.5)", marginBottom: "2rem", letterSpacing: "0.1em", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>
            TALK TO ANYONE. ANYWHERE.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => scrollToAuth("cadastro")} style={{
              padding: "0.85rem 2.2rem", borderRadius: "0.75rem", fontWeight: 800, fontSize: "1rem",
              background: "linear-gradient(135deg, rgba(247,198,19,0.7), rgba(201,168,76,0.4))",
              border: "1px solid rgba(247,198,19,0.8)", color: "#0a0800", cursor: "pointer",
              boxShadow: "0 0 40px rgba(247,198,19,0.3), 0 4px 20px rgba(0,0,0,0.4)",
            }}>🚀 Começar grátis</button>
            <button onClick={() => scrollToAuth("login")} style={{
              padding: "0.85rem 2.2rem", borderRadius: "0.75rem", fontWeight: 700, fontSize: "1rem",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)", color: "#f5f0dc", cursor: "pointer",
            }}>Já tenho conta →</button>
          </div>

          {/* Sub hint */}
          <p style={{ marginTop: "1.25rem", fontSize: "0.78rem", color: "rgba(201,168,76,0.45)" }}>
            10 traduções grátis · Sem cartão de crédito
          </p>

          {/* APP MOCKUP */}
          <div style={{ marginTop: "3.5rem", display: "flex", justifyContent: "center" }}>
            <div style={{
              width: "min(340px, 90vw)",
              background: "rgba(18,14,0,0.85)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(201,168,76,0.2)", borderRadius: "1.5rem",
              padding: "1.5rem", boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(247,198,19,0.08)",
              textAlign: "left",
            }}>
              {/* Mini language cards */}
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
                {[{ flag: "🇧🇷", lang: "Português", voice: "♀" }, { flag: "🇬🇧", lang: "English", voice: "♂" }].map((l) => (
                  <div key={l.lang} style={{
                    flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)",
                    borderRadius: "0.75rem", padding: "0.6rem 0.75rem",
                  }}>
                    <p style={{ fontSize: "0.6rem", color: "rgba(201,168,76,0.4)", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "0.25rem" }}>IDIOMA</p>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700 }}>{l.flag} {l.lang}</p>
                    <span style={{ fontSize: "0.7rem", color: "#FFC107" }}>{l.voice}</span>
                  </div>
                ))}
              </div>

              {/* Record button mini */}
              <div style={{ display: "flex", justifyContent: "center", margin: "0.75rem 0" }}>
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(220,50,50,0.15), #0a0800)",
                  border: "2px solid #dc3232",
                  boxShadow: "0 0 40px rgba(220,50,50,0.3)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "1.5rem" }}>🎙</span>
                  <span style={{ fontSize: "0.45rem", color: "#dc3232", fontWeight: 800, letterSpacing: "0.1em" }}>GRAVANDO</span>
                </div>
              </div>

              {/* Result preview */}
              <div style={{ background: "rgba(26,21,0,0.6)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1rem", overflow: "hidden" }}>
                <div style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", marginBottom: "0.2rem", fontWeight: 700 }}>🎙 PORTUGUÊS</p>
                  <p style={{ fontSize: "0.78rem" }}>Onde fica o banheiro?</p>
                </div>
                <div style={{ padding: "0.6rem 0.75rem", borderLeft: "3px solid #FFC107", background: "rgba(247,198,19,0.04)" }}>
                  <p style={{ fontSize: "0.6rem", color: "#c9a84c", marginBottom: "0.2rem", fontWeight: 700 }}>🔁 ENGLISH</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#FFC107" }}>Where is the bathroom?</p>
                </div>
                <div style={{ padding: "0.6rem 0.75rem", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ fontSize: "0.6rem", color: "rgba(201,168,76,0.4)", marginBottom: "0.15rem", fontWeight: 700 }}>TRANSLITERAÇÃO</p>
                  <p style={{ fontSize: "0.78rem", color: "#f5f0dc" }}>uér iz dhi báthrum?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section style={{ padding: "1.5rem 1.5rem", borderTop: "1px solid rgba(201,168,76,0.08)", borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "center", gap: "clamp(1.5rem, 5vw, 4rem)", flexWrap: "wrap" }}>
          {[
            { n: "9", label: "idiomas suportados" },
            { n: "< 5s", label: "por tradução" },
            { n: "3 IAs", label: "em pipeline" },
            { n: "100%", label: "voz — sem digitar" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 900, color: "#FFC107", lineHeight: 1 }}>{s.n}</p>
              <p style={{ fontSize: "0.72rem", color: "rgba(201,168,76,0.5)", marginTop: "0.25rem", fontWeight: 600, letterSpacing: "0.05em" }}>{s.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", color: "rgba(247,198,19,0.5)", marginBottom: "0.75rem" }}>COMO FUNCIONA</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "3rem", lineHeight: 1.2 }}>
            3 passos. Sem complicação.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{
                background: "rgba(18,14,0,0.6)", border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "1.25rem", padding: "2rem 1.5rem", position: "relative",
              }}>
                <span style={{
                  position: "absolute", top: "1.25rem", right: "1.25rem",
                  fontSize: "0.7rem", fontWeight: 900, color: "rgba(247,198,19,0.2)", letterSpacing: "0.1em",
                }}>{s.n}</span>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{s.icon}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFC107", marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "rgba(201,168,76,0.7)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section style={{ padding: "4rem 1.5rem", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", color: "rgba(247,198,19,0.5)", marginBottom: "0.75rem" }}>FUNCIONALIDADES</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "3rem" }}>
            Tudo que você precisa para comunicar
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: "rgba(18,14,0,0.6)", border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "1rem", padding: "1.5rem",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(247,198,19,0.3)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(247,198,19,0.06)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.1)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.75rem" }}>{f.icon}</span>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f5f0dc", marginBottom: "0.4rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "rgba(201,168,76,0.65)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IDIOMAS ── */}
      <section style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", color: "rgba(247,198,19,0.5)", marginBottom: "0.75rem" }}>IDIOMAS</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "2rem" }}>
            9 idiomas. Qualquer combinação.
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
            {IDIOMAS.map((l) => (
              <div key={l.name} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "999px", padding: "0.5rem 1rem",
                fontSize: "0.85rem", fontWeight: 600, color: "rgba(245,240,220,0.85)",
              }}>
                <span>{l.flag}</span> {l.name}
              </div>
            ))}
          </div>
          <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "rgba(201,168,76,0.35)" }}>Mais idiomas sendo adicionados em breve</p>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: "5rem 1.5rem", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", color: "rgba(247,198,19,0.5)", marginBottom: "0.75rem" }}>PLANOS</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900, marginBottom: "0.75rem" }}>
            Simples e transparente
          </h2>
          <p style={{ textAlign: "center", color: "rgba(201,168,76,0.6)", marginBottom: "3rem", fontSize: "0.9rem" }}>
            Comece grátis. Sem cartão de crédito.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {PLANOS.map((p) => (
              <div key={p.id} style={{
                background: p.destaque ? "rgba(26,21,0,0.9)" : "rgba(18,14,0,0.6)",
                border: p.destaque ? "1px solid rgba(247,198,19,0.4)" : "1px solid rgba(201,168,76,0.12)",
                borderRadius: "1.25rem", padding: "2rem 1.5rem",
                boxShadow: p.destaque ? "0 0 60px rgba(247,198,19,0.1), 0 20px 40px rgba(0,0,0,0.4)" : "none",
                position: "relative",
              }}>
                {p.destaque && (
                  <div style={{
                    position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)",
                    background: "#FFC107", color: "#0a0800", borderRadius: "999px",
                    padding: "0.25rem 1rem", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.08em", whiteSpace: "nowrap",
                  }}>MAIS POPULAR</div>
                )}
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(201,168,76,0.5)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{p.nome.toUpperCase()}</p>
                <div style={{ marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "clamp(1.8rem, 4vw, 2.2rem)", fontWeight: 900, color: p.destaque ? "#FFC107" : "#f5f0dc" }}>{p.preco}</span>
                  {p.periodo && <span style={{ fontSize: "0.85rem", color: "rgba(201,168,76,0.5)", marginLeft: "0.25rem" }}>{p.periodo}</span>}
                </div>
                <p style={{ fontSize: "0.78rem", color: "rgba(247,198,19,0.6)", marginBottom: "1.5rem", fontWeight: 600 }}>{p.creditos}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {p.items.map((item) => (
                    <li key={item} style={{ fontSize: "0.82rem", color: "rgba(245,240,220,0.75)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <span style={{ color: "#FFC107", flexShrink: 0 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollToAuth("cadastro")} style={{
                  width: "100%", padding: "0.75rem", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                  background: p.destaque
                    ? "linear-gradient(to bottom, rgba(247,198,19,0.55), rgba(247,198,19,0.1))"
                    : "rgba(255,255,255,0.04)",
                  border: p.destaque ? "1px solid rgba(247,198,19,0.7)" : "1px solid rgba(201,168,76,0.2)",
                  color: p.destaque ? "#f5f0dc" : "rgba(201,168,76,0.7)",
                  boxShadow: p.destaque ? "0 0 20px rgba(247,198,19,0.2)" : "none",
                }}>
                  {p.id === "gratuito" ? "Começar grátis →" : p.id === "pack" ? "Ver pacotes →" : "Assinar agora →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🍌</div>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, marginBottom: "1rem", lineHeight: 1.2 }}>
            Pronto para falar<br />com o mundo?
          </h2>
          <p style={{ color: "rgba(201,168,76,0.7)", marginBottom: "2rem", fontSize: "0.95rem" }}>
            Crie sua conta grátis em segundos. Sem cartão de crédito, sem complicação.
          </p>

          {/* ── AUTH CARD ── */}
          <div ref={authRef} style={{
            background: "rgba(18,14,0,0.9)", backdropFilter: "blur(24px)",
            border: "1px solid rgba(201,168,76,0.2)", borderRadius: "1.25rem", overflow: "hidden",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(247,198,19,0.06)",
            textAlign: "left",
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
              {(["cadastro", "login"] as const).map((t) => (
                <button key={t} onClick={() => { setTab(t); setMsg(null); }} style={{
                  flex: 1, padding: "0.9rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                  background: "transparent", border: "none",
                  color: tab === t ? "#f5f0dc" : "rgba(201,168,76,0.4)",
                  borderBottom: tab === t ? "2px solid rgba(247,198,19,0.8)" : "2px solid transparent",
                }}>
                  {t === "login" ? "Entrar" : "Criar conta grátis"}
                </button>
              ))}
            </div>

            <div style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Google */}
              <button onClick={handleGoogle} style={{
                width: "100%", padding: "0.8rem", borderRadius: "0.75rem", fontWeight: 600, fontSize: "0.9rem",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#f5f0dc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.1)" }} />
                <span style={{ fontSize: "0.72rem", color: "rgba(201,168,76,0.4)" }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.1)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="input-base" />
                <input type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input-base" />
                {msg && (
                  <p style={{
                    fontSize: "0.82rem", textAlign: "center", padding: "0.6rem", borderRadius: "0.5rem",
                    color: msg.type === "error" ? "#f87171" : "#4ade80",
                    background: msg.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.1)",
                  }}>{msg.text}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "0.25rem" }}>
                  {loading ? "Aguarde…" : tab === "login" ? "Entrar" : "Criar conta grátis"}
                </button>
              </form>
            </div>
          </div>

          <p style={{ marginTop: "1.25rem", fontSize: "0.72rem", color: "rgba(201,168,76,0.3)" }}>
            Ao criar uma conta, você concorda com os nossos{" "}
            <a href="/termos-de-uso" style={{ color: "rgba(201,168,76,0.55)", textDecoration: "underline" }}>Termos de Uso</a>.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(201,168,76,0.08)", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Logo size={26} variant="dark" textSize="0.9rem" />
          <p style={{ fontSize: "0.75rem", color: "rgba(201,168,76,0.3)" }}>© 2026 TalkBanana · Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
