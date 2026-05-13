-- =====================================================================
-- My Niche — 카드 저장 버그 픽스
-- Supabase SQL Editor에서 실행
-- =====================================================================

-- FIX 1: payload → content 컬럼 이름 통일
-- (TypeScript 코드가 content를 사용하므로 DB 컬럼을 맞춤)
ALTER TABLE public.cards RENAME COLUMN payload TO content;

-- FIX 2: Google 로그인 시 public.users 자동 생성 트리거
-- (cards.user_id → public.users FK 충족을 위해 필수)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FIX 3: 이미 가입된 auth 유저를 public.users에 백필
-- (현재 로그인되어 있는 계정 포함)
INSERT INTO public.users (id, email, display_name)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  )
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 확인 쿼리 (실행 후 아래로 결과 확인)
SELECT 'cards 컬럼' AS check, column_name FROM information_schema.columns WHERE table_name='cards' AND column_name='content'
UNION ALL
SELECT 'public.users 유저 수', count(*)::text FROM public.users
UNION ALL
SELECT '트리거 존재', count(*)::text FROM information_schema.triggers WHERE trigger_name='on_auth_user_created';
