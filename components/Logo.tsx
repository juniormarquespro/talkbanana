interface LogoMarkProps {
  size?: number;
  /** "dark" = fundo escuro (bolha branca, banana amarela). "light" = fundo branco (bolha navy, banana amarela). */
  variant?: "dark" | "light";
}

/** Ícone SVG baseado na identidade visual TalkBanana: speech bubble + banana. */
export function LogoMark({ size = 40, variant = "dark" }: LogoMarkProps) {
  const bubble = variant === "dark" ? "#ffffff" : "#0D1117";
  const tip    = variant === "dark" ? "#0D1117" : "#ffffff"; // pontinha da banana

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 108"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        Speech bubble: arco counterclockwise de (74,19) até (36,84)
        cobrindo ~220° (passa pelo topo, esquerda, e base-esquerda)
        + cauda apontando para baixo-esquerda
      */}
      <path
        d="M 74 19
           A 38 38 0 1 0 36 84
           L 16 106
           L 32 88"
        stroke={bubble}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/*
        Banana: curva clockwise de (74,19) até (32,88)
        — segue o arco direito da bolha mas abaulando para fora
      */}
      <path
        d="M 74 19
           C 108 32, 106 82, 64 90
           L 32 88"
        stroke="#FFC107"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Pontinha escura no topo da banana (ponta da banana) */}
      <circle cx="74" cy="19" r="5" fill={tip} />

      {/* 3 pontos dentro da bolha (centrados em y≈46, espaçados) */}
      <circle cx="37" cy="46" r="4" fill={bubble} />
      <circle cx="50" cy="46" r="4" fill={bubble} />
      <circle cx="63" cy="46" r="4" fill={bubble} />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  variant?: "dark" | "light";
  iconOnly?: boolean;
  textSize?: string;
}

/** Logo completo: ícone + "Talk" + "Banana" */
export function Logo({ size = 36, variant = "dark", iconOnly = false, textSize = "1.1rem" }: LogoProps) {
  const talkColor = variant === "dark" ? "#ffffff" : "#0D1117";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
      <LogoMark size={size} variant={variant} />
      {!iconOnly && (
        <span style={{ fontWeight: 700, fontSize: textSize, lineHeight: 1, letterSpacing: "-0.01em" }}>
          <span style={{ color: talkColor }}>Talk</span>
          <span style={{ color: "#FFC107" }}>Banana</span>
        </span>
      )}
    </span>
  );
}
