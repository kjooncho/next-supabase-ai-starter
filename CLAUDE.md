# My Niche (毎日) — Claude Code 가이드

## 프로젝트 개요

일본 거주 한국인 뉴커머를 위한 일본어 학습 앱.
"JLPT에 안 나오는 생활 문화"를 핵심 차별점으로 한다.

- **Figma**: https://www.figma.com/design/uy0KFFHL8JuoGEfVW5MhxX
- **스택**: Next.js App Router + Supabase + Vercel + Claude API (텍스트: Haiku 4.5, 이미지OCR: Sonnet 4.6)
- **타겟**: 모바일 웹 (390px 기준, iPhone 14)

---

## 디자인 토큰 규칙

코드에서 색상을 사용할 때 반드시 아래 CSS 변수를 사용한다.
하드코딩 절대 금지 (예: `#e8541a` 직접 사용 ❌).

### CSS 변수 (globals.css에 정의)

```css
:root {
  /* Brand */
  --color-primary: #1a1f3d;       /* 헤더, User 버블, 브랜드 */
  --color-accent: #e8541a;        /* CTA, 달마, 전송버튼 */
  --color-bg: #faf8f4;            /* 화면 배경 (Warm Off-white) */
  --color-surface: #ffffff;       /* 카드 배경 */

  /* Semantic */
  --color-success: #6b8f71;       /* Sage Green — 숙달완료 */
  --color-cultural: #f5a623;      /* Amber — 문화 노트 */
  --color-cultural-bg: #fef6ec;   /* Amber tint — 문화 카드 배경 */
  --color-cultural-border: #f5d4a3; /* Amber border */
  --color-mnemonic: #9b59b6;      /* Purple — 니모닉 */
  --color-mnemonic-bg: #f0e9f4;   /* Purple tint — 니모닉 카드 배경 */
  --color-mnemonic-border: #d8bfe8; /* Purple border */
  --color-real-use: #27ae60;      /* Bright Green — 써봤어요 */
  --color-error: #e74c3c;         /* Red — 삭제, 완전정복 */

  /* Text */
  --text-primary: #1a1a1a;
  --text-secondary: #6b6b6b;
  --text-tertiary: #9c9a92;

  /* UI */
  --color-tag-bg: #f0ede6;
  --color-hairline: #e8e4dc;

  /* Mastery */
  --mastery-learning: #d4d0c5;
  --mastery-mastered: #6b8f71;
  --mastery-real-use: #27ae60;
  --mastery-conquered: #e74c3c;

  /* Chat bubbles */
  --bubble-user: #1a1f3d;
  --bubble-ai: #ffffff;
  --bubble-grandma: #fef6ec;

  /* STEP 번역 진행 색상 */
  --step-0: #e8541a;   /* 문화 교정 */
  --step-1: #1a1f3d;   /* 구조 대응 */
  --step-2: #1a1f3d;   /* 번역 3버전 */
  --step-3: #f5a623;   /* 문법 */
  --step-4: #6b8f71;   /* 문화 맥락 */
  --step-5: #9b59b6;   /* 니모닉 */
}
```

---

## 타이포그래피 규칙

폰트: **Noto Sans KR** (한국어/영어), **Noto Serif JP** (일본어 표시)

```css
/* 한국어/UI 텍스트 */
font-family: 'Noto Sans KR', sans-serif;

/* 일본어 표현 (카드, 번역 결과) */
font-family: 'Noto Serif JP', serif;
```

| 클래스 | size | weight | 용도 |
|--------|------|--------|------|
| `.text-h1` | 24px | 700 | 화면 메인 타이틀 |
| `.text-h2` | 20px | 600 | 섹션 헤더 |
| `.text-body-md` | 16px | 500 | 본문 강조 |
| `.text-body` | 14px | 400 | 일반 본문 |
| `.text-caption` | 13px | 400 | 캡션, 태그 |

---

## 컴포넌트 규칙

### Button

```tsx
// variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'realUse'
// size: 'sm' | 'md' | 'lg'
<Button variant="primary" size="md">확인</Button>
```

- 한 화면에 Primary는 1개만
- realUse는 "✓ 써봤어요" 전용
- 색상은 CSS 변수만 사용

### Card

5종: `translation` | `cultural` | `calendar` | `mnemonic` | `realUse`

```tsx
<Card type="translation">...</Card>
```

- `translation`: 배경 `--color-surface`
- `cultural`: 배경 `var(--color-cultural-bg)`, 테두리 `var(--color-cultural-border)`
- `mnemonic`: 배경 `var(--color-mnemonic-bg)`, 테두리 `var(--color-mnemonic-border)`

### ChatBubble

```tsx
// role: 'user' | 'ai-nichi' | 'grandma'
<ChatBubble role="user">보육원 선생님한테...</ChatBubble>
```

- user: 우측 정렬, `var(--bubble-user)` 배경, 흰 텍스트
- ai-nichi: 좌측 정렬, 흰 배경, 달마 아바타
- grandma: 좌측 정렬, `var(--bubble-grandma)` 배경

### MasteryBadge

```tsx
// stage: 'learning' | 'mastered' | 'real-use' | 'conquered'
<MasteryBadge stage="mastered" />
```

2차원 매트릭스:
- `learning_status × has_real_use` 조합으로 결정
- learning + !realUse = 학습중 (회색)
- mastered + !realUse = 숙달완료 (sage green)
- learning + realUse = 써봤어요 (bright green)
- mastered + realUse = 완전정복 (red)

---

## 레이아웃 규칙

- 모바일 기준: `max-w-[390px]` (iPhone 14)
- Safe Area: 상단 `pt-[59px]`, 하단 `pb-[34px]`
- 탭바 높이: `h-[80px]` (하단 고정)
- 헤더 높이: `h-[56px]`

### 5탭 구조

```
채팅(/) | 지도(/map) | 생활(/life) | 내 카드(/deck) | 漢字(/kanji)
```

---

## AI / API 규칙

- 모델 (텍스트 번역): `claude-haiku-4-5-20251001` — `lib/anthropic.ts`의 `MODEL` 상수
- 모델 (이미지 OCR): `claude-sonnet-4-6` — `app/api/image-translate/route.ts`에 하드코딩
- Prompt Caching 필수 적용 (system prompt에 `cache_control`)
- SSE keepalive: 5초마다 `: ping\n\n` 전송 (Vercel idle timeout 방지)
- Rate limit: 사용자당 50회/일 (`lib/rate-limit.ts`)
- 입력 길이 제한: 500자 (`lib/anthropic.ts`의 `INPUT_LIMIT`)
- 비용 상한: $30/day (Anthropic Console Spend Limit)

### 문화 교정 프롬프트

`~/myniche/eval/cultural_correction_prompt.yaml` 참조.
API 호출 시 이 파일의 `system_prompt`와 `tool_definition`을 사용한다.

---

## 데이터 모델

`~/myniche/data-model/` 참조.

- `migration_v1_0.sql`: Supabase 마이그레이션 (60 statements)
- `schemas.ts`: TypeScript + Zod 타입 정의
- 핵심 테이블: `cards` (Single Table + JSONB)

card_type: `sentence` | `calendar` | `episode`

---

## 파일 구조

```
~/myniche/app/          ← Next.js App Router
├── (tabs)/
│   ├── page.tsx        ← 채팅 (번역)
│   ├── map/            ← 지도 (학습 지도)
│   ├── life/           ← 생활 일본어 에피소드 목록
│   ├── life/[id]/      ← 에피소드 상세
│   ├── deck/           ← 내 카드
│   ├── kanji/          ← 한자 학습
│   └── teacher/        ← AI 선생님
├── api/
│   ├── chat/route.ts           ← 문화 교정 + 번역 (SSE)
│   ├── image-translate/route.ts← 이미지 OCR + 번역 (SSE)
│   ├── teacher/route.ts        ← AI 선생님 대화
│   └── teacher-quiz/route.ts   ← 퀴즈 생성
├── components/
│   ├── ui/             ← Button, TabBar 등
│   └── chat/           ← 번역 결과 컴포넌트
└── lib/
    ├── supabase.ts     ← Supabase client
    ├── anthropic.ts    ← MODEL, INPUT_LIMIT 상수
    ├── rate-limit.ts   ← 일일 사용량 체크
    ├── kanji.ts        ← JLPT N5 한자 데이터 (71개)
    ├── episodes.ts     ← 에피소드 데이터 (41개)
    └── prompts.ts      ← 시스템 프롬프트 모음
```

---

## 금지 사항

- 색상 하드코딩 (`#e8541a` 직접 사용 ❌) — CSS 변수 사용
- PostHog·Sentry 출시 전 추가 ❌ (출시 후 결정)
- `any` 타입 사용 ❌
- Tailwind arbitrary value 남용 ❌ (CSS 변수 사용)
