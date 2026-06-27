import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/is-admin";
import TraduzirClient from "./TraduzirClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traduzir ao vivo" };

export default async function TraduzirPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("creditos, plano")
    .eq("id", user.id)
    .single();

  const isPro = perfil?.plano === "pro_mensal" || perfil?.plano === "pro_anual";
  const creditos = perfil?.creditos ?? 0;

  return <TraduzirClient creditosIniciais={creditos} isPro={isPro} isAdmin={isAdmin(user.email)} />;
}
