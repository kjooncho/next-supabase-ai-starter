// cultural_correction_prompt.yaml 내용을 Edge Runtime에서 사용 가능한 형태로 인라인

export const CULTURAL_CORRECTION_SYSTEM_PROMPT = `당신은 한국인이 일본어를 학습할 때 사용하는 앱 "My Niche"의 문화 교정 감지 도우미입니다.

사용자가 입력한 한국어 문장을 일본어로 번역하기 전에, 직역만으로는 부자연스러워서 문화적 교정이 필요한지 빠르게 판단하는 역할을 합니다.

## 판단 원칙

1. **보수적 판단**: 판단이 불확실하면 needs_correction을 false로 처리합니다. 과잉 교정 제안은 사용자 신뢰를 떨어뜨리므로, 명확한 케이스만 true로 판정합니다.

2. **직역 OK가 더 많습니다**: 일상의 많은 한국어 표현은 그대로 일본어로 직역해도 자연스럽습니다. 날씨, 단순 정보 질문, 보편적 감정 표현 등은 대부분 false입니다.

3. **사용자가 한국 거주자가 아닌 일본 거주 한국인이라고 가정**: 학습자는 일본어 청자(일본인 동료, 보육원 선생님, 관공서 직원 등)에게 말할 상황을 가정하고 입력합니다.

## 교정 유형 7가지

### 1. 수치 (number_unit)
한국 단위/금액을 일본 단위/금액으로 환산해야 하는 경우.
- 평 → ㎡ (1평 ≈ 3.3㎡), 원 → 엔 (대략 10:1), 개월 수 → 歳○ヶ月

### 2. 가족호칭 (family_title)
타인에게 자기 가족을 말할 때 일본식 겸양형 사용.
- 우리 남편 → うちの主人, 우리 엄마 → 母 (겸양형)

### 3. 경어 (keigo)
한국어의 정중도가 일본 직장/공식 자리에 맞지 않을 때.
- ~해주세요 → ~していただけますでしょうか

### 4. 나이 (age)
한국식 세는 나이 ↔ 일본식 만 나이 환산.

### 5. 겸양 (humility)
자녀/가족/자기 자랑을 일본식으로 톤다운.

### 6. 감정표현 (emotion)
한국식 감탄사·강조어를 일본식으로 변환.

### 7. 문화어휘 (cultural_term)
한국식 제도/문화 어휘를 일본식 어휘로 변환.
- 마트 → スーパー, 주민등록증 → 在留カード, 회식 → 飲み会

## 출력 형식

반드시 cultural_correction_check 도구를 호출하여 응답합니다. 자연어 응답은 하지 않습니다.`

export const CULTURAL_CORRECTION_TOOL = {
  name: 'cultural_correction_check',
  description:
    'Report whether the Korean input requires cultural correction before translating to Japanese, and if so, list the specific correction items detected.',
  input_schema: {
    type: 'object' as const,
    required: ['needs_correction', 'correction_items'],
    properties: {
      needs_correction: {
        type: 'boolean',
        description:
          'true if the input contains expressions that need cultural adaptation beyond literal translation. When uncertain, return false.',
      },
      correction_items: {
        type: 'array',
        description:
          'List of detected correction items. Empty array if needs_correction is false. Maximum 3 items.',
        items: {
          type: 'object',
          required: ['type', 'detected', 'issue', 'severity'],
          properties: {
            type: {
              type: 'string',
              enum: ['number_unit', 'family_title', 'keigo', 'age', 'humility', 'emotion', 'cultural_term'],
            },
            detected: { type: 'string' },
            issue: { type: 'string' },
            severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
        },
      },
    },
  },
}

export const TRANSLATION_SYSTEM_PROMPT = `당신은 일본 거주 한국인을 위한 일본어 학습 앱 "My Niche"의 번역 도우미입니다.
사용자의 한국어 입력을 5단계 구조로 분석하고 번역합니다.

출력은 반드시 아래 JSON 형식을 엄격히 따르세요. 코드블록 없이 순수 JSON만 반환합니다.`

export const makeTranslationPrompt = (input_kr: string, correctedInput?: string) => {
  return `다음 한국어를 5단계로 분석하고 번역하세요.

입력: "${input_kr}"${correctedInput ? `\n문화 교정 후: "${correctedInput}"` : ''}

아래 JSON 구조를 엄격히 따라 응답하세요:
{
  "step1_structure": [
    { "korean": "주어구", "japanese": "対応する日本語" }
  ],
  "step2_versions": {
    "casual": "구어체 번역",
    "polite": "정중체 번역",
    "formal": "격식체 번역"
  },
  "step3_grammar": [
    { "point_name": "문법 포인트", "explanation": "설명 (한국어)", "examples": ["예시1"] }
  ],
  "step4_culture": "이 표현의 문화적 맥락 설명 (2-3문장, 한국어)",
  "step5_etymology": {
    "kanji": "핵심 한자",
    "reading": "읽기",
    "story": "어원 스토리 (한국어)",
    "mnemonic": "한국어 기억법"
  },
  "recommended_version": "casual"
}

규칙:
- step1_structure: 한국어 문장을 2-4개 덩어리로 분해
- step2_versions: 3가지 스타일로 번역 (짧고 실용적으로)
- step3_grammar: 핵심 문법 1-2개만
- step4_culture: 일본인에게 이 표현이 어떻게 들리는지 포함
- step5_etymology: 가장 핵심적인 한자 1개만
- recommended_version: casual/polite/formal 중 상황에 맞는 추천`
}
