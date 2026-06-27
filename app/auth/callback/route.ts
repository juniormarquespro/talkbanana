import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as adminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { TERMS_VERSION } from "@/lib/terms-version";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const cookieStore = await cookies();
  const newCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            newCookies.push({ name, value, options: options ?? {} });
          });
        },
      },
    }
  );

  const type = searchParams.get("type");
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
  }

  let next = type === "recovery" ? "/reset-password" : "/dashboard";
  let isNovoCadastro = false;

  if (type !== "recovery") {
    if (type === "signup") {
      next = "/dashboard?cadastro=novo";
      isNovoCadastro = true;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.created_at) {
        const ageMs = Date.now() - new Date(user.created_at).getTime();
        if (ageMs < 60000) {
          next = "/dashboard?cadastro=novo";
          isNovoCadastro = true;
        }
      }
    }
  }

  // OAuth: auto-aceitar termos (email já verificado pelo provider)
  if (isNovoCadastro) {
    try {
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        const db = adminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await db
          .from("perfis")
          .upsert(
            { id: newUser.id, terms_accepted_version: TERMS_VERSION },
            { onConflict: "id" }
          );
      }
    } catch (err) {
      console.error("[callback] upsert perfil:", err);
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  newCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
      secure: true,
      ...(options as object),
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  return response;
}
