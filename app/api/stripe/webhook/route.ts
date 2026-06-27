import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { CREDITOS_PLANO, planoFromPriceId, packFromId } from "@/lib/planos";

function getSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

      if (session.mode === "payment") {
        // Compra de pacote avulso — adiciona créditos
        const pack = packFromId(session.metadata?.pack_id ?? "");
        if (pack) {
          await supabase.rpc("adicionar_creditos_admin", {
            p_user_id: userId,
            p_quantidade: pack.creditos,
          });
        }
      } else if (session.mode === "subscription") {
        // Nova assinatura — actualiza plano e repõe créditos
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price.id;
        const plano = planoFromPriceId(priceId);
        const creditos = CREDITOS_PLANO[plano as keyof typeof CREDITOS_PLANO] ?? 0;
        await supabase.from("perfis").update({
          plano,
          creditos,
          stripe_customer_id: session.customer as string,
        }).eq("id", userId);
      }
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
