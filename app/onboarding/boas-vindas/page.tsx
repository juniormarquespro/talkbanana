"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function BoasVindasPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(139,76,247,0.4), rgba(184,157,252,0.1))",
            border: "1px solid rgba(139,76,247,0.5)",
            boxShadow: "0 0 40px rgba(139,76,247,0.3)",
          }}
        >
          <span style={{ fontSize: 36 }}>✦</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-3">
          Bem-vindo! 🎉
        </h1>
        <p style={{ color: "rgba(184,157,252,0.8)", lineHeight: 1.6, marginBottom: "2rem" }}>
          Sua conta foi criada com sucesso.<br />
          Vamos completar o seu perfil para personalizar a experiência.
        </p>

        <button
          onClick={() => router.push("/onboarding/perfil")}
          className="btn-primary"
        >
          Completar perfil →
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-3 w-full py-3 text-sm"
          style={{ color: "rgba(184,157,252,0.5)", background: "transparent", border: "none", cursor: "pointer" }}
        >
          Pular por agora
        </button>
      </motion.div>
    </main>
  );
}
