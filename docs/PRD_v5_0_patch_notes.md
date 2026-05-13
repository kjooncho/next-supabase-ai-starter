# My Niche (毎日) — PRD v5.0 (Patch Notes)

> **이 문서는 PRD 4.1을 대체하지 않습니다. 4.1의 변경분만 정리한 패치 노트입니다.**
> 
> 7월 본 개발 시작 시 두 문서를 함께 참조하세요:
> - **PRD 4.1** (원본, 9000줄): 전체 기획·설계·프롬프트 풀세트
> - **PRD 5.0** (본 문서): 5월 검토·디자인 라운드·프로토타입 개발에서 도출된 변경사항

**작성일:** 2026-05-10
**기반 작업:** Eval 시스템 구축, 데이터 모델 확정, 디자인 P0/P1/P2 라운드, 프로토타입 v0.3 완성, 에피소드 EP-04 모범 사례 작성, Production Readiness 정리

---

## 변경 영역 요약

| 영역 | 4.1 → 5.0 변경 | 비고 |
|---|---|---|
| 시장 정의 | TAM 41만 → 1.5-3만 (정정) | README v1.1 반영 |
| 핵심 가치 차별점 | "AI 페르소나 차별화" 제거 | 시장 진입 시점 변화 |
| MVP 콘텐츠 분량 | 39개 → 15개 | 1인 작업 현실 |
| 아바타 캐릭터 | 팬더 → 달마 (AI-Nichi) | DESIGN_P0_GUIDE 결정, 학습 철학 매핑 |
| 데이터 모델 | Single Table + JSONB 확정 | migration_v1_0.sql |
| 검증 시스템 | Eval 90 케이스 + Pass criteria 4개 | golden_dataset, eval_runner |
| 비용 추정 | 캐싱 절감률 90% → 49% (정정) | EVAL_README v1.1 |
| 콘텐츠 작성 시간 | 60시간 → 75-90시간 (정정) | EPISODE_PRODUCTION_GUIDE v1.1 |
| 베타 리뷰어 보상 | 금전 → 선물·식사 | 친구 관계 유지 |
| 디자인 시스템 정본 | Image 8 시트 기반으로 통합 | DESIGN_SYSTEM_SPEC.md |
| 마스터리 시스템 | 단일 차원 → 4단계 (학습×사용 매트릭스) | 학습중 / 숙달완료 / 써봤어요 / 완전정복 |
| Production Readiness | 누락 발견 후 추가 | 개인정보처리방침 + 운영 안전장치 |

---

## §1. 시장 정의 정정

### PRD 4.1
> 일본 거주 한국인 약 41만 명을 잠재 사용자로 본다.

### PRD 5.0 (정정)
일본 거주 한국 국적자 41만 명은 **출입국재류관리청 전체 통계**이고, 본 앱의 실제 타겟은 더 좁다.

```
일본 거주 한국 국적자 총원       : 약 41만 명
└─ 특별영주권자 (재일교포)        : 약 28만 명  → 일본어 학습 불필요
└─ 뉴커머 (1965년 이후 이주)       : 약 13만 명  → 본 앱 타겟
   └─ N3-N5 학습 의지 있는 사용자  : 약 1.5만~3만 명 (5-10% 추정)
```

**의미:** 사업적 TAM은 작지만, 본 프로젝트는 **포트폴리오 + AI 디자인 프로세스 검증** 무대이므로 적정. 사업 확장 시 한국 내 일본어 학습자(약 30만+)로 확장 가능한 콘텐츠 구조(캘린더·오바아찬)는 이미 설계됨.

---

## §2. 핵심 가치 차별점 재정의

### PRD 4.1
> 1) AI 페르소나 (Nichi/Obaachan/Haru), 2) 한국 거주자 + 문화 통합, 3) "내가 하고 싶은 말이 커리큘럼"

### PRD 5.0
**시장 진입 시점이 2026년 12월이라는 점을 고려할 때, AI 페르소나 자체는 더 이상 차별점이 아니다.**

2025년부터 Talkpal, Duolingo Max, LingoDeer 등이 모두 AI 페르소나 기반 회화를 출시. 출시 시점에는 이미 1년+ 성숙한 시장.

**진짜 차별점 (재정의):**

1. **한국 거주자 + 문화 통합** — 어디에도 없는 빈 자리 (변동 없음)
2. **"내가 하고 싶은 말이 커리큘럼"** — 사용자 주도 학습 구조 (변동 없음)
3. **隣のおばあちゃんトーク** — JLPT 만점자도 모르는 생활 문화 (변동 없음)
4. **(신규) 콘텐츠 품질** — 위 3개를 진짜 차별점으로 만드는 핵심. AI 페르소나 만으로는 시장에서 통하지 않음

---

## §3. MVP 콘텐츠 분량 결정

### PRD 4.1
> 39개 에피소드 (생활 도메인 7종 × 평균 5-6편)

### PRD 5.0
**1인 작업 현실 반영 → 15개로 축소.**

```
Tier 1 (출시 직전 8개):
  お正月 / 入園式 / ふるさと納税 / 回覧板 /
  飲み会 / お盆 / 七五三 / 在留카드

Tier 2 (마감 임박 4개):
  部屋探し / ハンコ / 年末調整 / 節分

Tier 3 (출시 후 점진 3개):
  花見 / こどもの日 / コンビニ
```

**제작 시간 (정정):**
- 에피소드당 4-6시간 (자료조사 + 작성 + 검수 + 베타 리뷰 반영)
- 총 75-90시간, 10-12주 페이스 (4.1의 60시간/8주 추정은 비현실적이었음)

**EP-04 (回覧板) 모범 사례 작성 검증** (2026-05-10):
- 실제 1차 작성 시간: 220분 (3시간 40분)
- 한국 한자어 매칭 가능한 에피소드는 가이드 추정보다 빠름
- 제도 디테일이 복잡한 에피소드(ふるさと納税 등)는 가이드 추정대로 5-6시간 예상

---

## §4. 캐릭터 시스템 변경

### PRD 4.1 / 디자인 시스템 시트
> AI-Nichi: 흰색에 검은 무늬, 둥근 얼굴 (팬더 형태)

### PRD 5.0 (변경)
**AI-Nichi: 달마(達磨)로 교체.**

**이유:**
- 일본 문화 정체성 강화 (七転び八起き 학습 철학과 매핑)
- 시각적 임팩트 강화 (vermillion 단색 도형 → 강한 시각 정체성)
- 팬더는 일본/한국/중국 어디에도 강한 문화 연결고리 없음

**5가지 표정 변형 정의** (DESIGN_P0_GUIDE 참조):
- default / joy / curious / encouraging / thinking

**Figma 작업 시 영향:**
- 디자인 시스템 시트(Image 8)의 AI-Nichi 캐릭터 다시 그려야 함
- 8장 화면 모두에서 Nichi 등장 부분 일괄 교체

### AI-Grandma (隣のおばあちゃん)
시트 정본 그대로 유지. 회색 단발 + 안경 + 따뜻한 베이지 의상.

### Haru (선생님 모드)
PRD 4.1에서 "선생님 모드"는 정의됐으나 캐릭터 사양 미정. 5.0에서 추가:
- 짧은 검은 머리 + 베이지 후드 + 따뜻한 미소
- 본인이 가르치는 위치 (학생 → 선생님 역할 전환의 거울)

---

## §5. 데이터 모델 확정

### PRD 4.1
> 카드 시스템은 sentence/calendar/episode 3종으로 분리될 가능성. 정확한 스키마 미정.

### PRD 5.0 (확정)
**Single Table + JSONB 패턴.**

```sql
CREATE TABLE public.cards (
    id UUID PRIMARY KEY,
    user_id UUID,
    card_type TEXT NOT NULL CHECK (card_type IN ('sentence', 'calendar', 'episode')),
    payload JSONB NOT NULL,                -- 타입별 구조화 데이터
    learning_status TEXT DEFAULT 'learning' CHECK (... IN ('learning', 'mastered')),
    has_real_use BOOLEAN DEFAULT FALSE,
    real_use_count INTEGER DEFAULT 0,
    -- ...
);
```

**확정 사양** (migration_v1_0.sql 60 statements):
- sentence: korean_input + step2_versions + 5단계 메타
- calendar: event_name_jp/kr + event_date + emoji
- episode: domain + episode_number + scene + content_path
- 트리거: real_use_logs INSERT/DELETE → cards.real_use_count 자동 동기화
- 트리거: teacher_sessions outcome=mastered → cards.learning_status 자동 변경
- RLS 정책 18개 (사용자별 격리)

**TypeScript Zod 스키마**: schemas.ts (16KB), test_schemas.ts 12개 테스트 통과.

---

## §6. 마스터리 시스템 정의

### PRD 4.1
> 학습 진행도. 숙달 여부.

### PRD 5.0 (정의)
**2차원 매트릭스 → 4단계 마스터리 배지.**

```
                    learning_status
                    learning    mastered
has_real_use false  학습중       숙달완료
has_real_use true   써봤어요     완전정복
```

| 배지 | 색상 | 정의 |
|---|---|---|
| 🌱 학습중 | `#d4d0c5` | 카드 생성 직후 |
| ✓ 숙달완료 | `#6b8f71` (Sage Green) | 선생님 모드 통과 |
| ✓ 써봤어요 | `#27ae60` (Bright Green) | 실전 사용 1회 이상 |
| 👑 완전정복 | `#e74c3c` (Red) | 두 차원 모두 충족 |

**니모닉 차원 (독립)**: `has_mnemonic` 별도 표시. 4단계 어디든 함께 표시 가능.

---

## §7. 검증 시스템 정의

### PRD 4.1
> 문화 교정 정확도 측정 필요. 방법 미정.

### PRD 5.0 (정의)
**Eval 90 케이스 + 4가지 Pass Criteria.**

```yaml
Pass Criteria:
  binary_accuracy:        ≥ 85%   # needs_correction 일치율
  type_accuracy:          ≥ 75%   # positive 케이스에서 correction_type 일치
  false_positive_rate:    ≤ 15%   # negative 케이스를 positive로 오판정
  false_negative_rate:    ≤ 25%   # positive 케이스를 놓침 (v1.1 추가)
```

**90 케이스 분포:**
- Positive (교정 필요): 42 케이스, 8가지 유형
- Negative (직역 OK): 48 케이스
- 유형: 가족호칭 / 수치 / 나이 / 경어 / 겸양 / 감정표현 / 문화어휘 / 기타

**모델·비용:**
- Claude Haiku 4.5 ($1/$5 per MTok)
- 90 케이스 1회: $0.16
- 캐싱 적용: $0.08 (49% 절감, 4.1의 80-90% 추정은 잘못)
- Sonnet 4.6 fallback: $0.47/90 cases (3배)

---

## §8. 디자인 시스템 정본화

### PRD 4.1
> Color System / Typography / Components 등 기술. 그러나 8장 UI 화면과 일부 어긋남.

### PRD 5.0
**디자인 시스템 시트(Image 8 / 01.png)를 정본으로 삼고 8장 화면 통일.**

DESIGN_SYSTEM_SPEC.md (10KB) 신규 작성:
- 12색 + 텍스트 3색 + 보조 토큰
- 5단계 타이포 (Noto Sans KR / JP)
- 5종 카드 시스템 (번역 / 문화 / 캘린더 / 니모닉 / 써봤어요)
- 채팅 버블 3종 (User / AI-Nichi / AI-Grandma)
- 버튼 5종 (Primary / Secondary / Ghost / Danger / RealUse)
- 4단계 마스터리 배지
- 8장 화면별 통일 가이드 매트릭스

**P0 변경사항 (DESIGN_P0_GUIDE.md):**
- AI-Nichi: 팬더 → 달마
- 4탭 헤더 통일 (毎日 + 12일 연속 학습 + 사용자 아바타)
- 컬러 토큰 정정 (4건)
- 마스터리 배지 4단계 시스템
- 로고 표시 (도장 인장)

**P1 변경사항:**
- 시즌 배너: 큰 vermillion 박스 → Sage Green pill
- 카테고리 필터 7개 표준 (전체/직장/육아/일상/소셜/생활필수/문화)
- 문법 태그 4개 표준 (#て형 #ほうです #추측표현 #명사+の)
- 채팅 입력창 정비 (클립 + STEP 진행 + 최근 카드)

**P2 변경사항:**
- 카드 인터랙션: 플립 → 모달 풀스크린 상세
- 선생님 모드: My Deck 하단 EntryCard로 진입
- 학습 지도 (Image 2): v2 로드맵 유지 (제외)

---

## §9. Production Readiness 추가

### PRD 4.1
명시 안 됨.

### PRD 5.0 (신규 추가)
검토 단계에서 누락 발견 후 2개 문서 추가.

**PRIVACY_POLICY_DRAFT.md** (7KB):
- 일본 改正個人情報保護法 + 한국 PIPA + GDPR 3국 대응
- 수집 항목 / 보존 기간 / 사용자 권리 (열람·삭제·이동) / 제3자 제공
- MVP 출시 전 변호사 검토 필수 (예산: 일본 ¥30,000~¥50,000 또는 한국 30~50만원)

**OPERATIONAL_SAFEGUARDS.md** (12KB):
- 비용 상한 4단계 방어:
  1. Anthropic Console Spend Limit ($30/day)
  2. Edge Function rate limiting (사용자당 일일 50회)
  3. 입력 길이 제한 (500자)
  4. 비정상 패턴 탐지 (1분 10회 = 1시간 차단)
- 페르소나별 에러 메시지 (Nichi/Obaachan/Haru)
- 베타 피드백 수집 (인앱 폼 + Notion 병행)
- PostHog 핵심 이벤트 10개 + Sentry

---

## §10. 일정 재조정

### PRD 4.1
> 2026년 7월 ~ 2027년 1월 (6개월 1인 작업)

### PRD 5.0 (구체화) → v5.1 (사안 A·B·C 반영)

| 시기 | 작업 |
|---|---|
| **7월** | Eval 첫 실행 (preflight → 90 cases → 결과 분석). 베타 리뷰어 3명 섭외 시작 (일한모 등) |
| **8월** | Supabase + migration_v1_0.sql 적용. TypeScript 셋업. Figma 디자인 P0 3건 수정. Anthropic Spend Limit $30/day |
| **9-10월** | 핵심 기능 개발: 채팅 5단계 번역 + 문화 교정 + My Deck + 카드 저장. Prompt Caching. Edge Function rate limit |
| **10-11월** | **Tier 1 5편 작성** (회람판 / お正月 / 入園式 / 飲み会 / 在留카드, 주 1편 페이스). 캘린더 + 시즌 배너 + 인앱 피드백. PostHog 셋업 |
| **12월** | **클로즈드 베타 5명 운영 (변호사 검토 면제, 동의서로 대체)**. Vercel 배포. 포트폴리오 웹사이트. Sentry. CRISIS_PLAYBOOK 참조 |
| **2027년 1월 말** | **정식 출시** (1월 첫 주는 베타 결과 반영, 1월 말 신년 마케팅 시즌). 회고 + 음악 앱 프로젝트 이전 |
| **출시 후** | Tier 1 나머지 3편 (ふるさと納税 / お盆 / 七五三) 매월 1편씩 추가. 사용자 100명 도달 시 변호사 검토 |

**v5.1 변경 근거 (HEALTH_CHECK §4):**
- Tier 1 5편 축소 — 11-12월 콘텐츠 페이스 위기 (편당 220분 × 8편 + 코딩 = 비현실)
- 1월 말 출시 — 12월 후반 연말 휴가 시즌 부적합 (베타 응답률·초기 사용자 모두 불리)
- 변호사 단계화 — 추정 시장 1.5만~3만 명 대비 변호사 비용 50만원 ROI 약함

---

## §11. 산출물 패키지 (5월 시점)

7월 본 개발 시작 시점에 보유한 산출물:

```
Phase 1 - Eval (5개 파일)
  ├── golden_dataset.yaml (40KB, 90 cases)
  ├── cultural_correction_prompt.yaml (9KB, system + tool)
  ├── eval_runner.py (17KB, 4 criteria 자동 판정)
  ├── preflight_check.py (8KB, 환경 점검)
  └── EVAL_README + PROMPT_V2_GUIDE (12KB)

Phase 2 - 데이터 모델 (4개)
  ├── migration_v1_0.sql (16KB, 60 statements)
  ├── schemas.ts (16KB, Zod)
  ├── test_schemas.ts (8KB, 12 tests)
  └── DATA_MODEL_README (9KB)

Phase 3 - 디자인 (2개)
  ├── DESIGN_P0_GUIDE.md (13KB)
  └── DESIGN_SYSTEM_SPEC.md (10KB)

Phase 4 - 콘텐츠 (2개)
  ├── EPISODE_PRODUCTION_GUIDE.md (17KB)
  └── EP_04_kairanban.md (10KB, 모범 사례)

Phase 5 - Production Readiness (2개)
  ├── PRIVACY_POLICY_DRAFT.md (7KB)
  └── OPERATIONAL_SAFEGUARDS.md (12KB)

Phase 6 - 프로토타입 (1개)
  └── prototype.html (100KB, React + Tailwind CDN, 26 components)

Index (1개)
  └── README.md (13KB, 마스터 인덱스)

총 17개 파일 / 약 280KB
```

---

## §12. 7월 첫 실행 시 PRD 업데이트 체크리스트

7월 작업 시작할 때, PRD 4.1과 5.0/5.1을 보고 다음을 확인:

- [ ] Eval 첫 실행 결과를 PRD에 기록 (시나리오 A/B/C 중 어느 것?)
- [ ] 베타 리뷰어 섭외 결과 기록 (3명 목표 대비 몇 명?)
- [ ] Anthropic Spend Limit 실제 설정 ($30/day 적정?)
- [ ] Figma 작업 시점 결정 (8월 초? 중반?)
- [ ] EP-04 외 추가 에피소드 작성 시작 시점

**5월 시점에 결정 완료된 사항 (재논의 불필요, v5.1 §10 참조):**
- ✓ Tier 1 8편 → 5편 축소
- ✓ 출시 시점 12월 → 2027년 1월 말
- ✓ 변호사 검토 단계화 (베타 5명 면제, 사용자 100명 시점에)

---

## §13. 위험 신호 (HEALTH_CHECK_v2_0 §4 통합) — v5.1 의사결정 반영

5월 점검 결과 식별된 5건의 위험 신호 + 사용자 의사결정 결과. 자세한 분석은 `HEALTH_CHECK_v2_0.md` §4 참조.

| # | 위험 | 결정 | 반영 방식 |
|---|---|---|---|
| 1 | 11-12월 콘텐츠 작성 페이스 위기 | **사안 A: Tier 1 8→5편 축소 + 출시 1월 말 (조합)** | §10 일정 표 / EPISODE_PRODUCTION_GUIDE Tier 재정의 |
| 2 | 12월 출시 시점 시장 부적합 | **사안 B: 출시 1월 말로 변경** | §10 일정 표 |
| 3 | 변호사 비용 ROI 약함 | **사안 C: 베타 5명 면제, 사용자 100명 시점에** | §10 일정 표 / OPERATIONAL_SAFEGUARDS |
| 4 | 산출물 버전 표기 비통일 | README v2.x 통일 라벨 | README §변경 이력 |
| 5 | 9-12월 위기 시나리오 가이드 누락 | **CRISIS_PLAYBOOK.md 신규 작성** | 별도 문서 (16KB, 9개 시나리오) |

**모든 위험 신호 5건이 5월 시점에 결정·반영됨.** 7월 첫날 시작 시 추가 의사결정 부담 없음.

---

## §14. 점검 후 업데이트 (v5.0 → v5.1)

본 v5.0 작성 직후 점검 라운드에서 추가 발견된 항목:

### 차별점 재정의 — 더 좁히기

§2의 "한국 거주자 + 문화 통합" 차별점이 약화. 직접 경쟁자 **Meshclass** (일본 기업이 만든 한국인용 일본어 학습 앱) 발견.

**좁힌 차별점:**
- 변경 전: "한국 거주자 + 문화 통합"
- 변경 후: "**일본에 살고 있는** 한국인 + **JLPT에 안 나오는 생활 문화**"

Meshclass는 JLPT 시험 대비 중심이라 "어제 동네 할머니가 들고 온 회람판이 뭐죠?" 같은 일상 상황 대응은 **여전히 빈 자리**.

### Eval Pass Criteria 단계화

§7의 Type Accuracy ≥75%는 외부 벤치마크 대비 야심찬 목표 (GPT-5도 70% 수준). 단계 목표로 재정의:

```yaml
Pass Criteria (v1.1):
  v1 첫 실행:
    binary_accuracy:        ≥ 85%
    type_accuracy:          ≥ 70%   # 외부 벤치마크 부합
    false_positive_rate:    ≤ 15%
    false_negative_rate:    ≤ 25%
  v2 개선 후 (Few-shot 보강):
    type_accuracy:          ≥ 75%   # 목표
```

자세한 가이드는 `EVAL_README.md` 참조.

---

## 변경 이력

- **v5.1 (2026-05-10)**: 점검 후 1차 패치
  - §13 위험 신호 5건 신규 섹션 (HEALTH_CHECK §4 통합)
  - §14 차별점 재정의 (Meshclass 명시) + Eval Pass Criteria 단계화
  - §12 체크리스트에 의사결정 항목 3건 추가
- v5.0 (2026-05-10): PRD 4.1 대비 14개 영역 변경 통합 정리. 5월 검토 + 디자인 P0/P1/P2 + 프로토타입 + EP-04 모범 사례 + Production Readiness 반영.
- v4.1 (2026-05-초): 원본 9000줄, 디자인 시스템 시트(Image 8) 포함 8장 UI + 데이터 모델 초안 + 콘텐츠 39개 + 프롬프트 풀세트.
