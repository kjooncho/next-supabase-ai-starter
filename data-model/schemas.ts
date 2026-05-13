/**
 * My Niche (毎日) — Database Types & Schemas v1.0
 * ====================================================================
 *
 * Created: 2026-05-10
 * Maintained alongside: migration_v1_0.sql
 *
 * 이 파일은 두 가지 역할을 합니다:
 * 1. TypeScript 타입 (compile-time): DB row shape를 React/Antigravity 코드에서 사용
 * 2. Zod 스키마 (runtime): JSONB payload 검증, API 입력 검증
 *
 * 사용 예시:
 *   import { CardSchema, type Card } from './schemas';
 *
 *   // DB에서 가져온 row 검증
 *   const card = CardSchema.parse(rowFromSupabase);
 *
 *   // 타입만 사용
 *   function renderCard(card: Card) { ... }
 *
 * Dependencies: zod ^3.22.0
 * ====================================================================
 */

import { z } from 'zod';

// =====================================================================
// 1. ENUMS — DB CHECK 제약과 1:1 매칭
// =====================================================================

export const LevelEnum = z.enum(['beginner', 'N5', 'N4', 'N3', 'N2', 'N1']);
export type Level = z.infer<typeof LevelEnum>;

export const LifeSituationEnum = z.enum(['직장', '육아', '일상', '소셜', '관공서']);
export type LifeSituation = z.infer<typeof LifeSituationEnum>;

export const CardTypeEnum = z.enum(['sentence', 'calendar', 'episode']);
export type CardType = z.infer<typeof CardTypeEnum>;

export const LearningStatusEnum = z.enum(['learning', 'mastered']);
export type LearningStatus = z.infer<typeof LearningStatusEnum>;

export const TagTypeEnum = z.enum(['category', 'grammar', 'special', 'place']);
export type TagType = z.infer<typeof TagTypeEnum>;

export const ColorTokenEnum = z.enum([
  'navy',
  'orange',
  'green',
  'purple',
  'amber',
  'red',
  'blue',
  'gray',
]);
export type ColorToken = z.infer<typeof ColorTokenEnum>;

export const SelfRatingEnum = z.enum(['natural', 'awkward', 'unsure']);
export type SelfRating = z.infer<typeof SelfRatingEnum>;

export const TeacherOutcomeEnum = z.enum(['mastered', 'needs_review']);
export type TeacherOutcome = z.infer<typeof TeacherOutcomeEnum>;

// 문화 교정 유형 (Eval 데이터셋과 일치)
export const CorrectionTypeEnum = z.enum([
  'number_unit',
  'family_title',
  'keigo',
  'age',
  'humility',
  'emotion',
  'cultural_term',
]);
export type CorrectionType = z.infer<typeof CorrectionTypeEnum>;

// =====================================================================
// 2. PAYLOAD SCHEMAS — 카드 종류별 JSONB 구조
// =====================================================================

// ---------------------------------------------------------------------
// 2.1 Sentence Card Payload (My Sentence — 딥 번역 5단계)
// ---------------------------------------------------------------------

const Step0CulturalSchema = z.object({
  needs_correction: z.boolean(),
  detected: z.string().optional(), // 한국어 원문 중 감지된 부분
  corrected_to: z.string().optional(), // 일본어 교정 결과
  correction_type: CorrectionTypeEnum.optional(),
  reason: z.string().optional(), // 한국어 설명
});

const Step1StructureItemSchema = z.object({
  korean: z.string(),
  japanese: z.string(),
  marker_color: z.enum(['navy', 'orange', 'green']).optional(), // 시각화용
});

const Step2VersionsSchema = z.object({
  casual: z.string(), // 추천 구어체
  polite: z.string(), // 정중체
  formal: z.string(), // 공식체
});

const Step3GrammarSchema = z.object({
  point_name: z.string(), // "~大きめ vs 大きいほう"
  explanation: z.string(),
  examples: z.array(z.string()).default([]),
});

const Step5EtymologySchema = z.object({
  kanji: z.string(),
  reading: z.string().optional(), // 후리가나
  story: z.string(), // 어원 스토리
  mnemonic: z.string().optional(), // 한국어 니모닉
});

export const SentencePayloadSchema = z.object({
  korean_input: z.string().min(1),
  step0_cultural: Step0CulturalSchema,
  step1_structure: z.array(Step1StructureItemSchema).default([]),
  step2_versions: Step2VersionsSchema,
  step3_grammar: z.array(Step3GrammarSchema).default([]),
  step4_culture: z.string().optional(), // 문화 맥락 설명
  step5_etymology: Step5EtymologySchema.optional(),
  recommended_version: z.enum(['casual', 'polite', 'formal']).default('casual'),
  has_mnemonic: z.boolean().default(false),
});
export type SentencePayload = z.infer<typeof SentencePayloadSchema>;

// ---------------------------------------------------------------------
// 2.2 Calendar Card Payload (일본 캘린더 — 4 레이어)
// ---------------------------------------------------------------------

const CalendarExpressionSchema = z.object({
  context: z.string(), // "직장 동료에게", "이웃/보육원 선생님에게", "SNS/메시지로"
  expression: z.string(), // 일본어 표현
  meaning_kr: z.string().optional(), // 한국어 의미
});

export const CalendarPayloadSchema = z.object({
  event_name_kr: z.string(),
  event_name_jp: z.string(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  event_emoji: z.string().optional(), // 🎎, 🎏 등
  layer1_history: z.string(), // 역사 이야기
  layer2_current: z.string(), // 현재 일본인의 행동
  layer3_korea_compare: z.string(), // 한국과 비교
  layer4_expressions: z.array(CalendarExpressionSchema).min(1).max(5),
});
export type CalendarPayload = z.infer<typeof CalendarPayloadSchema>;

// ---------------------------------------------------------------------
// 2.3 Episode Card Payload (隣のおばあちゃんトーク — 5단계)
// ---------------------------------------------------------------------

const EpisodeDialogueSchema = z.object({
  speaker: z.enum(['grandma', 'user', 'narrator']).default('grandma'),
  japanese: z.string(),
  korean: z.string(), // 한국어 번역
});

const EpisodeVocabularySchema = z.object({
  jp: z.string(),
  reading: z.string().optional(),
  kr: z.string(),
});

export const EpisodeDomainEnum = z.enum([
  '돈제도', // 영역 A
  '지역공동체', // 영역 B
  '음식계절', // 영역 C
  '목욕문화', // 영역 D
  '동요언어', // 영역 E
  '의례매너', // 영역 F
  '상업쇼핑', // 영역 G
]);
export type EpisodeDomain = z.infer<typeof EpisodeDomainEnum>;

export const EpisodePayloadSchema = z.object({
  domain: EpisodeDomainEnum,
  episode_number: z.number().int().positive(),
  scene: z.string(), // "동네 할머니가 回覧板을 들고 왔다"
  background: z.string(), // 제도/문화 배경 (2-3분 분량)
  dialogues: z.array(EpisodeDialogueSchema).min(1),
  deeper_context: z.string().optional(), // 역사적 유래, 지역 차이
  vocabulary: z.array(EpisodeVocabularySchema).default([]),
});
export type EpisodePayload = z.infer<typeof EpisodePayloadSchema>;

// ---------------------------------------------------------------------
// 2.4 Discriminated Union (card_type에 따라 payload 자동 검증)
// ---------------------------------------------------------------------

export const CardPayloadSchema = z.discriminatedUnion('card_type', [
  z.object({ card_type: z.literal('sentence'), payload: SentencePayloadSchema }),
  z.object({ card_type: z.literal('calendar'), payload: CalendarPayloadSchema }),
  z.object({ card_type: z.literal('episode'), payload: EpisodePayloadSchema }),
]);
export type CardPayload = z.infer<typeof CardPayloadSchema>;

// =====================================================================
// 3. TABLE ROW SCHEMAS — DB row와 1:1 매칭
// =====================================================================

// ---------------------------------------------------------------------
// 3.1 users
// ---------------------------------------------------------------------

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  level: LevelEnum,
  life_situations: z.array(LifeSituationEnum).min(1),
  created_at: z.string().datetime(),
  last_active_at: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

// ---------------------------------------------------------------------
// 3.2 cards
// ---------------------------------------------------------------------

export const CardSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    card_type: CardTypeEnum,
    learning_status: LearningStatusEnum,
    has_real_use: z.boolean(),
    real_use_count: z.number().int().min(0),
    payload: z.unknown(), // 아래 superRefine으로 검증
    source_input: z.string().nullable(),
    created_at: z.string().datetime(),
    last_reviewed_at: z.string().datetime().nullable(),
    mastered_at: z.string().datetime().nullable(),
  })
  // payload를 card_type에 맞게 검증
  .superRefine((card, ctx) => {
    let payloadResult;
    if (card.card_type === 'sentence') {
      payloadResult = SentencePayloadSchema.safeParse(card.payload);
    } else if (card.card_type === 'calendar') {
      payloadResult = CalendarPayloadSchema.safeParse(card.payload);
    } else {
      payloadResult = EpisodePayloadSchema.safeParse(card.payload);
    }

    if (!payloadResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: `Invalid payload for card_type '${card.card_type}': ${payloadResult.error.message}`,
      });
    }
  });

export type Card = z.infer<typeof CardSchema>;

// 카드 생성 시 입력 (id, 타임스탬프 등 자동 생성 필드 제외)
export const CardInsertSchema = z.object({
  user_id: z.string().uuid(),
  card_type: CardTypeEnum,
  learning_status: LearningStatusEnum.default('learning'),
  payload: z.unknown(), // 동일하게 superRefine 가능 (생략, 호출 측에서 검증)
  source_input: z.string().nullable().optional(),
});
export type CardInsert = z.infer<typeof CardInsertSchema>;

// ---------------------------------------------------------------------
// 3.3 tags
// ---------------------------------------------------------------------

export const TagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(30),
  tag_type: TagTypeEnum,
  color_token: ColorTokenEnum,
  icon_name: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type Tag = z.infer<typeof TagSchema>;

// ---------------------------------------------------------------------
// 3.4 card_tags
// ---------------------------------------------------------------------

export const CardTagSchema = z.object({
  card_id: z.string().uuid(),
  tag_id: z.string().uuid(),
  added_at: z.string().datetime(),
});
export type CardTag = z.infer<typeof CardTagSchema>;

// ---------------------------------------------------------------------
// 3.5 real_use_logs
// ---------------------------------------------------------------------

export const RealUseLogSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  user_id: z.string().uuid(),
  used_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  situations: z.array(LifeSituationEnum),
  self_rating: SelfRatingEnum,
  memo: z.string().max(100).nullable(),
  created_at: z.string().datetime(),
});
export type RealUseLog = z.infer<typeof RealUseLogSchema>;

export const RealUseLogInsertSchema = z.object({
  card_id: z.string().uuid(),
  user_id: z.string().uuid(),
  used_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // 기본값 today
  situations: z.array(LifeSituationEnum).default([]),
  self_rating: SelfRatingEnum,
  memo: z.string().max(100).nullable().optional(),
});
export type RealUseLogInsert = z.infer<typeof RealUseLogInsertSchema>;

// ---------------------------------------------------------------------
// 3.6 teacher_sessions
// ---------------------------------------------------------------------

export const TeacherSessionSchema = z.object({
  id: z.string().uuid(),
  card_id: z.string().uuid(),
  user_id: z.string().uuid(),
  outcome: TeacherOutcomeEnum,
  hint_count: z.number().int().min(0).max(3),
  mastery_score: z.number().int().min(0).max(100),
  completed_at: z.string().datetime(),
});
export type TeacherSession = z.infer<typeof TeacherSessionSchema>;

export const TeacherSessionInsertSchema = z.object({
  card_id: z.string().uuid(),
  user_id: z.string().uuid(),
  outcome: TeacherOutcomeEnum,
  hint_count: z.number().int().min(0).max(3).default(0),
  mastery_score: z.number().int().min(0).max(100),
});
export type TeacherSessionInsert = z.infer<typeof TeacherSessionInsertSchema>;

// =====================================================================
// 4. SUPABASE Database TYPE (CRUD 헬퍼)
// =====================================================================
// supabase-js의 Database 제네릭에 사용되는 타입.
// 실제로는 `supabase gen types typescript` 명령으로 자동 생성하지만,
// 초기 셋업 단계에서는 수동 정의로 시작.

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'last_active_at'> & {
          created_at?: string;
          last_active_at?: string;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      cards: {
        Row: Card;
        Insert: CardInsert & {
          id?: string;
          has_real_use?: boolean;
          real_use_count?: number;
          created_at?: string;
          last_reviewed_at?: string | null;
          mastered_at?: string | null;
        };
        Update: Partial<Omit<Card, 'id' | 'user_id'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Tag, 'id'>>;
      };
      card_tags: {
        Row: CardTag;
        Insert: Omit<CardTag, 'added_at'> & { added_at?: string };
        Update: never; // PK 변경 불가, 삭제만 허용
      };
      real_use_logs: {
        Row: RealUseLog;
        Insert: RealUseLogInsert & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<RealUseLog, 'id' | 'card_id' | 'user_id'>>;
      };
      teacher_sessions: {
        Row: TeacherSession;
        Insert: TeacherSessionInsert & {
          id?: string;
          completed_at?: string;
        };
        Update: never; // 세션 결과는 immutable
      };
    };
  };
};

// =====================================================================
// 5. UTILITY HELPERS
// =====================================================================

/**
 * 카드 타입에 따라 적절한 payload 스키마를 반환
 */
export function getPayloadSchemaFor(cardType: CardType) {
  switch (cardType) {
    case 'sentence':
      return SentencePayloadSchema;
    case 'calendar':
      return CalendarPayloadSchema;
    case 'episode':
      return EpisodePayloadSchema;
  }
}

/**
 * 카드 미리보기 텍스트 추출 (My Deck 카드 그리드용)
 * 카드 종류에 따라 다른 필드를 반환
 */
export function getCardPreview(card: Card): string {
  const payload = card.payload as any;
  switch (card.card_type) {
    case 'sentence':
      return payload.step2_versions?.casual ?? payload.korean_input ?? '';
    case 'calendar':
      return payload.event_name_jp ?? payload.event_name_kr ?? '';
    case 'episode':
      return payload.scene ?? '';
  }
}

/**
 * 카드의 학습 상태 라벨 (UI 표시용)
 */
export function getCardStatusLabel(card: Card): {
  label: string;
  color: ColorToken;
} {
  if (card.learning_status === 'mastered') {
    return { label: '숙달완료', color: 'amber' };
  }
  if (card.has_real_use) {
    return { label: '써봤어요', color: 'green' };
  }
  // payload.has_mnemonic은 sentence card에만 존재
  if (
    card.card_type === 'sentence' &&
    (card.payload as SentencePayload).has_mnemonic
  ) {
    return { label: '니모닉있음', color: 'purple' };
  }
  return { label: '학습중', color: 'navy' };
}

// =====================================================================
// END OF SCHEMAS v1.0
// =====================================================================
