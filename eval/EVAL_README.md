# Cultural Correction Eval — 실행 가이드

My Niche 앱의 문화 교정 자동 감지 정확도를 측정하는 Eval 시스템.

## 파일 구성

```
golden_dataset.yaml             # 90개 골든 데이터셋 (검증 정답지)
cultural_correction_prompt.yaml # 시스템 프롬프트 v1 + Tool 스키마
eval_runner.py                  # Eval 실행 스크립트
README.md                       # 본 문서
```

## 빠른 시작

### 1. 환경 준비

```bash
pip install anthropic pyyaml
export ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Dry-run으로 스크립트 동작 검증 (API 호출 없음)

```bash
python eval_runner.py \
  --dataset golden_dataset.yaml \
  --prompt cultural_correction_prompt.yaml \
  --dry-run
```

정답을 그대로 반환하는 시뮬레이션이라 항상 100% 통과합니다. 스크립트 자체가 잘 동작하는지만 확인하는 용도.

### 3. 실제 Eval 실행

```bash
# 처음 10개만 빠르게 테스트
python eval_runner.py \
  --dataset golden_dataset.yaml \
  --prompt cultural_correction_prompt.yaml \
  --limit 10 \
  --verbose

# 전체 90개 + JSON 결과 저장 (기본: v1 기준 = type ≥70%)
python eval_runner.py \
  --dataset golden_dataset.yaml \
  --prompt cultural_correction_prompt.yaml \
  --output results_v1.json

# v2 프롬프트 개선 후 더 엄격한 기준으로 재실행 (type ≥75%)
python eval_runner.py \
  --dataset golden_dataset.yaml \
  --prompt cultural_correction_prompt_v2.yaml \
  --criteria v2 \
  --output results_v2.json
```

## Pass Criteria

네 가지 기준을 **모두** 충족해야 다음 단계(Supabase 스키마 → 본격 코딩)로 진행할 수 있습니다.

### v1.2 (2026-05-10 점검 후) — 단계 목표

**v1 첫 실행 (Realistic):**

| 지표 | v1 기준 | 의미 |
|---|---|---|
| Binary accuracy | ≥ 85% | needs_correction(true/false) 일치율 |
| Type accuracy | ≥ **70%** | positive 케이스에서 correction_type 일치율 |
| False positive rate | ≤ 15% | negative 케이스를 positive로 오판정한 비율 |
| False negative rate | ≤ 25% | positive 케이스를 negative로 놓친 비율 |

**v2 개선 후 (Aspirational):**

| 지표 | v2 기준 | 의미 |
|---|---|---|
| Binary accuracy | ≥ 85% | (그대로) |
| Type accuracy | ≥ **75%** | Few-shot 보강 + 약점 유형 정의 강화 후 도달 목표 |
| False positive rate | ≤ 15% | (그대로) |
| False negative rate | ≤ 25% | (그대로) |

**Type Accuracy를 단계화한 이유 (HEALTH_CHECK_v2_0 §3.1):**

외부 벤치마크 [Cultural Nuance Benchmark (Appen 2025)](https://arxiv.org/pdf/2602.04729)에서:
- 7개 다국어 LLM 평균: **1.68/3 ≈ 56%**
- 최상위 GPT-5: **2.10/3 ≈ 70%**
- Claude Sonnet 3.7: **1.97/3 ≈ 66%**

Haiku 4.5는 더 작은 모델이므로 첫 실행에서 75%는 야심찬 목표. **70%를 v1 기준으로** 잡고, Few-shot 보강 + 약점 유형 정의 강화 후 75% 도달을 v2 목표로 두는 게 현실적.

**False negative criteria가 v1.1에서 추가된 이유:** 데이터셋 분포가 처음 약속한 50:30이 아닌 42:48로 작성됨. negative가 더 많아진 만큼 positive에서의 누락(=교정 기회를 놓침)이 더 치명적. 사용자 가치 직접 영향이라 별도 criteria로 명시.

스크립트는 종료 코드로 통과 여부를 반환합니다 (CI 통합 가능).
- 통과: `exit 0`
- 미통과: `exit 1`

## 기준 미달 시 개선 흐름

### Step A. 실패 케이스 분석
스크립트 출력의 `[실패 케이스]` 섹션을 보고 패턴을 찾습니다.
- 특정 유형에 몰려 있는가? (예: 감정표현만 정확도 60%)
- false positive vs false negative 어느 쪽이 많은가?
- N5 vs N3 차이가 있는가?

### Step B. 프롬프트 개선
주로 다음 3가지 방법:

**1. Few-shot 예시 추가** (가장 효과 큼)
`cultural_correction_prompt.yaml` 파일 끝에 명시된 6개 예시를
시스템 프롬프트 본문에 직접 임베드합니다.

**2. 유형 정의 정교화**
`## 교정 유형 7가지` 섹션에서 자주 틀리는 유형의 설명·예시를 보강합니다.

**3. 모델 변경**
Haiku로 정확도가 안 나오면 Sonnet으로 올립니다 (비용 트레이드오프).
`eval_runner.py` 상단의 `MODEL` 변수를 수정.

### Step C. 재실행 후 비교
v1, v2, v3 결과를 `--output` 옵션으로 각각 저장해서 변화를 추적합니다.

## 데이터셋 분포 참고

| 차원 | 분포 |
|---|---|
| 총 케이스 | 90 |
| Positive : Negative | 42 : 48 |
| Category | 일상 23 / 육아 22 / 직장 21 / 소셜 14 / 관공서 10 |
| Level | N3 50 / N5 40 |
| Edge case | 10 (정답 모호) |
| 교정 유형 | 가족호칭 8 / 경어 7 / 감정표현 7 / 수치 6 / 문화어휘 6 / 겸양 4 / 나이 4 |

## 비용 추정

Claude Haiku 4.5 기준 (2026년 5월, $1/$5 per MTok):

```
호출당 토큰: input ~1,000 / output ~150
호출당 비용: $0.00175
90 케이스 1회 실행: 약 $0.16

캐싱 적용 시 (시스템+tool 정의 캐시): 약 $0.08 (49% 절감)
```

캐싱 절감률이 90%가 아닌 49%인 이유: **input 토큰의 95%가 캐시되지만, output 토큰(캐싱 영향 없음)이 전체 비용의 약 절반을 차지**하기 때문. Anthropic 공식 "최대 90% 절감"은 input 단독 기준이며, 본 워크로드의 실제 절감 효과는 약 절반.

**Sonnet 4.6 fallback 시 비용** (Haiku로 정확도 미달일 때):
- 호출당 비용: $0.00525 (Haiku의 3배)
- 90 케이스 1회 실행: 약 $0.47
- 여전히 1달러 미만이라 충분히 감당 가능. 정확도가 더 중요하면 Sonnet 권장.

## 다음 단계

Eval 통과 시:
1. Supabase 카드 데이터 모델 ER 다이어그램 설계
2. Antigravity 프로젝트 셋업 (React + Tailwind)
3. 채팅 + My Deck 핵심 기능 구현 시작

Eval 미통과 시:
- 위 "기준 미달 시 개선 흐름" 따라 v2 프롬프트 작성
- 재실행 후 통과할 때까지 반복

## 변경 이력

- v1.1 (2026-05-10): 신규 케이스 10개 추가, 문화어휘 유형 신설 (총 90개)
- v1.0 (2026-05-10): 초기 80개 데이터셋 + 프롬프트 v1 + Eval 스크립트 작성
