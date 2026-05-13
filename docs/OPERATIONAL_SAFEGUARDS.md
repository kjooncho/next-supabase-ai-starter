# My Niche — Operational Safeguards v1.0

Production-ready 앱으로 운영하기 위한 안전장치. **MVP에서 빠지면 출시 직후 사고로 이어질 수 있는 항목들.**

이 문서는 다음 4가지 영역을 다룹니다:
1. 비용 상한 / API 어뷰즈 방지
2. 에러 처리 / 폴백 정책
3. 베타 피드백 수집 메커니즘
4. 분석 / 모니터링 도구

---

# Part 1. 비용 상한 / API 어뷰즈 방지

## 위협 시나리오

Claude API는 **토큰 단위 과금**입니다. 다음 상황에서 비용 폭증 가능:

| 시나리오 | 영향 | 일일 최대 비용 (1인) |
|---|---|---|
| 일반 사용자 폭증 | 정상 비용 증가 | ~$5 (사용자 100명, 1인당 10회) |
| 단일 사용자 어뷰즈 | 1명이 수천 회 호출 | ~$50/일 |
| 봇 공격 (크리덴셜 도용) | 자동화 무한 호출 | $1,000+/일 |
| Prompt injection으로 long output 유도 | output 토큰 폭증 | 위와 같음 |

**1인 개발자에게 $50/일도 한 달이면 $1,500. 봇 공격이면 카드 한도까지.**

## 방어 레이어 4단계

### Layer 1. Anthropic 콘솔 자체 한도 (필수)

```
Anthropic Console → Settings → Usage Limits
- Spend limit: $30/day, $200/month  (개인 프로젝트 가이드라인)
- Email alert: 80% 도달 시 알림
```

이게 **최후의 안전망**. 절대 비활성화 금지.

### Layer 2. Supabase Edge Function rate limiting

사용자별 메시지 호출을 DB에서 카운트하고 제한.

```typescript
// supabase/functions/chat/index.ts
const DAILY_LIMIT = 50;  // 사용자당 일일 메시지

const { data: today_count } = await supabase
  .from('rate_limits')
  .select('count')
  .eq('user_id', user.id)
  .eq('date', today)
  .single();

if (today_count?.count >= DAILY_LIMIT) {
  return new Response(
    JSON.stringify({ error: 'daily_limit_exceeded' }),
    { status: 429 }
  );
}
```

**필요한 신규 테이블:**

```sql
CREATE TABLE public.rate_limits (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

CREATE INDEX idx_rate_limits_date ON public.rate_limits(date);

-- 30일 지난 row 자동 삭제 (pg_cron)
SELECT cron.schedule(
    'cleanup-rate-limits',
    '0 3 * * *',
    $$DELETE FROM public.rate_limits WHERE date < CURRENT_DATE - 30$$
);
```

### Layer 3. 입력 길이 제한

```typescript
const MAX_INPUT_LENGTH = 500;

if (user_input.length > MAX_INPUT_LENGTH) {
  return new Response(
    JSON.stringify({ error: 'input_too_long', max: MAX_INPUT_LENGTH }),
    { status: 400 }
  );
}
```

이건 클라이언트 + 서버 양쪽에서 검증. 클라이언트만 하면 우회 가능.

### Layer 4. 비정상 패턴 탐지

| 패턴 | 임계값 | 조치 |
|---|---|---|
| 1분 내 동일 사용자 10회 호출 | 자동화 의심 | 1시간 차단 |
| 1시간 내 동일 IP 100회 호출 | 봇 의심 | 24시간 차단 |
| Output > 2000 토큰 (비정상) | injection 의심 | 로그 기록 + 검토 |

**구현 방법:** Layer 2의 rate_limits 테이블에 `pattern_flags` 컬럼 추가, Edge Function에서 체크.

## 비용 상한 권장 설정

| 단계 | Anthropic Spend Limit | 예상 사용자 |
|---|---|---|
| Eval 실행 단계 | $5/day | 1인 (본인) |
| 클로즈드 베타 | $20/day | 5명 |
| 오픈 베타 | $50/day | 50명 |
| 정식 출시 | 사용자 수에 비례 동적 조정 | - |

---

# Part 2. 에러 처리 / 폴백 정책

## Claude API 실패 시나리오

| 에러 유형 | 빈도 | 폴백 |
|---|---|---|
| Network timeout | 드뭄 (~0.1%) | 1회 retry → 사용자에게 "다시 시도" 버튼 |
| API rate limit (529) | 가끔 (peak time) | exponential backoff 3회 |
| 사용자 한도 초과 (429, 자체) | 사용자별 발생 | "오늘 한도 도달, 내일 다시" 메시지 |
| 모델 응답 형식 오류 (tool_use 누락) | 드뭄 (~0.5%) | 1회 retry, 실패 시 "잠시 후 다시" |
| Anthropic 측 장애 | 매우 드뭄 (~0.01%) | 캐시된 응답 활용 가능성 검토 |

## 페르소나별 폴백 응답

기획서에 언급된 [에러 핸들링] 섹션을 구체화. 각 페르소나가 자기 캐릭터를 유지하며 에러를 안내.

```yaml
# Nichi (채팅 탭)
error_messages:
  network_timeout: |
    "あれっ、すこし接続が遅いみたいですね。
     もう一度送ってみていただけますか？ 🙏"
  rate_limited: |
    "今日もたくさん学んでくれてありがとうございます！
     お疲れ気味なので、明日また一緒にやりましょう。
     (오늘 한도 도달했어요. 내일 다시 만나요!)"
  unknown: |
    "申し訳ありません、少し調子が悪いみたいです。
     しばらくしてからもう一度お試しください。"

# Obaachan (생활 탭)
error_messages:
  unknown: |
    "あらら、ちょっと話が止まっちゃった。
     しばらくしてからまた来てくださいね。お茶でも飲みながら待ちましょうか。"

# Haru (내 카드)
error_messages:
  unknown: |
    "申し訳ありません、少し休憩中です。
     後でまた一緒にがんばりましょう！💪"
```

## 트랜잭션 실패 처리

카드 저장 실패 시 데이터 손실 방지:

```typescript
async function saveCard(payload: SentencePayload) {
  // 1. 클라이언트 로컬 스토리지에 임시 저장
  localStorage.setItem('pending_card', JSON.stringify(payload));

  try {
    // 2. Supabase에 저장 시도
    const { error } = await supabase.from('cards').insert(payload);
    if (error) throw error;

    // 3. 성공 시 임시 저장 삭제
    localStorage.removeItem('pending_card');
  } catch (e) {
    // 4. 실패 시 사용자에게 알림 + 다음 접속 시 재시도
    showToast('카드 저장 실패. 다시 접속하면 자동 재시도합니다.');
  }
}

// 다음 접속 시 자동 재시도
async function retryPendingCard() {
  const pending = localStorage.getItem('pending_card');
  if (pending) {
    await saveCard(JSON.parse(pending));
  }
}
```

---

# Part 3. 베타 피드백 수집 메커니즘

## 클로즈드 베타 5명 운영 시

### 옵션 비교

| 도구 | 장점 | 단점 | 비용 |
|---|---|---|---|
| Discord 채널 | 실시간, 무료 | 베타 사용자가 Discord 안 쓰면 진입 장벽 | 무료 |
| Notion 페이지 | 구조화, 한국 사용자 친숙 | 대화 기록 분산 | 무료 |
| 인앱 피드백 폼 | 컨텍스트 보존 (어느 화면에서?) | 개발 필요 | ~4시간 개발 |
| Slack 그룹 | 직장인 친숙 | 무료 플랜 메시지 제한 | 무료/유료 |

**추천: 인앱 피드백 폼 + Notion 페이지 병행**

이유:
1. **인앱 폼**: 화면 컨텍스트 자동 첨부 (어느 카드에서, 어느 단계에서). 베타 사용자가 즉시 신고
2. **Notion 페이지**: 누적된 피드백을 카테고리별 정리 + 본인이 우선순위 결정

### 인앱 피드백 폼 구현

```typescript
// 어느 화면에서나 우측 하단 floating button
<FeedbackButton 
  onClick={() => openFeedback({
    screen: currentScreen,
    cardId: currentCard?.id,  // 카드 화면이면 자동 첨부
    timestamp: new Date()
  })}
/>

// 피드백 내용
interface FeedbackInput {
  type: 'bug' | 'suggestion' | 'praise' | 'question';
  message: string;       // 자유 기술
  screenshot?: File;     // 선택, 자동 첨부 가능
  rating?: 1 | 2 | 3 | 4 | 5;  // 별점
}
```

**필요한 신규 테이블:**

```sql
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'suggestion', 'praise', 'question')),
    message TEXT NOT NULL,
    screen_context TEXT,  -- "ChatMain", "CardDetail" 등
    card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'in_review', 'addressed', 'wont_fix')),
    admin_reply TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_status_created ON public.feedback(status, created_at DESC);
```

### Notion 페이지 구조 (운영자용)

```
📋 My Niche Beta Feedback
├── 🆕 New (자동 sync from Supabase)
├── 🔍 In Review
├── ✅ Addressed
└── ❌ Wont Fix

각 항목 properties:
- Type: bug / suggestion / praise / question
- Priority: P0 / P1 / P2
- User: (이메일)
- Screen: (자동 첨부)
- Created: (자동)
```

**Sync 방법:** Supabase Webhook → Notion API. 또는 매주 수동으로 CSV export → Notion import.

---

# Part 4. 분석 / 모니터링 도구

## MVP 단계 최소 조합 (무료)

### 1. PostHog (사용자 행동 분석)

```typescript
import posthog from 'posthog-js';

posthog.init(process.env.POSTHOG_API_KEY, {
  api_host: 'https://app.posthog.com',
});

// 핵심 이벤트만 추적
posthog.capture('card_created', {
  card_type: 'sentence',
  has_cultural_correction: true
});

posthog.capture('real_use_logged', {
  rating: 'awkward'
});

posthog.capture('teacher_session_completed', {
  outcome: 'mastered',
  hint_count: 1
});
```

**MVP 핵심 이벤트 (10개 이내):**
- `signup_completed`
- `first_card_created`  ← Aha moment
- `card_created` (with card_type)
- `real_use_logged` (with rating)
- `teacher_session_started/completed`
- `episode_opened` (with domain)
- `feedback_submitted`
- `daily_limit_reached`
- `error_occurred` (with type)

**주의:** 개인 식별 정보(이름, 이메일, 입력 한국어) 절대 전송 금지. user_id만 hash해서 전송.

### 2. Supabase Analytics (DB·API 모니터링)

기본 제공. 별도 설정 없이 활용:
- API 응답 시간 분포
- 슬로우 쿼리 식별
- DB 사용량
- Edge Function 호출 횟수

### 3. Sentry (에러 모니터링) — 선택

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% 샘플링 (무료 플랜 절약)
});
```

**무료 플랜:** 5,000 events/month. 베타 단계엔 충분.

## 핵심 지표 (KPI)

PRD 4.1의 성공 지표를 추적 가능한 형태로:

```yaml
short_term_30days:
  daily_active_users:
    target: 1+
    measure: posthog DAU
  
  cards_per_user:
    target: 30+ cumulative
    measure: cards 테이블 COUNT
  
  episode_open_rate:
    target: 5+ per user
    measure: episode_opened event count
  
  real_use_rate:
    target: 3+ per user
    measure: real_use_logs COUNT

long_term_6months:
  cards_per_user:
    target: 300+
    measure: cards 테이블 COUNT
  
  real_use_ratio:
    target: 20%+
    measure: COUNT(has_real_use=true) / COUNT(*)
  
  episode_completion:
    target: 60%+
    measure: 끝까지 본 비율 (PostHog funnel)
```

---

# 실행 우선순위

| 우선순위 | 항목 | 위치 |
|---|---|---|
| **P0** | Anthropic Spend Limit $30/day 설정 | Anthropic Console |
| **P0** | rate_limits 테이블 + Edge Function | Supabase migration v1.1 |
| **P0** | 입력 길이 500자 제한 | Frontend + Edge Function |
| **P0** | 페르소나별 에러 메시지 | Frontend i18n |
| **P1** | 인앱 피드백 폼 + feedback 테이블 | 베타 시작 전 |
| **P1** | PostHog 핵심 이벤트 10개 | 베타 시작 전 |
| **P2** | Sentry 에러 모니터링 | 오픈 베타 직전 |
| **P2** | 비정상 패턴 탐지 | 사용자 10명 이상 |

---

## 변경 이력

- v1.0 (2026-05-10): 초안 작성. MVP 출시 전 모두 구현 권장.
