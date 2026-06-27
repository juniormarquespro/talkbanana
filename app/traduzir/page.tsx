import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TraduzirClient from "./TraduzirClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Traduzir ao vivo" };

export default async function TraduzirPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return <TraduzirClient />;
}
