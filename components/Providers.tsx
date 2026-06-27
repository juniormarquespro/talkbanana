"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// ── Idioma ──────────────────────────────────────────────────────────────────

export type Idioma = "pt-BR" | "es";

const IdiomaContext = createContext<{
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
}>({ idioma: "pt-BR", setIdioma: () => {} });

export function useIdioma() {
  return useContext(IdiomaContext);
}

// ── Providers ───────────────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode;
  initialIdioma: Idioma;
}

export function Providers({ children, initialIdioma }: ProvidersProps) {
  const [idioma, setIdiomaState] = useState<Idioma>(initialIdioma);

  function setIdioma(i: Idioma) {
    setIdiomaState(i);
    document.cookie = `app_idioma=${i}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <IdiomaContext.Provider value={{ idioma, setIdioma }}>
      {children}
    </IdiomaContext.Provider>
  );
}
