import { createClient } from "@supabase/supabase-js";

// Tracking de custo real (USD) da API Anthropic — global e por usuário.
// Inativo até o app fazer chamadas à IA: rode supabase_setup.sql (seção
// "Tracking de custo Anthropic") e chame registrarUsoAPI() após cada
// resposta da Anthropic, passando response.usage e o userId quando houver.

// Preços em USD por milhão de tokens — conferir/atualizar se a Anthropic mudar a tabela.
const PRECOS: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
};
const PRECO_PADRAO = PRECOS["claude-haiku-4-5-20251001"];

type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function calcularCustoUSD(usage: Usage, model: string): number {
  const preco = PRECOS[model] ?? PRECO_PADRAO;
  const input = usage.input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  // Cache write tem sobretaxa de 25%, cache read tem desconto de 90% — padrão da API Anthropic
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;

  return (
    (input / 1_000_000) * preco.input +
    (cacheWrite / 1_000_000) * preco.input * 1.25 +
    (cacheRead / 1_000_000) * preco.input * 0.1 +
    (output / 1_000_000) * preco.output
  );
}

// Desconta o custo estimado da chamada do saldo registrado manualmente em admin_config,
// e — se userId for informado — soma ao custo real acumulado daquele usuário
// (perfis.gasto_anthropic_total), pra comparar com o que ele paga em créditos.
// Melhor esforço — uma falha aqui nunca pode quebrar a resposta ao usuário.
export async function registrarUsoAPI(usage: Usage, model: string, userId?: string): Promise<void> {
  try {
    const custo = calcularCustoUSD(usage, model);
    if (custo <= 0) return;
    const db = admin();
    await db.rpc("decrementar_saldo_anthropic", { p_valor: custo });
    if (userId) await db.rpc("incrementar_gasto_usuario", { p_user_id: userId, p_valor: custo });
  } catch {
    // best-effort
  }
}
