"use client";

import { useState } from "react";

export default function ReloadButton() {
  const [loading, setLoading] = useState(false);

  async function handleReload() {
    setLoading(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } finally {
      window.location.reload();
    }
  }

  return (
    <button
      onClick={handleReload}
      disabled={loading}
      title="Atualizar app"
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(201,168,76,0.15)",
        color: "rgba(201,168,76,0.5)",
        cursor: loading ? "default" : "pointer",
      }}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    </button>
  );
}
