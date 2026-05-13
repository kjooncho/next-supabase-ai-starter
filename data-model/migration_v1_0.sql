-- =====================================================================
-- My Niche (毎日) — Supabase Migration v1.0
-- Created: 2026-05-10
-- Database: PostgreSQL 15+ (Supabase)
-- =====================================================================
--
-- Tables: users, cards, tags, card_tags, real_use_logs, teacher_sessions
-- Total objects: 6 tables, 12 indexes, 3 triggers, 18 RLS policies
--
-- Execution order:
--   1. Extensions
--   2. Tables (in dependency order)
--   3. Indexes
--   4. Triggers
--   5. RLS policies
--   6. Seed data (tags)
--
-- =====================================================================


-- =====================================================================
-- 1. EXTENSIONS
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 텍스트 검색 (카드 미리보기 검색용)


-- =====================================================================
-- 2. TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 users — 사용자 도메인 데이터
-- (인증 정보는 Supabase Auth의 auth.users에 별도 저장)
-- ---------------------------------------------------------------------

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    level TEXT NOT NULL DEFAULT 'N5'
        CHECK (level IN ('beginner', 'N5', 'N4', 'N3', 'N2', 'N1')),
    life_situations TEXT[] NOT NULL DEFAULT ARRAY['일상']::TEXT[]
        CHECK (
            life_situations <@ ARRAY['직장', '육아', '일상', '소셜', '관공서']::TEXT[]
            AND array_length(life_situations, 1) >= 1
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS '앱 도메인 사용자 정보. auth.users와 1:1.';
COMMENT ON COLUMN public.users.life_situations IS '사용자가 자주 마주치는 상황. 컨텍스트 인젝션에 활용.';


-- ---------------------------------------------------------------------
-- 2.2 cards — 핵심 카드 테이블 (3축 통합)
-- ---------------------------------------------------------------------

CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- 카드 종류 (3축)
    card_type TEXT NOT NULL
        CHECK (card_type IN ('sentence', 'calendar', 'episode')),

    -- 학습 진행도 (mutually exclusive)
    learning_status TEXT NOT NULL DEFAULT 'learning'
        CHECK (learning_status IN ('learning', 'mastered')),

    -- 실전 사용 (학습 진행도와 독립)
    has_real_use BOOLEAN NOT NULL DEFAULT FALSE,
    real_use_count INTEGER NOT NULL DEFAULT 0
        CHECK (real_use_count >= 0),

    -- 카드 종류별 데이터 (TypeScript Zod로 검증)
    payload JSONB NOT NULL,

    -- 원본 입력 (sentence 카드의 경우 한국어 원문, 검색용 캐싱)
    source_input TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ
);

COMMENT ON TABLE public.cards IS '학습 카드 통합 테이블. payload JSONB로 카드 종류별 데이터 저장.';
COMMENT ON COLUMN public.cards.has_real_use IS 'real_use_count > 0의 캐시 컬럼. 트리거로 자동 동기화.';
COMMENT ON COLUMN public.cards.payload IS '카드 종류별 구조화 데이터. TypeScript Zod 스키마로 앱 레벨 검증.';
COMMENT ON COLUMN public.cards.source_input IS 'sentence 카드의 한국어 원문. 검색 인덱스용.';


-- ---------------------------------------------------------------------
-- 2.3 tags — 태그 마스터 테이블
-- ---------------------------------------------------------------------

CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tag_type TEXT NOT NULL
        CHECK (tag_type IN ('category', 'grammar', 'special', 'place')),
    color_token TEXT NOT NULL DEFAULT 'gray'
        CHECK (color_token IN ('navy', 'orange', 'green', 'purple', 'amber', 'red', 'blue', 'gray')),
    icon_name TEXT,  -- Tabler 아이콘 이름 (선택)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (name, tag_type)
);

COMMENT ON TABLE public.tags IS '카드 태그 마스터. category·grammar·special·place 4종.';


-- ---------------------------------------------------------------------
-- 2.4 card_tags — 카드 ↔ 태그 N:M 조인
-- ---------------------------------------------------------------------

CREATE TABLE public.card_tags (
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (card_id, tag_id)
);

COMMENT ON TABLE public.card_tags IS '카드와 태그의 다대다 관계. PK로 중복 방지.';


-- ---------------------------------------------------------------------
-- 2.5 real_use_logs — "써봤어요" 기록
-- ---------------------------------------------------------------------

CREATE TABLE public.real_use_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    used_on DATE NOT NULL DEFAULT CURRENT_DATE,
    situations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
        CHECK (situations <@ ARRAY['직장', '육아', '일상', '소셜', '관공서']::TEXT[]),
    self_rating TEXT NOT NULL
        CHECK (self_rating IN ('natural', 'awkward', 'unsure')),
    memo TEXT
        CHECK (memo IS NULL OR length(memo) <= 100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.real_use_logs IS '카드를 실제로 사용한 기록. 패턴 분석의 핵심 입력.';
COMMENT ON COLUMN public.real_use_logs.self_rating IS 'natural=자연스러웠음, awkward=어색했음, unsure=잘 모르겠음';


-- ---------------------------------------------------------------------
-- 2.6 teacher_sessions — 선생님 모드 (Haru) 세션
-- ---------------------------------------------------------------------

CREATE TABLE public.teacher_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    outcome TEXT NOT NULL
        CHECK (outcome IN ('mastered', 'needs_review')),
    hint_count INTEGER NOT NULL DEFAULT 0
        CHECK (hint_count >= 0 AND hint_count <= 3),
    mastery_score INTEGER NOT NULL
        CHECK (mastery_score >= 0 AND mastery_score <= 100),

    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.teacher_sessions IS 'Haru 선생님 모드 세션 결과. 80점 이상이면 outcome=mastered.';


-- =====================================================================
-- 3. INDEXES
-- =====================================================================

-- 3.1 cards 테이블 인덱스
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_user_created ON public.cards(user_id, created_at DESC);
CREATE INDEX idx_cards_user_status ON public.cards(user_id, learning_status);
CREATE INDEX idx_cards_user_real_use ON public.cards(user_id, has_real_use)
    WHERE has_real_use = TRUE;
CREATE INDEX idx_cards_card_type ON public.cards(card_type);

-- payload JSONB 검색용 GIN 인덱스 (특정 키 검색이 잦을 때)
CREATE INDEX idx_cards_payload_gin ON public.cards USING GIN (payload);

-- source_input 텍스트 검색 (My Deck 검색 기능용)
CREATE INDEX idx_cards_source_input_trgm ON public.cards
    USING GIN (source_input gin_trgm_ops);

-- 3.2 card_tags 인덱스 (역방향 조회: 태그로 카드 찾기)
CREATE INDEX idx_card_tags_tag_id ON public.card_tags(tag_id);

-- 3.3 real_use_logs 인덱스
CREATE INDEX idx_real_use_user_used_on ON public.real_use_logs(user_id, used_on DESC);
CREATE INDEX idx_real_use_card_id ON public.real_use_logs(card_id);

-- 3.4 teacher_sessions 인덱스
CREATE INDEX idx_teacher_sessions_card_completed
    ON public.teacher_sessions(card_id, completed_at DESC);


-- =====================================================================
-- 4. TRIGGERS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4.1 real_use_logs INSERT 시 cards.real_use_count 증가 + has_real_use 동기화
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_real_use_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.cards
    SET real_use_count = real_use_count + 1,
        has_real_use = TRUE
    WHERE id = NEW.card_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_real_use_insert
    AFTER INSERT ON public.real_use_logs
    FOR EACH ROW
    EXECUTE FUNCTION sync_real_use_on_insert();

-- ---------------------------------------------------------------------
-- 4.2 real_use_logs DELETE 시 cards.real_use_count 감소
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_real_use_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.cards
    SET real_use_count = GREATEST(0, real_use_count - 1),
        has_real_use = (real_use_count - 1 > 0)
    WHERE id = OLD.card_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_real_use_delete
    AFTER DELETE ON public.real_use_logs
    FOR EACH ROW
    EXECUTE FUNCTION sync_real_use_on_delete();

-- ---------------------------------------------------------------------
-- 4.3 teacher_sessions outcome=mastered 시 cards.learning_status 업데이트
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_mastery_on_session()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.outcome = 'mastered' THEN
        UPDATE public.cards
        SET learning_status = 'mastered',
            mastered_at = COALESCE(mastered_at, NOW())
        WHERE id = NEW.card_id
            AND learning_status = 'learning';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_teacher_session_mastery
    AFTER INSERT ON public.teacher_sessions
    FOR EACH ROW
    EXECUTE FUNCTION sync_mastery_on_session();


-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================================
--
-- 정책:
--   - users: 본인만 읽기/수정
--   - cards, real_use_logs, teacher_sessions: 본인 소유만
--   - tags, card_tags: 모든 인증 사용자가 읽기 가능 (태그는 공유 마스터)
--                       단 card_tags의 INSERT/DELETE는 본인 카드에 한정
--
-- =====================================================================

-- 5.1 users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_self ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_self ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_insert_self ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5.2 cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY cards_select_own ON public.cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY cards_insert_own ON public.cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY cards_update_own ON public.cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY cards_delete_own ON public.cards
    FOR DELETE USING (auth.uid() = user_id);

-- 5.3 tags (모두 읽기 가능, 쓰기는 추후 정책 결정 — MVP는 시드 데이터만)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_select_all ON public.tags
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5.4 card_tags (본인 카드에 한정)
ALTER TABLE public.card_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY card_tags_select_own ON public.card_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = card_tags.card_id
                AND cards.user_id = auth.uid()
        )
    );

CREATE POLICY card_tags_insert_own ON public.card_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = card_tags.card_id
                AND cards.user_id = auth.uid()
        )
    );

CREATE POLICY card_tags_delete_own ON public.card_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.cards
            WHERE cards.id = card_tags.card_id
                AND cards.user_id = auth.uid()
        )
    );

-- 5.5 real_use_logs
ALTER TABLE public.real_use_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY real_use_select_own ON public.real_use_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY real_use_insert_own ON public.real_use_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY real_use_update_own ON public.real_use_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY real_use_delete_own ON public.real_use_logs
    FOR DELETE USING (auth.uid() = user_id);

-- 5.6 teacher_sessions
ALTER TABLE public.teacher_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_sessions_select_own ON public.teacher_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY teacher_sessions_insert_own ON public.teacher_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =====================================================================
-- 6. SEED DATA — 기본 태그
-- =====================================================================
-- PRD 4.1 카드 태그 시스템:
--   카테고리: #직장 #육아 #일상 #소셜 #관공서 #생활 #달력
--   문법: #て형 #のではないか #ほうです #겸양표현 #時候の挨拶 (점진 추가)
--   특수: #문화교정 #니모닉있음 #계절어 #わらべうた #冠婚葬祭 #생활제도
--   장소: #슈퍼 #관공서 #병원 #편의점 #신사 #직장 #보육원
-- =====================================================================

INSERT INTO public.tags (name, tag_type, color_token, icon_name) VALUES
-- 카테고리 (7)
('직장', 'category', 'navy', 'briefcase'),
('육아', 'category', 'orange', 'baby-carriage'),
('일상', 'category', 'gray', 'home'),
('소셜', 'category', 'purple', 'users'),
('관공서', 'category', 'blue', 'building-bank'),
('생활', 'category', 'amber', 'shopping-bag'),
('달력', 'category', 'red', 'calendar'),

-- 문법 (초기 5개, 사용자 카드에서 발견되는 대로 추가)
('て형', 'grammar', 'gray', NULL),
('のではないか', 'grammar', 'gray', NULL),
('ほうです', 'grammar', 'gray', NULL),
('겸양표현', 'grammar', 'gray', NULL),
('時候の挨拶', 'grammar', 'gray', NULL),

-- 특수 (6)
('문화교정', 'special', 'amber', 'sparkles'),
('니모닉있음', 'special', 'purple', 'bulb'),
('계절어', 'special', 'green', 'leaf'),
('わらべうた', 'special', 'red', 'music'),
('冠婚葬祭', 'special', 'navy', 'building-temple'),
('생활제도', 'special', 'blue', 'file-text'),

-- 장소 (7)
('슈퍼', 'place', 'orange', 'shopping-cart'),
('관공서', 'place', 'blue', 'building-bank'),
('병원', 'place', 'green', 'medical-cross'),
('편의점', 'place', 'navy', 'building-store'),
('신사', 'place', 'red', 'torii'),
('직장', 'place', 'navy', 'briefcase'),
('보육원', 'place', 'orange', 'building-community')

ON CONFLICT (name, tag_type) DO NOTHING;


-- =====================================================================
-- END OF MIGRATION v1.0
-- =====================================================================
