import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/is-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ isAdmin: isAdmin(user.email) });
}
