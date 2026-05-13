# My Niche — Data Model v1.0

Supabase 마이그레이션 SQL + TypeScript 타입/스키마 풀세트.

## 파일 구성

```
migration_v1_0.sql          # PostgreSQL 마이그레이션 (60 statements)
schemas.ts                  # TypeScript 타입 + Zod 런타임 스키마
test_schemas.ts             # 12개 검증 테스트 (모두 통과 확인)
DATA_MODEL_README.md        # 본 문서
```

## 검증 결과

```
SQL  : pglast 파서로 60개 statement 모두 파싱 통과
TS   : tsc strict mode 컴파일 통과
Zod  : 12/12 런타임 테스트 통과
       (sentence/calendar/episode payload + RealUseLog + Card discriminated union)
```

## 데이터베이스 구조 요약

| 테이블 | 역할 | 행 수 추정 (300 카드 기준) |
|---|---|---|
| `users` | 사용자 도메인 | 1 |
| `cards` | 카드 통합 (3축) | 300 |
| `tags` | 태그 마스터 (시드 25개) | 25 ~ 50 |
| `card_tags` | 카드↔태그 N:M | 600 ~ 900 (카드당 평균 2-3 태그) |
| `real_use_logs` | "써봤어요" 기록 | 60 ~ 100 (20% 카드가 1-2회 기록) |
| `teacher_sessions` | Haru 세션 결과 | 200 ~ 500 (카드당 1-2회) |

## SQL 적용 방법

### 옵션 1. Supabase 대시보드에서 직접 실행

1. Supabase 프로젝트 → SQL Editor
2. `migration_v1_0.sql` 내용을 붙여넣기
3. Run 클릭

### 옵션 2. Supabase CLI (권장)

```bash
# 프로젝트 초기화
supabase init

# 마이그레이션 파일로 복사
mkdir -p supabase/migrations
cp migration_v1_0.sql supabase/migrations/20260510120000_initial_schema.sql

# 로컬 DB에 적용
supabase db reset

# 원격 적용
supabase db push
```

### 적용 후 검증

```sql
-- 테이블 6개가 모두 생성되었는지
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- 기대 결과: card_tags, cards, real_use_logs, tags, teacher_sessions, users

-- 시드 태그가 들어갔는지
SELECT tag_type, count(*) FROM public.tags GROUP BY tag_type;
-- 기대 결과: category 7, grammar 5, special 6, place 7

-- RLS가 활성화됐는지
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
-- 모든 테이블이 rowsecurity=true 이어야 함
```

## TypeScript 사용 방법

### 설치

```bash
npm install zod
npm install --save-dev typescript @types/node
```

### 기본 사용 패턴

```typescript
import { CardSchema, type Card, getCardPreview, getCardStatusLabel } from './schemas';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './schemas';

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// === 1. 카드 조회 + 검증 ===
const { data: rawCard } = await supabase
  .from('cards')
  .select('*')
  .eq('id', cardId)
  .single();

const card: Card = CardSchema.parse(rawCard);  // payload까지 검증

// === 2. UI에서 사용 ===
console.log(getCardPreview(card));        // 카드 미리보기 텍스트
console.log(getCardStatusLabel(card));    // { label: '써봤어요', color: 'green' }

// === 3. 카드 생성 ===
const { error } = await supabase.from('cards').insert({
  user_id: userId,
  card_type: 'sentence',
  payload: {
    korean_input: '저희 아이는 22개월이 되었어요',
    step0_cultural: { needs_correction: true, ... },
    step2_versions: { casual: '...', polite: '...', formal: '...' },
    // ...
  } satisfies SentencePayload,
});

// === 4. 실전 사용 기록 ===
const { error } = await supabase.from('real_use_logs').insert({
  card_id: cardId,
  user_id: userId,
  situations: ['육아'],
  self_rating: 'awkward',
  memo: '보육원 선생님한테 썼는데 약간 어색했어요',
});
// 트리거가 자동으로 cards.real_use_count++, has_real_use=true
```

### Zod 검증 vs TypeScript 타입 — 언제 무엇을?

**TypeScript 타입만 사용 (compile-time)**:
- 함수 인자/반환 타입 정의
- props 정의
- 우리가 만든 데이터를 다룰 때

**Zod 검증 사용 (runtime)**:
- Supabase에서 받은 데이터 (DB가 변할 수 있음)
- API 응답 (Claude 응답 등 외부)
- 사용자 입력 (form 데이터)
- 마이그레이션 후 데이터 정합성 체크

권장: **DB 경계에서는 Zod로 검증, 내부 코드는 TS 타입만**.

## 핵심 쿼리 레퍼런스

### Q1. My Deck 화면 — 사용자 카드 목록 + 태그 + 학습 상태

```sql
SELECT
  c.id,
  c.card_type,
  c.learning_status,
  c.has_real_use,
  c.real_use_count,
  c.payload,
  c.created_at,
  array_agg(DISTINCT jsonb_build_object(
    'id', t.id, 'name', t.name, 'color', t.color_token
  )) FILTER (WHERE t.id IS NOT NULL) AS tags
FROM cards c
LEFT JOIN card_tags ct ON c.id = ct.card_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE c.user_id = $1
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT 20;
```

### Q2. 패턴 분석 — 약한 문법 포인트

```sql
-- "이번 달 직장 카테고리 카드 중 awkward 평가가 많은 문법"
WITH recent_logs AS (
  SELECT rul.*
  FROM real_use_logs rul
  WHERE rul.user_id = $1
    AND rul.used_on >= CURRENT_DATE - INTERVAL '30 days'
    AND '직장' = ANY(rul.situations)
)
SELECT
  t.name AS grammar_point,
  COUNT(*) AS use_count,
  COUNT(*) FILTER (WHERE rl.self_rating = 'awkward') AS awkward_count,
  ROUND(
    COUNT(*) FILTER (WHERE rl.self_rating = 'awkward')::numeric / COUNT(*),
    2
  ) AS awkward_rate
FROM recent_logs rl
JOIN cards c ON rl.card_id = c.id
JOIN card_tags ct ON c.id = ct.card_id
JOIN tags t ON ct.tag_id = t.id
WHERE t.tag_type = 'grammar'
GROUP BY t.name
HAVING COUNT(*) >= 3
ORDER BY awkward_rate DESC, awkward_count DESC
LIMIT 5;
```

### Q3. 컨텍스트 인젝션 — Claude API 호출 전 사용자 컨텍스트

```sql
SELECT
  u.level,
  u.life_situations,
  COUNT(c.id) AS total_cards,
  COUNT(c.id) FILTER (WHERE c.has_real_use) AS used_cards,
  array_agg(DISTINCT t.name ORDER BY t.name)
    FILTER (WHERE t.tag_type = 'category') AS top_categories
FROM users u
LEFT JOIN cards c ON u.id = c.user_id
LEFT JOIN card_tags ct ON c.id = ct.card_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE u.id = $1
GROUP BY u.id;
```

## 트리거 동작 검증

마이그레이션 적용 후 트리거가 잘 작동하는지 수동 검증:

```sql
-- 1. 테스트 사용자 + 카드 생성
INSERT INTO users (id, email) VALUES (gen_random_uuid(), 'test@example.com')
RETURNING id; -- 결과 user_id를 메모

INSERT INTO cards (user_id, card_type, payload) VALUES (
  '메모한_user_id',
  'sentence',
  '{"korean_input": "test", "step0_cultural": {"needs_correction": false},
    "step1_structure": [], "step2_versions": {"casual": "a", "polite": "b", "formal": "c"},
    "step3_grammar": [], "recommended_version": "casual", "has_mnemonic": false}'::jsonb
) RETURNING id; -- 결과 card_id 메모

-- 2. real_use_logs 추가 → cards.real_use_count++ 트리거 작동 확인
INSERT INTO real_use_logs (card_id, user_id, situations, self_rating)
VALUES ('메모한_card_id', '메모한_user_id', ARRAY['일상'], 'natural');

SELECT real_use_count, has_real_use FROM cards WHERE id = '메모한_card_id';
-- 기대: real_use_count=1, has_real_use=true

-- 3. teacher_sessions outcome=mastered → cards.learning_status 자동 변경
INSERT INTO teacher_sessions (card_id, user_id, outcome, mastery_score)
VALUES ('메모한_card_id', '메모한_user_id', 'mastered', 85);

SELECT learning_status, mastered_at FROM cards WHERE id = '메모한_card_id';
-- 기대: learning_status='mastered', mastered_at != NULL

-- 4. 정리
DELETE FROM users WHERE id = '메모한_user_id';
-- CASCADE로 모든 자식 row 자동 삭제됨
```

## 인덱스 전략 요약

| 인덱스 | 쿼리 패턴 | 효과 |
|---|---|---|
| `idx_cards_user_created` | My Deck 시간순 정렬 | 최우선 |
| `idx_cards_user_status` | 학습중/숙달 필터 | 자주 사용 |
| `idx_cards_user_real_use` | 써봤어요 필터 (partial) | 인덱스 크기 작음 |
| `idx_cards_payload_gin` | JSONB 내부 검색 | payload 검색 시 필수 |
| `idx_cards_source_input_trgm` | 카드 미리보기 텍스트 검색 | 부분 일치 검색 |
| `idx_card_tags_tag_id` | 태그→카드 역방향 조회 | 태그 클릭 시 |
| `idx_real_use_user_used_on` | 시간순 활동 타임라인 | 패턴 분석 |

## 데이터 모델의 한계와 향후 확장 포인트

### 알려진 한계

**1. JSONB payload 스키마 검증이 DB 레벨이 아님**
PostgreSQL의 JSON Schema 확장(`pg_jsonschema`)을 도입하면 DB 레벨 검증 가능. v2에서 검토.

**2. card_stats를 매번 집계**
카드 300장까지는 문제 없음. 1000장 넘어가면 Materialized View로 캐싱.

**3. 패턴 분석 쿼리가 무거움**
실시간 분석 대신 nightly 배치로 `user_pattern_summary` 테이블에 집계 결과 저장 검토 (v2).

### v2 확장 시 추가 가능한 테이블

- `mini_lessons` — 패턴 분석 결과로 추천된 미니 레슨
- `dialect_episodes` — 오사카·교토·후쿠오카 방언 시리즈
- `audio_assets` — 오바아찬 음성 TTS
- `seasonal_banners` — 자동 생성된 시즌 배너 캐시

## 변경 이력

- v1.0 (2026-05-10): 초기 스키마 6테이블 + 12인덱스 + 3트리거 + 18 RLS 정책
