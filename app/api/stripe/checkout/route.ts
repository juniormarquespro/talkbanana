import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://talkbanana.com";
  const PRICE_IDS: Record<string, string> = {
    mensal: process.env.STRIPE_PRICE_MENSAL!,
    anual: process.env.STRIPE_PRICE_ANUAL!,
  };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { plano } = await req.json();
  const priceId = PRICE_IDS[plano];
  if (!priceId) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const { data: perfil } = await supabase.from("perfis").select("stripe_customer_id, email").eq("id", user.id).single();

  let customerId = perfil?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("perfis").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${BASE_URL}/dashboard?sucesso=assinatura`,
    cancel_url: `${BASE_URL}/precos`,
    metadata: { supabase_user_id: user.id, plano },
    subscription_data: { metadata: { supabase_user_id: user.id, plano } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
