-- ═══════════════════════════════════════════════════════════════════
-- TalkBanana — SQL Migration
-- Execute no Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. Garantir colunas na tabela perfis
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS creditos           integer     NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS plano              text        NOT NULL DEFAULT 'gratuito',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS onboarding_done    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

-- ───────────────────────────────────────────────────────────────────
-- 2. RPC: debitar_credito
--    Chamada em: app/api/traduzir/route.ts
--    Debita 1 crédito. Retorna FALSE se saldo insuficiente.
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION debitar_credito(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE perfis
    SET creditos   = creditos - 1,
        updated_at = now()
    WHERE id = p_user_id
      AND creditos >= 1;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

-- ───────────────────────────────────────────────────────────────────
-- 3. RPC: adicionar_creditos_admin
--    Chamada em: app/api/stripe/webhook/route.ts
--                app/api/admin/creditos/route.ts
--    Adiciona N créditos ao utilizador (compras, bónus, etc.)
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION adicionar_creditos_admin(p_user_id uuid, p_quantidade integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE perfis
    SET creditos   = creditos + p_quantidade,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────
-- 4. Planos disponíveis (referência)
--    gratuito  → 10 créditos iniciais, não renovam
--    pro_mensal → 600 créditos/mês, renovados dia 1 (cron)
--    pro_anual  → 600 créditos/mês, renovados dia 1 (cron)
--    master     → 9999 créditos, atribuído manualmente pelo admin
--    convidado  → 9999 créditos, acesso beta, atribuído manualmente
-- ───────────────────────────────────────────────────────────────────
-- (nenhum SQL extra necessário — plano é campo text livre)

-- ───────────────────────────────────────────────────────────────────
-- 5. RLS: garantir que o service role tem acesso total
--    (necessário para admin routes que usam SUPABASE_SERVICE_ROLE_KEY)
-- ───────────────────────────────────────────────────────────────────
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Utilizador lê e edita o próprio perfil
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='perfis' AND policyname='perfis_select_own'
  ) THEN
    CREATE POLICY "perfis_select_own" ON perfis
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='perfis' AND policyname='perfis_update_own'
  ) THEN
    CREATE POLICY "perfis_update_own" ON perfis
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='perfis' AND policyname='perfis_insert_own'
  ) THEN
    CREATE POLICY "perfis_insert_own" ON perfis
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 6. Trigger: criar perfil automaticamente após signup
-- ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO perfis (id, email, creditos, plano)
  VALUES (NEW.id, NEW.email, 10, 'gratuito')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
