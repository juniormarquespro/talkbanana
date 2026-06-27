import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/is-admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email))
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { userId, quantidade } = await req.json();
  if (!userId || !quantidade || quantidade <= 0)
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });

  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await adminClient.rpc("adicionar_creditos_admin", {
    p_user_id: userId,
    p_quantidade: quantidade,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
