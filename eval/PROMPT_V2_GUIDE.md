# Eval 미달 시 프롬프트 v2 개선 가이드

7월 첫 Eval에서 Pass criteria 미달 시 사용. **시나리오 B (현실, 약 55%)** 에 해당하는 경우의 표준 개선 워크플로우.

## 사용 방법

1. eval_runner.py로 v1 결과 받기 (이상적으로 `--output v1_results.json` 으로 저장)
2. 본 가이드의 분석 단계로 약점 식별
3. 본 가이드의 v2 패턴으로 프롬프트 개선
4. v2 재실행 → 비교

## Step 1. 결과 분석

`v1_results.json`을 열어서 다음 4가지를 확인:

### 1. 어느 유형이 약한가?

```bash
# 결과 JSON에서 유형별 정확도 추출
python3 -c "
import json
with open('v1_results.json') as f:
    data = json.load(f)
by_type = data['report']['by_type']
sorted_types = sorted(by_type.items(), key=lambda x: x[1]['accuracy'])
for t, v in sorted_types:
    print(f'{t}: {v[\"accuracy\"]:.0%} ({v[\"correct\"]}/{v[\"total\"]})')
"
```

**행동 방침:**
- 75% 이상: 그대로 유지
- 60-75%: 시스템 프롬프트의 해당 유형 정의를 강화
- 60% 미만: 시스템 프롬프트 강화 + few-shot 예시 추가

### 2. False Positive vs False Negative 어느 쪽?

| 유형 | 의미 | 대응 |
|---|---|---|
| FP > 15% | 과잉 교정 (직역 OK인 걸 교정 필요라고 판단) | "보수적으로" 강조 강화 + Negative 예시 few-shot |
| FN > 25% | 누락 (교정 필요한 걸 못 잡음) | 약한 유형의 Positive 예시 few-shot |
| 둘 다 높음 | 모델이 confused 상태 | Sonnet으로 모델 변경 검토 |

### 3. Edge Case 정확도

데이터셋의 마지막 10개(GD-081 ~ GD-090)는 의도적으로 모호한 케이스. 이게 50% 미만이면 정상 (애초에 어려움). 80%+이면 데이터셋이 의심됨 (정답이 자명하지 않은가?).

### 4. 비용 / 속도

- 평균 latency 2초 초과: 모델/네트워크 문제 또는 Anthropic 서버 부하
- 호출당 비용 $0.003 초과: input/output 토큰이 예상보다 많음, 시스템 프롬프트 길이 검토

## Step 2. v2 개선 패턴 (효과 큰 순)

### 패턴 1. Few-shot 예시 추가 (가장 효과 큼, 권장)

`cultural_correction_prompt.yaml`의 system_prompt 끝에 다음 형식으로 추가:

```yaml
system_prompt: |
  ... (기존 내용 유지) ...

  ## 판단 예시

  다음 예시들을 참고하여 일관된 판단을 하세요.

  ### Positive 예시 (교정 필요)

  입력: "저희 아이는 22개월이 되었어요"
  → needs_correction: true, type: number_unit
  → 이유: 22개월은 일본에서 "1歳10ヶ月" 형식이 자연스러움

  입력: "이 디자인 수정해주세요" (직장 컨텍스트)
  → needs_correction: true, type: keigo
  → 이유: 직장에서는 "修正していただけますでしょうか" 가 적절

  입력: "선물 가져왔어요 별 거 아니에요"
  → needs_correction: true, type: humility
  → 이유: 일본은 "つまらないものですが" 같은 정형 표현 사용

  ### Negative 예시 (직역 OK)

  입력: "오늘 날씨 어떤가요?"
  → needs_correction: false
  → 이유: 일상 질문은 직역해도 자연스러움

  입력: "이 책 정말 재미있어요"
  → needs_correction: false
  → 이유: 보편적 감상 표현은 직역 가능

  입력: "회의는 3시에 시작해요"
  → needs_correction: false
  → 이유: 단순 정보 전달은 직역 OK

  이 예시들을 일관되게 적용하세요.
```

**선택 기준:**
- 약한 유형의 Positive 3개 + 강한 유형의 Negative 3개 균형
- 데이터셋의 명확한 케이스(GD-001, GD-022 같은 초반 ID) 활용
- 데이터셋 자체에 있는 케이스는 데이터 누설 위험 — **유사하지만 다른 케이스** 사용

### 패턴 2. 약한 유형 정의 강화

시뮬레이션 결과 감정표현이 가장 약했다고 가정. 시스템 프롬프트의 해당 섹션을 다음처럼 강화:

```yaml
# Before (v1)
### 6. 감정표현 (emotion)
한국식 감탄사·강조어를 일본식으로 변환.
- 대박 → すごい / やばい / 最高
...

# After (v2)
### 6. 감정표현 (emotion)
한국식 감탄사·강조어를 일본식으로 변환.

판단 기준 (이 순서로 적용):
1. 한국식 강조어가 명백히 포함된 경우만 true
   ("진짜", "완전", "대박", "헐", "어머", "아이고" 등)
2. 일반적 감탄("정말", "와", "신기해")은 false
3. 감정 강도가 일본 컨텍스트에 맞지 않으면 true
   (직장에서 "대박" → 부적절, 친구에게 "대박" → OK이지만 더 자연스러운 표현 있음)

변환 매핑:
- 대박 → すごい (일반) / やばい (친한 사이) / 最高 (긍정 강조)
- 어머 → わぁ / あら / まあ
- 아이고 → わっ (놀람) / やれやれ (탄식) / あらら (걱정)
- 진짜 빡빡하다 → 結構タイト / きつい

주의: "와 진짜 대박이에요"에서 핵심은 "대박"이 아니라
**"와 + 진짜 + 대박"의 3중 강조 구조**. 일본은 보통
"わぁ、すごくいいですね" 정도로 톤을 낮춤.
```

### 패턴 3. Severity 기준 명확화

False positive가 높을 때 효과적. severity 판단 기준을 추가:

```yaml
## Severity 판단 기준 (추가됨)

high — 직역하면 일본인이 의미를 못 알아듣거나 큰 오해
  예: "30평 아파트" (평 단위), "비자 갱신해야 해" (在留資格 미변환)
  
medium — 직역해도 통하지만 어색하거나 매너 위반
  예: "우리 엄마" → 직역 가능하지만 "母" 가 적절
  
low — 직역해도 OK이나 더 자연스러운 표현 존재
  예: "맛있어요" → 직역 OK, "美味しいですね" 도 OK

low 케이스는 needs_correction을 false로 처리해도 됩니다.
보수적으로 판단하세요 — 의심스러우면 false.
```

### 패턴 4. 모델 변경 (Haiku → Sonnet)

위 3가지로 Pass criteria 충족 어려우면 Sonnet 4.6으로 변경.

**비용 변화:**
- Haiku: $0.16/90 cases → Sonnet: $0.47/90 cases (3배)
- 본격 운영 시 사용자 1만 명 × 일 5회 호출이면: Haiku $30/월, Sonnet $90/월

**변경 방법:**
```python
# eval_runner.py 상단 수정
MODEL = "claude-sonnet-4-6-20250929"  # claude-haiku-4-5에서 변경
```

**의사결정 기준:**
- Haiku로 80%+ 이고, 비용 우선 → Haiku 유지 + 패턴 1-3
- Haiku로 75% 미만 → Sonnet 즉시 변경
- 정확도가 사용자 가치에 직접 영향 → Sonnet 검토

## Step 3. v2 재실행

```bash
# v2 프롬프트로 재실행 (결과 별도 저장)
python eval_runner.py \
  --dataset golden_dataset.yaml \
  --prompt cultural_correction_prompt_v2.yaml \
  --output v2_results.json

# v1 vs v2 비교
python3 -c "
import json
v1 = json.load(open('v1_results.json'))['report']['metrics']
v2 = json.load(open('v2_results.json'))['report']['metrics']
print('지표              v1      v2     변화')
for k in v1:
    d = v2[k] - v1[k]
    sign = '↑' if d > 0 else ('↓' if d < 0 else '=')
    print(f'{k:18s} {v1[k]:.1%}  {v2[k]:.1%}  {sign}{abs(d):.1%}')
"
```

기대 출력:
```
지표                  v1      v2     변화
binary_accuracy       82.2%   88.9%  ↑6.7%
type_accuracy         71.4%   79.0%  ↑7.6%
false_positive_rate   18.8%   13.3%  ↓5.5%
false_negative_rate   21.4%   16.7%  ↓4.7%
```

v2에서 통과하지 못하면 v3 (다른 패턴 조합) 또는 Sonnet.

## Step 4. 최종 통과 후

- v2 프롬프트를 정본으로 채택
- v1 프롬프트는 보존 (`cultural_correction_prompt_v1.yaml.bak`)
- 결과 JSON도 보존 (회귀 테스트용)
- 본격 코딩 진입 — Phase 2 (데이터 모델 적용)

매월 1회 회귀 테스트 권장:
```bash
# crontab 또는 GitHub Actions
# 매월 1일 자동 실행
python eval_runner.py \
  --dataset golden_dataset.yaml \
  --prompt cultural_correction_prompt.yaml \
  --output monthly_$(date +%Y%m).json
```

이렇게 시간이 지나면서 정확도가 떨어지는지(모델 업데이트, 데이터셋 추가 등) 추적 가능.

## 변경 이력

- v1.0 (2026-05-10): Eval 미달 시 v2 개선 표준 워크플로우 작성
