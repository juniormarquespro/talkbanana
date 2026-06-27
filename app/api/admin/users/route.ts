import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/is-admin";

const admin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const db = admin();

  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = authData?.users ?? [];

  // perfis usa `id` (PK = auth.users.id)
  const { data: perfis } = await db
    .from("perfis")
    .select("id, email, nome_completo, plano, creditos, created_at")
    .limit(2000);

  const perfilMap: Record<string, typeof perfis extends (infer T)[] | null ? T : never> = {};
  for (const p of perfis ?? []) perfilMap[p.id] = p;

  const users = authUsers
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((u) => {
      const p = perfilMap[u.id];
      return {
        id:         u.id,
        email:      u.email ?? "—",
        nome:       p?.nome_completo ?? "—",
        plano:      p?.plano ?? "gratuito",
        creditos:   p?.creditos ?? 0,
        created_at: u.created_at,
        confirmado: !!u.email_confirmed_at,
      };
    });

  return Response.json(users);
}

export async function DELETE(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { user_id } = await req.json();
  if (!user_id) return Response.json({ error: "user_id obrigatório" }, { status: 400 });

  const db = admin();
  await db.from("perfis").delete().eq("id", user_id);
  const { error } = await db.auth.admin.deleteUser(user_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
