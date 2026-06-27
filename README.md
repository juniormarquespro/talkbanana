# Starter App

Template Next.js com auth completa (email + Google), onboarding, dashboard e Supabase.  
Baseado nos padrões provados em produção do projeto [omundoastral.com](https://omundoastral.com).

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth + PostgreSQL)
- **Tailwind CSS 4**
- **Framer Motion**
- **Vercel** (deploy)

## Setup rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/SEU-USER/starter-app.git
cd starter-app
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher com os valores do Supabase
```

### 3. Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar `supabase_setup.sql` no SQL Editor
3. Habilitar providers: Email + Google
4. Configurar redirect URL: `http://localhost:3000/auth/callback`

### 4. Rodar localmente

```bash
npm run dev
```

### 5. Deploy

```bash
npx vercel --prod
```

## Estrutura

```
app/
  page.tsx                    # Landing + auth (login/cadastro/Google)
  layout.tsx                  # Root layout com providers
  dashboard/page.tsx          # Dashboard (protegido)
  onboarding/
    termos/page.tsx           # Aceite de termos
    boas-vindas/page.tsx      # Boas-vindas
    perfil/page.tsx           # Dados do perfil
  auth/callback/route.ts      # OAuth callback
  api/auth/                   # Login, signup, Google, logout
  api/aceitar-termos/         # Aceitar termos
  api/perfil-update/          # Atualizar perfil

lib/
  supabase/server.ts          # Cliente Supabase SSR
  supabase/client.ts          # Cliente Supabase browser (PKCE)
  is-admin.ts                 # Verificar admin por email
  terms-version.ts            # Versão atual dos termos

components/
  Providers.tsx               # Context providers (idioma)
  CookieBanner.tsx            # Banner LGPD

public/
  sw.js                       # Service Worker (PWA)
```

## Fluxo de auth

1. Usuário faz login (email ou Google) → `/`
2. OAuth callback → `/auth/callback` → detecta se é novo cadastro
3. Novo cadastro → `/dashboard?cadastro=novo`
4. Dashboard verifica gates → redireciona para onboarding se necessário
5. Onboarding: Termos → Boas-vindas → Perfil → Dashboard

## Personalizar

- `app/manifest.ts` — nome e ícones do PWA
- `app/layout.tsx` — metadata, título, OG tags
- `app/page.tsx` — textos da landing page
- `lib/terms-version.ts` — versão dos termos de uso
- `supabase_setup.sql` — schema do banco
- `.env.example` → `.env.local` — variáveis de ambiente

## Adicionar funcionalidades

- **IA (Claude):** `npm install @anthropic-ai/sdk`
- **Pagamentos:** `npm install stripe`
- **Push Notifications:** `npm install web-push`
- **PDF:** `npm install jspdf html2canvas`
