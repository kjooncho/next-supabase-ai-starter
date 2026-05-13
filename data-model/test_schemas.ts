/**
 * Schema validation tests
 *
 * 실제 카드 데이터 샘플로 Zod 스키마가 잘 작동하는지 런타임 검증.
 * Run: npx ts-node test_schemas.ts
 */

import {
  CardSchema,
  SentencePayloadSchema,
  CalendarPayloadSchema,
  EpisodePayloadSchema,
  RealUseLogInsertSchema,
  type Card,
} from './schemas';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${(e as Error).message}`);
    failed++;
  }
}

console.log('=== Sentence Card Payload ===\n');

test('valid sentence payload (Image 3 시나리오)', () => {
  const valid = {
    korean_input: '저희 아이는 22개월이 되었어요',
    step0_cultural: {
      needs_correction: true,
      detected: '22개월',
      corrected_to: '1歳10ヶ月',
      correction_type: 'number_unit',
      reason: '일본은 24개월 미만은 ○歳○ヶ月 형식이 자연스럽다',
    },
    step1_structure: [
      { korean: '저희 아이는', japanese: 'うちの子は', marker_color: 'navy' },
      { korean: '큰 편이에요', japanese: '大きめです', marker_color: 'orange' },
    ],
    step2_versions: {
      casual: 'うちの子、この前1歳10ヶ月になったんですけど',
      polite: 'うちの子は先日1歳10ヶ月になりました',
      formal: 'うどもは先日1歳10ヶ月を迎えました',
    },
    step3_grammar: [
      {
        point_name: '~大きめ vs 大きいほう',
        explanation: '「大きめ」는 부드럽고 겸손한 표현',
        examples: ['大きめですね', '大きいほうですね'],
      },
    ],
    step4_culture: '일본 부모들은 자녀 자랑을 직접 하지 않는 경향',
    recommended_version: 'casual',
    has_mnemonic: false,
  };
  SentencePayloadSchema.parse(valid);
});

test('rejects sentence payload missing required field', () => {
  const invalid = {
    korean_input: '테스트',
    // step0_cultural 누락
    step2_versions: { casual: 'a', polite: 'b', formal: 'c' },
  };
  const result = SentencePayloadSchema.safeParse(invalid);
  if (result.success) throw new Error('Should have failed but passed');
});

test('rejects invalid correction_type enum', () => {
  const invalid = {
    korean_input: '테스트',
    step0_cultural: {
      needs_correction: true,
      correction_type: 'invalid_type', // 7개 enum에 없음
    },
    step2_versions: { casual: 'a', polite: 'b', formal: 'c' },
  };
  const result = SentencePayloadSchema.safeParse(invalid);
  if (result.success) throw new Error('Should have rejected invalid enum');
});

console.log('\n=== Calendar Card Payload ===\n');

test('valid calendar payload (こどもの日)', () => {
  const valid = {
    event_name_kr: '어린이날',
    event_name_jp: 'こどもの日',
    event_date: '2026-05-05',
    event_emoji: '🎏',
    layer1_history: '중국 단오에서 유래, 무가 사회 남아 축원',
    layer2_current: '5월 인형, 鯉のぼり 장식',
    layer3_korea_compare: '한국 어린이날과 같은 날짜이지만 의미가 다름',
    layer4_expressions: [
      { context: '직장 동료에게', expression: 'お子さんは元気ですか?' },
      { context: '이웃 어른에게', expression: 'もう鯉のぼり出されました?' },
    ],
  };
  CalendarPayloadSchema.parse(valid);
});

test('rejects calendar with invalid date format', () => {
  const invalid = {
    event_name_kr: '테스트',
    event_name_jp: 'テスト',
    event_date: '2026/05/05', // / 구분자 사용 - 거부되어야 함
    layer1_history: 'a',
    layer2_current: 'b',
    layer3_korea_compare: 'c',
    layer4_expressions: [{ context: 'test', expression: 'test' }],
  };
  const result = CalendarPayloadSchema.safeParse(invalid);
  if (result.success) throw new Error('Should have rejected non-ISO date');
});

console.log('\n=== Episode Card Payload ===\n');

test('valid episode payload (回覧板 Image 6 시나리오)', () => {
  const valid = {
    domain: '지역공동체',
    episode_number: 2,
    scene: '동네 할머니가 回覧板을 들고 현관 앞에 나타났다',
    background:
      '回覧板은 에도 시대 마을 공지 방식에서 유래. 지금도 町内会를 통해 운영',
    dialogues: [
      {
        speaker: 'grandma',
        japanese: 'あのね、回覧板っていうのはね、昔からずっと続いてる習慣でね...',
        korean: '있잖아, 回覧板이라는 건, 옛날부터 계속 이어진 풍습이야',
      },
    ],
    deeper_context: '町内会(주민자치회)와 결합된 공동체 시스템',
    vocabulary: [
      { jp: '回覧板', reading: 'かいらんばん', kr: '회람판' },
      { jp: '町内会', reading: 'ちょうないかい', kr: '주민자치회' },
    ],
  };
  EpisodePayloadSchema.parse(valid);
});

test('rejects episode with invalid domain', () => {
  const invalid = {
    domain: '음식',  // 7개 영역 enum에 없음 (음식계절이 정답)
    episode_number: 1,
    scene: 'test',
    background: 'test',
    dialogues: [{ speaker: 'grandma', japanese: 'test', korean: 'test' }],
  };
  const result = EpisodePayloadSchema.safeParse(invalid);
  if (result.success) throw new Error('Should have rejected invalid domain');
});

console.log('\n=== Card Row Schema (discriminated payload) ===\n');

test('valid card row with sentence payload', () => {
  const card = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    card_type: 'sentence',
    learning_status: 'learning',
    has_real_use: false,
    real_use_count: 0,
    payload: {
      korean_input: 'test',
      step0_cultural: { needs_correction: false },
      step1_structure: [],
      step2_versions: { casual: 'a', polite: 'b', formal: 'c' },
      step3_grammar: [],
      recommended_version: 'casual',
      has_mnemonic: false,
    },
    source_input: 'test',
    created_at: '2026-05-10T12:00:00Z',
    last_reviewed_at: null,
    mastered_at: null,
  };
  CardSchema.parse(card);
});

test('rejects card with mismatched payload type', () => {
  const card = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    card_type: 'calendar',  // calendar로 설정했는데...
    learning_status: 'learning',
    has_real_use: false,
    real_use_count: 0,
    payload: {  // sentence 구조 — 거부되어야 함
      korean_input: 'test',
      step0_cultural: { needs_correction: false },
      step2_versions: { casual: 'a', polite: 'b', formal: 'c' },
    },
    source_input: null,
    created_at: '2026-05-10T12:00:00Z',
    last_reviewed_at: null,
    mastered_at: null,
  };
  const result = CardSchema.safeParse(card);
  if (result.success)
    throw new Error('Should reject card_type/payload mismatch');
});

console.log('\n=== Real Use Log Insert ===\n');

test('valid real use log (Image 5 시나리오)', () => {
  const log = {
    card_id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    used_on: '2026-05-10',
    situations: ['육아'] as const,
    self_rating: 'awkward',
    memo: '보육원 선생님한테 썼는데 약간 어색했어요',
  };
  RealUseLogInsertSchema.parse(log);
});

test('rejects log with invalid self_rating', () => {
  const log = {
    card_id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    situations: [],
    self_rating: 'good',  // enum에 없음
  };
  const result = RealUseLogInsertSchema.safeParse(log);
  if (result.success) throw new Error('Should reject invalid self_rating');
});

test('rejects memo over 100 chars', () => {
  const log = {
    card_id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    situations: [],
    self_rating: 'natural' as const,
    memo: 'a'.repeat(101),
  };
  const result = RealUseLogInsertSchema.safeParse(log);
  if (result.success) throw new Error('Should reject memo > 100 chars');
});

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
