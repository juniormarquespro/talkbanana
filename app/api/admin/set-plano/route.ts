import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/is-admin";
import { CREDITOS_PLANO, type PlanoKey } from "@/lib/planos";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { user_id, plano } = await req.json();
  if (!user_id || !plano) return Response.json({ error: "Dados incompletos" }, { status: 400 });

  const db = admin();
  const creditos = (CREDITOS_PLANO as Record<string, number>)[plano as PlanoKey] ?? 10;

  const { error } = await db
    .from("perfis")
    .update({ plano, creditos })
    .eq("id", user_id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
