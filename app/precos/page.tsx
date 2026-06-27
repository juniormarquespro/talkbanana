import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PACKS_CREDITOS } from "@/lib/planos";
import PrecosClient from "./PrecosClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Planos" };

export default async function PrecosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("plano, stripe_customer_id, creditos")
    .eq("id", user.id)
    .single();

  const packs = PACKS_CREDITOS.map(({ id, label, creditos, preco }) => ({
    id, label, creditos, preco,
  }));

  return (
    <PrecosClient
      planoAtual={perfil?.plano ?? "gratuito"}
      hasStripeCustomer={!!perfil?.stripe_customer_id}
      creditosAtuais={perfil?.creditos ?? 0}
      packs={packs}
    />
  );
}
