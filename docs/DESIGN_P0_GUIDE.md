# My Niche — Design P0 수정 가이드

PRD 4.1에서 결정됐지만 UI에 미반영된 P0 3건의 수정 가이드.

---

## 작업 우선순위 및 예상 시간

| 항목 | 영향 범위 | 예상 시간 (1인) |
|---|---|---|
| P0-1. Nichi 아바타 교체 | Image 1, 2, 3 (3개 화면) | 4-6시간 |
| P0-2. 탭바 4탭 통일 | 모든 메인 화면 (4-5개) | 2-3시간 |
| P0-3. 지도 → 생활 탭 서브뷰 | Image 7 + 신규 생활 탭 화면 | 6-8시간 |
| **합계** | | **12-17시간 (2-3일)** |

8월 초, 본격 개발 시작 전에 처리하는 것이 권장됩니다.

---

# P0-1. Nichi 아바타 — 팬더 → 달마(達磨)

## 컨셉

**달마(だるま)** 는 일본의 전통 부적 인형으로, 두 가지 핵심 의미를 갖습니다.

1. **"七転び八起き"(나나코로비 야오키)** — 일곱 번 넘어져도 여덟 번 일어난다는 의미. My Niche의 학습 철학(꾸준한 누적)과 직결.
2. **눈을 그려 넣는 풍습** — 목표를 세울 때 한쪽 눈, 달성 시 다른 눈을 그린다. 학습자의 진행도 시각화에 응용 가능 (v2 게이미피케이션).

## 디자인 사양

```yaml
shape:
  type: 둥근 달걀형 (ellipse)
  ratio: width:height = 1 : 1.1 (살짝 세로로 김)
  outline: stroke 2px

colors:
  body: "#e8541a"          # brand-accent
  outline: "#1a1f3d"       # brand-primary
  face_area: "#faf8f4"     # bg-primary
  detail_accent: "#f5a623" # cultural-tip (격려·기쁨에만)

eyebrows:
  stroke: 3px (캐릭터의 정체성 — 굵게 유지)
  shape: 짧은 곡선

eyes:
  default: 곡선 (^^_^^ 같은 부드러운)
  joy: ^_^
  curious: 동그란 점
  encouraging: 곡선 + 부드러운 빛
  thinking: 직선 (눈 감음)

mouth:
  default: 작은 곡선 미소
  joy: 큰 미소
  curious: O 또는 작은 동그라미
  encouraging: 부드러운 미소
  thinking: 직선
```

## 5가지 표정 변형

| 상태 | 사용 시점 | 시각 표현 |
|---|---|---|
| `default` | 채팅 시작, 일반 응답 | 친근한 미소 |
| `joy` | 카드 저장, 정답, "써봤어요!" | 큰 미소 + 볼 터치 |
| `curious` | 사용자 질문 받을 때 | 동그란 눈 + ? 마크 |
| `encouraging` | 어려워하는 사용자에게 | 따뜻한 미소 + 빛 |
| `thinking` | 분석 중, 로딩 | 눈 감음 + 점점점 |

## 사용 사이즈

| 컨텍스트 | 사이즈 |
|---|---|
| 채팅 말풍선 옆 | 40px |
| 화면 헤더 (브랜드 표시) | 24px |
| 빈 상태 일러스트 | 80px |
| 온보딩 환영 화면 | 120px |

## Stitch / Midjourney 재생성 프롬프트

```
Create a minimalist daruma (達磨) avatar character for a Japanese 
learning app. Round egg-shaped body with these specifications:

- Body color: #e8541a (vermillion orange)
- Outline: #1a1f3d navy, 2px stroke
- Inner face area: #faf8f4 warm off-white  
- Bold expressive eyebrows in #1a1f3d, 3px stroke (signature feature)
- Simple curved-line eyes and mouth
- 5 expression variants: default smile, joy (^_^), curious (with ?), 
  encouraging (with light spark), thinking (with thought dots)

Style: Flat illustration, no gradients, no shadows.
The character represents perseverance ("seven times down, eight times up") 
in Japanese culture. Aesthetic: minimal, friendly, modern Japanese.
Avoid traditional decorative patterns on body. Keep it simple and clean.
Output: SVG, 200x220px, transparent background.
```

## Figma 적용 체크리스트

- [ ] **Image 2 채팅 화면** — 좌측 AI 말풍선 옆 40px 아이콘 교체
- [ ] **Image 3 딥 번역 전체화면** — 상단 "AI-Nichi가 번역을 완료했어요!" 옆 24px 아이콘 교체
- [ ] **Image 1 디자인 시스템 시트** — Chat Bubble - AI 항목의 아바타 이미지 업데이트
- [ ] **컴포넌트 라이브러리** — `Avatar/Nichi/Default`, `Avatar/Nichi/Joy` 등 5개 variant로 분리
- [ ] **Lottie / 인터랙티브 자산** — 채팅 응답 시 표정이 바뀌는 micro-interaction 자산
- [ ] **확인 — Image 4, 7, 8은 변경 불요** (Nichi가 등장하지 않음)

## 대안 검토 — 붓스트로크(墨) 스타일

PRD 4.1에서 언급된 대안인 "붓스트로크 추상 캐릭터"도 고려할 수 있습니다.

| 비교 | 달마 | 붓스트로크 |
|---|---|---|
| 일본 정체성 | 강함 | 매우 강함 |
| 친근함 | 매우 높음 | 보통 |
| 표정 변형 | 쉬움 (5가지+) | 어려움 (추상이라) |
| 브랜드 일관성 | 로고와 분리 | 로고(붓+한자)와 통합 |
| 학습 철학 매핑 | 七転び八起き | 끊임없는 획 |

**권장: 달마.** 표정 변형이 핵심 인터랙션 요소이고, 친근함이 학습자 진입 장벽을 낮춥니다. 붓스트로크는 v2 다이얼렉트 시리즈 등에서 별도 캐릭터로 활용 가능.

---

# P0-2. 탭바 4탭 통일

## 변경 내용

| 위치 | Before (Image 7) | After (PRD 4.1) | 변경 유형 |
|---|---|---|---|
| 탭 1 | 채팅 | 채팅 | 유지 |
| 탭 2 | My Deck | 달력 | **교체** |
| 탭 3 | 학습 지도 | 생활 | **교체** (지도는 생활 내부로) |
| 탭 4 | 마이페이지 | 내 카드 | **교체** (My Deck 이동 + 리네이밍) |

마이페이지 기능은 어디로?
- **계정·설정 같은 메타 기능** → 채팅 탭 헤더 우측 프로필 아이콘 (Image 2처럼)
- **학습 통계** → 내 카드 탭 상단 (이미 Image 4에 있음)

마이페이지를 별도 탭으로 둘 만큼 콘텐츠가 풍부하지 않고, 매일 사용하는 4가지 핵심 액션(번역·달력 보기·생활 학습·카드 복습)이 동등한 1급 시민이 되어야 합니다.

## 디자인 사양

```yaml
container:
  height: 56px (safe-area 미포함)
  background: "#ffffff"
  border-top: 0.5px solid "#e8e4dc"
  position: fixed bottom

tab_item:
  width: 25%
  layout: vertical (icon 위, label 아래)
  
  icon:
    size: 24px
    style: Tabler icons outline (line style)
    
  label:
    font-size: 11px
    font-weight: 400 (active일 때 500)
    margin-top: 4px
    
  active_state:
    icon_color: "#e8541a"
    label_color: "#e8541a"
    indicator: 상단 2px 라인 (탭 너비의 60%, 가운데 정렬)
    
  inactive_state:
    icon_color: "#8e8e93"
    label_color: "#8e8e93"
```

## 아이콘 매핑

```yaml
tab_chat:
  icon: ti-message-circle
  label_kr: 채팅
  label_jp: チャット
  
tab_calendar:
  icon: ti-calendar-event
  label_kr: 달력
  label_jp: カレンダー
  
tab_life:
  icon: ti-map-2
  label_kr: 생활
  label_jp: 暮らし
  
tab_deck:
  icon: ti-cards
  label_kr: 내 카드
  label_jp: マイデッキ
```

## Figma 적용 체크리스트

- [ ] **Image 7 화면** — 하단 탭바 4탭으로 재구성, 학습 지도 탭을 생활 탭으로 라벨 변경
- [ ] **모든 메인 화면의 하단 탭바 컴포넌트 통일** — Image 2, 4, 7에 등장하는 탭바가 모두 동일해야 함
- [ ] **컴포넌트화** — `TabBar/Active=Chat`, `TabBar/Active=Calendar`, ... 4가지 variant
- [ ] **마이페이지 → 채팅 헤더 우측 프로필 아이콘으로** — Image 2 우상단의 사용자 아바타가 탭하면 기존 마이페이지 기능 진입
- [ ] **빠진 화면 그리기** — 달력 탭, 생활 탭은 디자인 시트에 미존재. 신규 생성 필요

---

# P0-3. 지도 UI를 생활 탭 서브뷰로 IA 재설계

## IA 결정 — 옵션 A (상단 세그먼트 컨트롤)

3가지 옵션 검토 결과 **상단 세그먼트 컨트롤** 방식이 권장됩니다.

선정 이유:
1. iOS HIG 표준 패턴, 학습 곡선 0
2. v1(에피소드만) → v2(지도 추가)의 점진적 확장 자연스러움
3. 두 콘텐츠가 동등한 위계, PRD 의도와 일치

## 화면 구조

```
[생활 탭 진입 시]
┌─────────────────────────────┐
│  ← 생활                  ⋯  │  ← 헤더 (top safe-area + 44px)
├─────────────────────────────┤
│  ┌───────────┬───────────┐  │
│  │ 에피소드   │ 동네 지도  │  │  ← 세그먼트 컨트롤 (sticky)
│  │ ● 활성    │           │  │     v1: 에피소드만, v2: 둘 다
│  └───────────┴───────────┘  │     [v2에서 추가, v1은 컨트롤 자체 숨김]
├─────────────────────────────┤
│                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐   │  ← 영역별 칩 (가로 스크롤)
│  │전체│ │돈│ │지역│ │음식│   │
│  └───┘ └───┘ └───┘ └───┘   │
│                             │
│  ┌─────────────────────┐   │  ← 에피소드 카드 (세로 스크롤)
│  │ 🏮 回覧板             │   │
│  │ 동네 할머니 토크 #02  │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 🏪 商店街             │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

## v1 vs v2 처리

```yaml
v1_mvp:
  segment_control: 표시 안 함 (단일 뷰)
  contents: 에피소드 리스트만
  reason: 단순함 우선, 비활성 세그먼트는 사용자 혼란

v2_roadmap:
  segment_control: 표시
  default_segment: 에피소드 (콘텐츠가 풍부)
  map_segment_features:
    - 수채화 동네 지도
    - 핀 8종 (슈퍼·병원·시청·은행·보육원·우체국·편의점·신사)
    - 핀 탭 시 관련 카드 진입
    - 이번 달 방문 장소 통계
```

## 세그먼트 컨트롤 디자인 사양 (v2용)

```yaml
container:
  margin: 16px (좌우)
  margin-top: 12px (헤더 아래)
  
control:
  height: 36px
  background: "#ffffff"
  border: 0.5px solid "#e8e4dc"
  border-radius: 18px (pill)
  display: flex
  
segment:
  flex: 1
  height: 100%
  border-radius: 18px
  font-size: 13px
  font-weight: 400 (active=500)
  
  active:
    background: "#1a1f3d"
    color: "#ffffff"
    
  inactive:
    background: transparent
    color: "#888780"
```

## 진입/복귀 흐름

```
[채팅 탭] → [생활 탭 진입]
              ↓
              [에피소드 세그먼트 (default)]
              ↓
              [에피소드 카드 탭]
              ↓
              [에피소드 풀스크린]
                ↓ "다음 에피소드"
                [다음 에피소드 풀스크린]
                ↓ "← 닫기"
              [생활 탭 — 에피소드 세그먼트로 복귀]

[v2: 동네 지도 세그먼트]
              ↓
              [지도 풀화면]
              ↓ 핀 탭
              [장소 정보 시트 — bottom sheet]
              ↓ "표현 배우기"
              [관련 에피소드 또는 카드로 점프]
              ↓ 닫기
              [지도로 복귀]
```

핵심: **지도는 생활 탭 안의 한 뷰일 뿐, 별도 진입점이 아님**. 채팅에서 시즌 배너로 진입할 때도 항상 생활 탭의 에피소드 세그먼트로 들어오게 함.

## Figma 적용 체크리스트

- [ ] **Image 7 화면 폐기** — 학습 지도가 독립 탭으로 그려진 현재 디자인은 삭제
- [ ] **신규 화면: 생활 탭 메인** (에피소드 리스트, v1 버전)
- [ ] **신규 화면: 생활 탭 with 세그먼트** (v2 버전, 미래 참조용)
- [ ] **Image 7의 지도 디자인은 v2 자료로 보관** — 수채화 스타일과 핀 디자인은 그대로 살림
- [ ] **컴포넌트: SegmentControl** — 2-segment, 3-segment 둘 다 (v2 확장 대비)
- [ ] **시즌 배너 (채팅 탭 상단) 진입 처리** — 탭 시 생활 탭 → 에피소드 세그먼트로 이동

---

# 통합 작업 순서 추천

1. **Day 1 (4시간)**
   - P0-1 달마 아바타 디자인 (Stitch/Midjourney 또는 직접 SVG 작업)
   - 5가지 표정 variant 완성

2. **Day 2 (3-4시간)**
   - P0-2 탭바 컴포넌트 재구성
   - 모든 메인 화면(Image 2, 4, 7)에 적용
   - 마이페이지 → 헤더 프로필 아이콘 이전

3. **Day 3 (5-6시간)**
   - P0-3 생활 탭 메인 화면 신규 디자인
   - Image 7 지도 디자인은 v2 자료로 분리 보관
   - 시즌 배너 → 생활 탭 진입 흐름 정의
   - 컴포넌트 라이브러리 정리

총 12-14시간 = 2-3일 작업.

---

# 변경 이력

- v1.0 (2026-05-10): P0 3건 수정 가이드 초안 작성

---

# 참고 — Image별 변경 요약

| Image | 변경 사항 | 우선순위 |
|---|---|---|
| Image 1 (디자인 시스템) | Chat Bubble - AI 아바타 교체 | P0-1 |
| Image 2 (채팅 메인) | Nichi 아바타 교체, 탭바 4탭 통일 | P0-1, P0-2 |
| Image 3 (딥 번역) | 헤더 Nichi 아이콘 교체 | P0-1 |
| Image 4 (My Deck) | 탭바 4탭 통일, "내 카드"로 라벨 변경 | P0-2 |
| Image 5 (카드 플립) | 탭바 영역만 통일 (현재 미표시) | P0-2 |
| Image 6 (오바아찬) | 탭바 영역만 통일 (현재 미표시) | P0-2 |
| Image 7 (학습 지도) | **폐기 → 생활 탭 메인 신규 디자인** | P0-3 |
| Image 8 (선생님 모드) | 변경 없음 | - |
