import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/is-admin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — TalkBanana" };

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) redirect("/dashboard");

  const db = getAdminClient();

  const [
    { count: totalUsers },
    { count: proMensal },
    { count: proAnual },
    { count: semCreditos },
  ] = await Promise.all([
    db.from("perfis").select("*", { count: "exact", head: true }),
    db.from("perfis").select("*", { count: "exact", head: true }).eq("plano", "pro_mensal"),
    db.from("perfis").select("*", { count: "exact", head: true }).eq("plano", "pro_anual"),
    db.from("perfis").select("*", { count: "exact", head: true }).eq("creditos", 0),
  ]);

  const gratuitos = (totalUsers ?? 0) - (proMensal ?? 0) - (proAnual ?? 0);
  // MRR: pro_mensal × R$59,90 + pro_anual × R$41,58 (= 499/12)
  const mrr = Math.round(((proMensal ?? 0) * 59.90) + ((proAnual ?? 0) * (499 / 12)));

  return (
    <AdminClient
      stats={{
        totalUsers: totalUsers ?? 0,
        proMensal: proMensal ?? 0,
        proAnual: proAnual ?? 0,
        gratuitos,
        semCreditos: semCreditos ?? 0,
        mrr,
      }}
    />
  );
}
