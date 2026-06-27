"use client";

import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = document.cookie.includes("cookie_accepted=1");
    if (!accepted) setVisible(true);
  }, []);

  function accept() {
    document.cookie = "cookie_accepted=1; path=/; max-age=" + 60 * 60 * 24 * 365 + "; samesite=lax";
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 1rem)",
        left: "1rem",
        right: "1rem",
        zIndex: 9999,
        maxWidth: "480px",
        margin: "0 auto",
        background: "rgba(16, 8, 40, 0.97)",
        border: "1px solid rgba(184, 157, 252, 0.2)",
        borderRadius: "1rem",
        padding: "1rem 1.25rem",
        backdropFilter: "blur(20px)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "rgba(184, 157, 252, 0.8)", fontSize: "0.8rem", flex: 1, lineHeight: 1.5 }}>
        Usamos cookies para melhorar a sua experiência.
      </p>
      <button
        onClick={accept}
        style={{
          background: "rgba(139, 76, 247, 0.6)",
          border: "1px solid rgba(139, 76, 247, 0.8)",
          color: "white",
          borderRadius: "0.5rem",
          padding: "0.4rem 1rem",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        OK
      </button>
    </div>
  );
}
