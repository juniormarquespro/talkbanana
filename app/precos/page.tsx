import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrecosClient from "./PrecosClient";

export const metadata = { title: "Planos" };

export default async function PrecosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("plano, stripe_customer_id")
    .eq("id", user.id)
    .single();

  return <PrecosClient planoAtual={perfil?.plano ?? "gratuito"} hasStripeCustomer={!!perfil?.stripe_customer_id} />;
}
