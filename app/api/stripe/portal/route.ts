import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://talkbanana.com";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: perfil } = await supabase.from("perfis").select("stripe_customer_id").eq("id", user.id).single();
  if (!perfil?.stripe_customer_id)
    return NextResponse.json({ error: "Sem assinatura ativa" }, { status: 400 });

  const session = await stripe.billingPortal.sessions.create({
    customer: perfil.stripe_customer_id,
    return_url: `${BASE_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
