import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CREDITOS_PLANO } from "@/lib/planos";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [mensal, anual] = await Promise.all([
    admin.from("perfis")
      .update({ creditos: CREDITOS_PLANO.pro_mensal, updated_at: new Date().toISOString() })
      .eq("plano", "pro_mensal"),
    admin.from("perfis")
      .update({ creditos: CREDITOS_PLANO.pro_anual, updated_at: new Date().toISOString() })
      .eq("plano", "pro_anual"),
  ]);

  if (mensal.error || anual.error)
    return NextResponse.json({ error: mensal.error?.message ?? anual.error?.message }, { status: 500 });

  return NextResponse.json({ ok: true, mensal: mensal.count, anual: anual.count });
}
