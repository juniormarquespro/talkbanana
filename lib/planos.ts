// ─────────────────────────────────────────────────────────────────────────────
// FONTE ÚNICA DE VERDADE — sistema de créditos e planos
// Altere aqui; API routes, UI e webhook lêem deste ficheiro.
// ─────────────────────────────────────────────────────────────────────────────

// Créditos iniciais e de renovação por plano.
// REGRA: não cumulativo — o saldo é SUBSTITUÍDO (não somado) na renovação mensal.
export const CREDITOS_PLANO = {
  gratuito:   10,   // concedidos ao criar conta. Não renovam.
  pro_mensal: 600,  // renovados automaticamente todo dia 1.
  pro_anual:  600,  // mesma cota, comprometimento anual.
  master:     9999, // acesso interno — atribuído manualmente pelo admin.
  convidado:  9999, // acesso beta — atribuído manualmente pelo admin.
} as const;

export type PlanoKey = keyof typeof CREDITOS_PLANO;

export const PLANOS = {
  pro_mensal: {
    nome:    "Pro Mensal",
    preco:   59.90,
    periodo: "/mês",
    priceId: process.env.STRIPE_PRICE_MENSAL ?? null,
  },
  pro_anual: {
    nome:    "Pro Anual",
    preco:   499.00,
    periodo: "/mês",
    priceId: process.env.STRIPE_PRICE_ANUAL ?? null,
  },
} as const;

export const PACKS_CREDITOS = [
  { id: "pack_s", label: "Pacote S", creditos: 60,  preco: "R$9,90",  priceId: process.env.STRIPE_PRICE_PACK_S ?? null },
  { id: "pack_m", label: "Pacote M", creditos: 150, preco: "R$24,90", priceId: process.env.STRIPE_PRICE_PACK_M ?? null },
  { id: "pack_l", label: "Pacote L", creditos: 300, preco: "R$59,90", priceId: process.env.STRIPE_PRICE_PACK_L ?? null },
] as const;

export type PackId = (typeof PACKS_CREDITOS)[number]["id"];

export function planoFromPriceId(priceId: string): PlanoKey | "gratuito" {
  if (priceId === process.env.STRIPE_PRICE_MENSAL) return "pro_mensal";
  if (priceId === process.env.STRIPE_PRICE_ANUAL)  return "pro_anual";
  return "gratuito";
}

export function packFromId(packId: string) {
  return PACKS_CREDITOS.find(p => p.id === packId) ?? null;
}
