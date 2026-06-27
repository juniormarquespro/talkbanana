import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/is-admin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

function getSupabaseAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) redirect("/dashboard");

  const adminClient = getSupabaseAdmin();

  // Estatísticas gerais
  const { count: totalUsers } = await adminClient
    .from("perfis")
    .select("*", { count: "exact", head: true });

  const { count: proMensal } = await adminClient
    .from("perfis")
    .select("*", { count: "exact", head: true })
    .eq("plano", "pro_mensal");

  const { count: proAnual } = await adminClient
    .from("perfis")
    .select("*", { count: "exact", head: true })
    .eq("plano", "pro_anual");

  const { count: semCreditos } = await adminClient
    .from("perfis")
    .select("*", { count: "exact", head: true })
    .eq("plano", "gratuito")
    .eq("creditos", 0);

  // Últimos 20 users
  const { data: recentUsers } = await adminClient
    .from("perfis")
    .select("id, email, nome_completo, plano, creditos, created_at, onboarding_done")
    .order("created_at", { ascending: false })
    .limit(20);

  const stats = {
    totalUsers: totalUsers ?? 0,
    proMensal: proMensal ?? 0,
    proAnual: proAnual ?? 0,
    gratuitos: (totalUsers ?? 0) - (proMensal ?? 0) - (proAnual ?? 0),
    semCreditos: semCreditos ?? 0,
    mrr: ((proMensal ?? 0) * 29) + ((proAnual ?? 0) * 19),
  };

  return <AdminClient stats={stats} recentUsers={recentUsers ?? []} />;
}
