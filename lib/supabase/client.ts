import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          return document.cookie
            .split("; ")
            .filter(Boolean)
            .map((c) => {
              const idx = c.indexOf("=");
              return { name: c.slice(0, idx).trim(), value: c.slice(idx + 1) };
            });
        },
        setAll(cookies) {
          if (typeof document === "undefined") return;
          cookies.forEach(({ name, value, options }) => {
            let str = `${name}=${value}; path=/`;
            if (options?.maxAge !== undefined) str += `; max-age=${options.maxAge}`;
            if (options?.secure) str += `; secure`;
            str += `; samesite=lax`;
            document.cookie = str;
          });
        },
      },
    }
  );

  return client;
}
