// 데이터 모델 전체 정의는 data-model/schemas.ts (Zod) 참조
// 이 파일은 컴포넌트/API에서 사용하는 핵심 타입만 재export

export type CardType = 'sentence' | 'calendar' | 'episode'
export type LearningStatus = 'learning' | 'mastered'
export type MasteryStage = 'learning' | 'mastered' | 'real-use' | 'conquered'
export type ChatRole = 'user' | 'ai-nichi' | 'grandma'
export type TranslationVersion = 'casual' | 'polite' | 'formal'
export type CorrectionType =
  | 'number_unit'
  | 'family_title'
  | 'keigo'
  | 'age'
  | 'humility'
  | 'emotion'
  | 'cultural_term'

export interface Card {
  id: string
  user_id: string
  card_type: CardType
  learning_status: LearningStatus
  has_real_use: boolean
  payload: SentencePayload | CalendarPayload | EpisodePayload
  created_at: string
  updated_at: string
}

export interface CorrectionItem {
  type: CorrectionType
  detected: string
  issue: string
  severity: 'high' | 'medium' | 'low'
}

export interface SentencePayload {
  korean_input: string
  step0_cultural: {
    needs_correction: boolean
    correction_items: CorrectionItem[]
  }
  step1_structure: Array<{ korean: string; japanese: string }>
  step2_versions: {
    casual: string
    polite: string
    formal: string
  }
  step3_grammar: Array<{
    point_name: string
    explanation: string
    examples: string[]
  }>
  step4_culture?: string
  step5_etymology?: {
    kanji: string
    reading?: string
    story: string
    mnemonic?: string
  }
  recommended_version: TranslationVersion
  has_mnemonic: boolean
}

export interface CalendarPayload {
  event_name_kr: string
  event_name_jp: string
  event_date: string
  event_emoji?: string
  layer1_history: string
  layer2_current: string
  layer3_korea_compare: string
  layer4_expressions: Array<{
    context: string
    expression: string
    meaning_kr?: string
  }>
}

export interface EpisodePayload {
  episode_id: string
  title_kr: string
  title_jp?: string
  dialogue: Array<{
    speaker: 'grandma' | 'user' | 'narrator'
    japanese: string
    korean: string
  }>
}

export interface ApiUsage {
  user_id: string
  date: string
  count: number
}

// 마스터리 단계 계산
export function getMasteryStage(
  learning_status: LearningStatus,
  has_real_use: boolean
): MasteryStage {
  if (learning_status === 'mastered' && has_real_use) return 'conquered'
  if (learning_status === 'learning' && has_real_use) return 'real-use'
  if (learning_status === 'mastered') return 'mastered'
  return 'learning'
}
