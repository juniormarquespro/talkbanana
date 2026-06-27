import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TERMS_VERSION } from "@/lib/terms-version";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { error } = await supabase
    .from("perfis")
    .update({ terms_accepted_version: TERMS_VERSION })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
