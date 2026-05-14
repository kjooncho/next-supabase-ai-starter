export interface MapExpression {
  japanese: string
  reading: string
  pronunciation: string
  korean: string
}

export interface MapLocation {
  id: string
  name_jp: string
  name_kr: string
  emoji: string
  tag: string
  description_kr: string
  expressions: MapExpression[]
  card_count: number
  real_use_count: number
  episode_id?: string
  // position on map (% from top-left)
  top: number
  left: number
  color: string
}

export const MAP_LOCATIONS: MapLocation[] = [
  {
    id: 'supermarket',
    name_jp: 'スーパー',
    name_kr: '슈퍼마켓·쇼핑몰',
    emoji: '🛒',
    tag: '쇼핑',
    description_kr: '장을 볼 때 쓰는 일본어',
    card_count: 8,
    real_use_count: 5,
    expressions: [
      { japanese: 'いくらですか', reading: 'いくらですか', pronunciation: '이쿠라 데스카', korean: '얼마예요?' },
      { japanese: 'レジ袋はいりますか', reading: 'れじぶくろはいりますか', pronunciation: '레지부쿠로와 이리마스카', korean: '봉지 필요하세요?' },
      { japanese: 'ポイントカードはお持ちですか', reading: 'ぽいんとかーどはおもちですか', pronunciation: '포인토카-도와 오모치 데스카', korean: '포인트 카드 있으세요?' },
      { japanese: '試食できますか', reading: 'ししょくできますか', pronunciation: '시쇼쿠 데키마스카', korean: '시식할 수 있나요?' },
      { japanese: '賞味期限はいつですか', reading: 'しょうみきげんはいつですか', pronunciation: '쇼-미키겐와 이쓰 데스카', korean: '유통기한이 언제예요?' },
    ],
    top: 18,
    left: 10,
    color: '#e74c3c',
  },
  {
    id: 'nursery',
    name_jp: '保育園',
    name_kr: '육아·보육 표현',
    emoji: '🧒',
    tag: '육아',
    description_kr: '어린이집·유치원에서 쓰는 일본어',
    card_count: 6,
    real_use_count: 1,
    expressions: [
      { japanese: 'お迎えに来ました', reading: 'おむかえにきました', pronunciation: '오무카에니 키마시타', korean: '데리러 왔어요' },
      { japanese: '熱があります', reading: 'ねつがあります', pronunciation: '네쓰가 아리마스', korean: '열이 있어요' },
      { japanese: '今日はお休みします', reading: 'きょうはおやすみします', pronunciation: '쿄-와 오야스미시마스', korean: '오늘은 쉬겠습니다' },
      { japanese: '連絡帳に書きました', reading: 'れんらくちょうにかきました', pronunciation: '렌라쿠쵸-니 카키마시타', korean: '연락장에 썼어요' },
      { japanese: 'アレルギーがあります', reading: 'あれるぎーがあります', pronunciation: '아레루기-가 아리마스', korean: '알레르기가 있어요' },
    ],
    top: 14,
    left: 72,
    color: '#9b59b6',
  },
  {
    id: 'hospital',
    name_jp: '病院',
    name_kr: '진료·증상 표현',
    emoji: '🏥',
    tag: '의료',
    description_kr: '병원·약국에서 쓰는 일본어',
    card_count: 10,
    real_use_count: 2,
    expressions: [
      { japanese: 'お腹が痛いです', reading: 'おなかがいたいです', pronunciation: '오나카가 이타이데스', korean: '배가 아파요' },
      { japanese: '保険証はお持ちですか', reading: 'ほけんしょうはおもちですか', pronunciation: '호켄쇼-와 오모치 데스카', korean: '보험증 갖고 계세요?' },
      { japanese: '薬は一日三回飲んでください', reading: 'くすりはいちにちさんかいのんでください', pronunciation: '쿠스리와 이치니치 산카이 논데 쿠다사이', korean: '약은 하루 세 번 드세요' },
      { japanese: '初診ですか', reading: 'しょしんですか', pronunciation: '쇼신 데스카', korean: '처음 오셨나요?' },
      { japanese: 'いつから症状がありますか', reading: 'いつからしょうじょうがありますか', pronunciation: '이쓰카라 쇼-죠-가 아리마스카', korean: '언제부터 증상이 있었나요?' },
    ],
    top: 38,
    left: 8,
    color: '#27ae60',
  },
  {
    id: 'cityhall',
    name_jp: '市役所',
    name_kr: '구청',
    emoji: '🏛️',
    tag: '행정',
    description_kr: '주민등록·이사·재류 카드 관련 표현',
    card_count: 12,
    real_use_count: 2,
    episode_id: undefined,
    expressions: [
      { japanese: '転入届を出したいです', reading: 'てんにゅうとどけをだしたいです', pronunciation: '텐뉴-토도케오 다시타이데스', korean: '전입 신고를 하고 싶어요' },
      { japanese: '在留カードの更新をお願いします', reading: 'ざいりゅうかーどのこうしんをおねがいします', pronunciation: '자이류-카-도노 코-신오 오네가이시마스', korean: '재류 카드 갱신 부탁드립니다' },
      { japanese: '書類が必要ですか', reading: 'しょるいがひつようですか', pronunciation: '쇼루이가 히쓰요-데스카', korean: '서류가 필요한가요?' },
      { japanese: 'マイナンバーカードを申請したいです', reading: 'まいなんばーかーどをしんせいしたいです', pronunciation: '마이난바-카-도오 신세이 시타이데스', korean: '마이넘버 카드를 신청하고 싶어요' },
      { japanese: '何番の窓口に行けばいいですか', reading: 'なんばんのまどぐちにいけばいいですか', pronunciation: '난반노 마도구치니 이케바 이이데스카', korean: '몇 번 창구에 가면 되나요?' },
    ],
    top: 34,
    left: 40,
    color: '#2c3e50',
  },
  {
    id: 'postoffice',
    name_jp: '郵便局',
    name_kr: '우체국·택배',
    emoji: '📮',
    tag: '우편',
    description_kr: '편지·소포·택배에서 쓰는 일본어',
    card_count: 5,
    real_use_count: 0,
    expressions: [
      { japanese: 'この荷物を送りたいです', reading: 'このにもつをおくりたいです', pronunciation: '코노 니모쓰오 오쿠리타이데스', korean: '이 짐을 보내고 싶어요' },
      { japanese: '速達でお願いします', reading: 'そくたつでおねがいします', pronunciation: '소쿠타쓰데 오네가이시마스', korean: '빠른 우편으로 부탁드립니다' },
      { japanese: '不在票が入っていました', reading: 'ふざいひょうがはいっていました', pronunciation: '후자이효-가 하잇테이마시타', korean: '부재중 안내서가 들어 있었어요' },
      { japanese: '着払いでお願いします', reading: 'ちゃくばらいでおねがいします', pronunciation: '챠쿠바라이데 오네가이시마스', korean: '착불로 부탁드립니다' },
      { japanese: '追跡番号を教えてください', reading: 'ついせきばんごうをおしえてください', pronunciation: '쓰이세키반고-오 오시에테쿠다사이', korean: '운송장 번호 알려주세요' },
    ],
    top: 20,
    left: 82,
    color: '#e67e22',
  },
  {
    id: 'bank',
    name_jp: '銀行',
    name_kr: '은행 표현',
    emoji: '🏦',
    tag: '금융',
    description_kr: '통장 개설·송금·ATM 표현',
    card_count: 7,
    real_use_count: 0,
    expressions: [
      { japanese: '口座を作りたいです', reading: 'こうざをつくりたいです', pronunciation: '코-자오 쓰쿠리타이데스', korean: '계좌를 만들고 싶어요' },
      { japanese: '暗証番号を入力してください', reading: 'あんしょうばんごうをにゅうりょくしてください', pronunciation: '안쇼-반고-오 뉴-료쿠 시테쿠다사이', korean: '비밀번호를 입력해 주세요' },
      { japanese: '送金したいです', reading: 'そうきんしたいです', pronunciation: '소-킨 시타이데스', korean: '송금하고 싶어요' },
      { japanese: '通帳を作りたいです', reading: 'つうちょうをつくりたいです', pronunciation: '쓰-초-오 쓰쿠리타이데스', korean: '통장을 만들고 싶어요' },
      { japanese: '残高を確認したいです', reading: 'ざんだかをかくにんしたいです', pronunciation: '잔다카오 카쿠닌 시타이데스', korean: '잔액을 확인하고 싶어요' },
    ],
    top: 62,
    left: 5,
    color: '#f39c12',
  },
  {
    id: 'convenience',
    name_jp: 'コンビニ',
    name_kr: '편의점·정산',
    emoji: '🏪',
    tag: '편의점',
    description_kr: '편의점 일상 표현',
    card_count: 9,
    real_use_count: 3,
    expressions: [
      { japanese: 'Suicaで払います', reading: 'すいかではらいます', pronunciation: '스이카데 하라이마스', korean: 'Suica로 낼게요' },
      { japanese: 'あたためますか', reading: 'あたためますか', pronunciation: '아타타메마스카', korean: '데워드릴까요?' },
      { japanese: 'レシートはいりますか', reading: 'れしーとはいりますか', pronunciation: '레시-토와 이리마스카', korean: '영수증 필요하세요?' },
      { japanese: 'コピーをお願いします', reading: 'こぴーをおねがいします', pronunciation: '코피-오 오네가이시마스', korean: '복사 부탁드려요' },
      { japanese: '袋に入れてください', reading: 'ふくろにいれてください', pronunciation: '후쿠로니 이레테 쿠다사이', korean: '봉지에 넣어주세요' },
    ],
    top: 58,
    left: 48,
    color: '#16a085',
  },
  {
    id: 'police',
    name_jp: '警察署',
    name_kr: '경찰·신고 표현',
    emoji: '🚔',
    tag: '경찰',
    description_kr: '분실·신고·긴급 상황 표현',
    card_count: 4,
    real_use_count: 0,
    expressions: [
      { japanese: '財布を失くしました', reading: 'さいふをなくしました', pronunciation: '사이후오 나쿠시마시타', korean: '지갑을 잃어버렸어요' },
      { japanese: '110番に電話してください', reading: 'ひゃくとおばんにでんわしてください', pronunciation: '햐쿠토-반니 덴와 시테쿠다사이', korean: '110번에 전화해 주세요' },
      { japanese: '遺失物届を出したいです', reading: 'いしつぶつとどけをだしたいです', pronunciation: '이시쓰부쓰토도케오 다시타이데스', korean: '분실물 신고를 하고 싶어요' },
      { japanese: 'パスポートをなくしました', reading: 'ぱすぽーとをなくしました', pronunciation: '파스포-토오 나쿠시마시타', korean: '여권을 잃어버렸어요' },
      { japanese: '交通事故がありました', reading: 'こうつうじこがありました', pronunciation: '코-쓰-지코가 아리마시타', korean: '교통사고가 났어요' },
    ],
    top: 52,
    left: 80,
    color: '#2980b9',
  },
]

export type VisitStatus = 'done' | 'in-progress' | 'not-started'

export interface MonthlyVisit {
  location_id: string
  status: VisitStatus
  progress: number // 0-100
}

export const MONTHLY_VISITS: MonthlyVisit[] = [
  { location_id: 'supermarket', status: 'done', progress: 100 },
  { location_id: 'hospital', status: 'in-progress', progress: 55 },
  { location_id: 'cityhall', status: 'not-started', progress: 0 },
  { location_id: 'bank', status: 'not-started', progress: 0 },
  { location_id: 'nursery', status: 'not-started', progress: 0 },
]
