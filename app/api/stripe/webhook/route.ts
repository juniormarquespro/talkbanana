import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createServerClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function planoFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_MENSAL) return "pro_mensal";
  if (priceId === process.env.STRIPE_PRICE_ANUAL) return "pro_anual";
  return "gratuito";
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature inválida" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id;
      await supabase.from("perfis").update({
        plano: planoFromPriceId(priceId),
        stripe_customer_id: session.customer as string,
      }).eq("id", userId);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;
      const priceId = sub.items.data[0]?.price.id;
      const plano = sub.status === "active" ? planoFromPriceId(priceId) : "gratuito";
      await supabase.from("perfis").update({ plano }).eq("id", userId);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (userId) await supabase.from("perfis").update({ plano: "gratuito" }).eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
