-- ============================================================
-- TALKBANANA — Supabase Setup SQL
-- Executar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE public.perfis (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nome_completo TEXT,
  tratamento TEXT,
  onboarding_done BOOLEAN DEFAULT false,
  terms_accepted_version TEXT,
  creditos INTEGER DEFAULT 10,
  plano TEXT DEFAULT 'gratuito',
  stripe_customer_id TEXT,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfis_select_own" ON public.perfis FOR SELECT USING (auth.uid() = id);
CREATE POLICY "perfis_update_own" ON public.perfis FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "perfis_insert_own" ON public.perfis FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Adicionar créditos (usado pelo admin e pelo webhook do Stripe ao reactivar plano)
CREATE OR REPLACE FUNCTION public.adicionar_creditos_admin(p_user_id UUID, p_quantidade INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.perfis SET creditos = creditos + p_quantidade, updated_at = NOW() WHERE id = p_user_id;
END;
$$;

-- Débito atômico de créditos (sem race condition)
CREATE OR REPLACE FUNCTION public.debitar_credito(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_creditos INTEGER;
BEGIN
  SELECT creditos INTO v_creditos FROM public.perfis WHERE id = p_user_id FOR UPDATE;
  IF v_creditos IS NULL OR v_creditos < 1 THEN RETURN FALSE; END IF;
  UPDATE public.perfis SET creditos = creditos - 1, updated_at = NOW() WHERE id = p_user_id;
  RETURN TRUE;
END;
$$;

-- ============================================================
-- PRÓXIMOS PASSOS:
-- ============================================================
-- 1. Supabase: Authentication → Providers → Email + Google
-- 2. Supabase: Authentication → URL Configuration:
--    Site URL: https://talkbanana.com
--    Redirect URLs: https://talkbanana.com/auth/callback
-- 3. Google Cloud Console → OAuth 2.0 Client:
--    Authorized redirect URI: https://SEU-PROJETO.supabase.co/auth/v1/callback
-- 4. Stripe: criar 2 produtos (Pro Mensal + Pro Anual) e copiar Price IDs
-- 5. Stripe: webhook → https://talkbanana.com/api/stripe/webhook
--    Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
