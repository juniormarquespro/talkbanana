import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { PLANOS, PACKS_CREDITOS } from "@/lib/planos";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://talkbanana.com";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { plano } = await req.json();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  let customerId = perfil?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("perfis").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  // Pacote avulso (compra única)
  const pack = PACKS_CREDITOS.find(p => p.id === plano);
  if (pack) {
    if (!pack.priceId) return NextResponse.json({ error: "Pacote não configurado" }, { status: 503 });
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${BASE_URL}/dashboard?sucesso=creditos`,
      cancel_url: `${BASE_URL}/precos`,
      metadata: { supabase_user_id: user.id, pack_id: pack.id },
      allow_promotion_codes: true,
    });
    return NextResponse.json({ url: session.url });
  }

  // Assinatura Pro
  const planoConfig = PLANOS[plano as keyof typeof PLANOS];
  if (!planoConfig) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  if (!planoConfig.priceId) return NextResponse.json({ error: "Plano não configurado" }, { status: 503 });

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planoConfig.priceId, quantity: 1 }],
    success_url: `${BASE_URL}/dashboard?sucesso=assinatura`,
    cancel_url: `${BASE_URL}/precos`,
    metadata: { supabase_user_id: user.id, plano },
    subscription_data: { metadata: { supabase_user_id: user.id, plano } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
