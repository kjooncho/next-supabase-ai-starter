export interface EpisodeExpression {
  japanese: string
  reading: string
  pronunciation: string
  korean: string
  example?: string
}

export interface Episode {
  id: string
  series_id: string
  series_name_jp: string
  series_name_kr: string
  number: number
  tag: string
  scene_kr: string
  scene_jp: string
  character_name_jp: string
  character_name_kr: string
  character_emoji: string
  dialogue_jp: string
  dialogue_kr: string
  vocab_word: string
  vocab_reading: string
  vocab_meaning: string
  vocab_example_jp: string
  vocab_example_kr: string
  vocab_korea_compare: string
  expressions: EpisodeExpression[]
  deeper_reading: string
}

export const EPISODES: Episode[] = [
  {
    id: 'granny-01',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 1,
    tag: '지역공동체',
    scene_kr: '이사 온 첫 날, 옆집 할머니가 현관 앞에서 기다리고 있었다',
    scene_jp: '引っ越してきた初日、隣のおばあちゃんが玄関の前で待っていた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: 'あら、新しいお隣さんね。よろしくお願いしますね。何かあったら遠慮なく声かけてね。',
    dialogue_kr: '어머, 새 이웃이구나. 잘 부탁해요. 무슨 일 있으면 편하게 불러요.',
    vocab_word: 'お隣さん',
    vocab_reading: 'おとなりさん',
    vocab_meaning: '이웃, 옆집 사람',
    vocab_example_jp: '「お隣さんに塩を借りる」(이웃에게 소금을 빌리다) — 가까운 이웃 관계를 나타내는 표현입니다.',
    vocab_example_kr: '일본에서 \"お隣さん\"는 단순한 옆집이 아니라, 서로 돕고 지내는 지역사회 관계를 의미합니다.',
    vocab_korea_compare: '한국의 \"옆집\"보다 좀 더 따뜻하고 공동체적인 뉘앙스가 있어요. 일본 주택가에서는 이사 시 인사(引越し挨拶)가 중요한 문화입니다.',
    expressions: [
      { japanese: 'よろしくお願いします', reading: 'よろしくおねがいします', pronunciation: '요로시쿠 오네가이시마스', korean: '잘 부탁드립니다', example: '처음 만날 때 필수 표현' },
      { japanese: '遠慮なく', reading: 'えんりょなく', pronunciation: '엔료나쿠', korean: '편하게, 거리낌 없이', example: '「遠慮なく声かけてね」편하게 불러요' },
      { japanese: '声をかける', reading: 'こえをかける', pronunciation: '코에오 카케루', korean: '말을 걸다, 부르다', example: '「何かあったら声かけて」무슨 일 있으면 불러줘' },
    ],
    deeper_reading: '일본의 이사 인사(引越し挨拶, ひっこしあいさつ)는 중요한 문화입니다. 이사 온 날 근처 집에 수건이나 세제 같은 작은 선물을 들고 인사를 다니는 것이 일반적이에요. 이를 통해 첫 인상을 좋게 남기고 이웃 관계의 기초를 쌓습니다.',
  },
  {
    id: 'granny-02',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 2,
    tag: '지역공동체',
    scene_kr: '동네 할머니가 回覧板을 들고 현관 앞에 나타났다',
    scene_jp: '近所のおばあちゃんが回覧板を持って、玄関の前に現れた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: 'あのね、回覧板っていうのはね、昔からずっと続いている習慣でね。ご近所のみんなに回すのよ。',
    dialogue_kr: '있잖아, 回覧板이라는 건 옛날부터 계속 이어온 관습인데, 동네 모두에게 돌리는 거야.',
    vocab_word: '回覧板',
    vocab_reading: 'かいらんばん',
    vocab_meaning: '동네 소식을 이웃집에 순서대로 돌려보는 공지판',
    vocab_example_jp: '「回覧板を次の家に回す」(回覧板을 다음 집으로 돌리다) — 에도 시대부터 이어온 공지 방식으로, 마을 행사나 쓰레기 분리배출 규정 등을 전달합니다.',
    vocab_example_kr: '「한국과 비교」아파트 공지를 이메일이나 앱으로 받는 것과 달리, 일본 주택가에서는 종이 공지판을 이웃집에 직접 전달하는 것이 여전히 일반적입니다.',
    vocab_korea_compare: '한국 아파트의 카카오톡 단체방이나 앱 공지와 달리, 回覧板은 직접 이웃과 마주치게 되어 자연스럽게 커뮤니티를 형성하는 역할을 합니다.',
    expressions: [
      { japanese: '回覧板を回す', reading: 'かいらんばんをまわす', pronunciation: '카이란반오 마와스', korean: '회람판을 돌리다', example: '「次の家に回してください」다음 집에 전달해 주세요' },
      { japanese: 'ご近所', reading: 'ごきんじょ', pronunciation: '고킨죠', korean: '이웃, 근처', example: '「ご近所付き合い」이웃 사람들과의 교제' },
      { japanese: '習慣', reading: 'しゅうかん', pronunciation: '슈-칸', korean: '관습, 습관', example: '「昔からの習慣」옛날부터의 관습' },
    ],
    deeper_reading: '回覧板(かいらんばん)은 에도 시대부터 이어온 일본의 전통적인 공지 방식입니다. 町内会(ちょうないかい, 동네 자치회)가 운영하며, 쓰레기 분리수거 규정, 동네 행사, 방재 훈련 등을 알립니다. 디지털 시대에도 여전히 많은 지역에서 유지되고 있는 이유는, 이웃 간의 실제 접촉을 통해 커뮤니티를 유지하는 기능도 하기 때문입니다.',
  },
  {
    id: 'granny-03',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 3,
    tag: '쓰레기 분리수거',
    scene_kr: '처음으로 쓰레기를 내놓으러 갔다가 할머니한테 혼났다',
    scene_jp: '初めてゴミを出しに行ったら、おばあちゃんに注意された',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: 'あら、そこに出したらダメよ。燃えるゴミは火曜日と金曜日だけね。ちゃんと分別してね。',
    dialogue_kr: '어머, 거기다 버리면 안 돼. 타는 쓰레기는 화요일이랑 금요일만이야. 제대로 분리해야 해.',
    vocab_word: '分別',
    vocab_reading: 'ぶんべつ',
    vocab_meaning: '분리 (쓰레기 분리수거)',
    vocab_example_jp: '「ゴミの分別をしっかりしないと、収集してもらえません」쓰레기를 제대로 분별하지 않으면 수거해 가지 않습니다.',
    vocab_example_kr: '일본의 쓰레기 분별은 지역마다 규칙이 달라서, 이사 후 가장 먼저 파악해야 할 중요한 생활 정보입니다.',
    vocab_korea_compare: '한국은 종량제 봉투를 사용하지만, 일본은 시/구별로 다른 색깔 봉투와 요일제를 사용합니다. 규칙을 어기면 수거를 거부당할 수 있어요.',
    expressions: [
      { japanese: '燃えるゴミ', reading: 'もえるごみ', pronunciation: '모에루 고미', korean: '타는 쓰레기 (가연성 쓰레기)', example: '「燃えるゴミの日」타는 쓰레기 날' },
      { japanese: '分別する', reading: 'ぶんべつする', pronunciation: '분베쓰스루', korean: '분리하다', example: '「きちんと分別してください」제대로 분리해 주세요' },
      { japanese: '収集', reading: 'しゅうしゅう', pronunciation: '슈-슈-', korean: '수거', example: '「ゴミ収集の日」쓰레기 수거일' },
    ],
    deeper_reading: '일본의 ゴミ分別(쓰레기 분리)은 외국인이 가장 어려워하는 생활 규칙 중 하나입니다. 燃えるゴミ(가연성), 燃えないゴミ(불연성), 資源ゴミ(재활용), 粗大ゴミ(대형 폐기물)로 나뉘며, 각 지자체마다 수거 요일과 봉투 색깔이 다릅니다. 이사 후 구청(区役所)에서 쓰레기 분리 가이드를 받는 것이 중요합니다.',
  },
  {
    id: 'granny-04',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 4,
    tag: '자치회',
    scene_kr: '할머니가 봉투 하나를 들고 찾아와 자치회비를 내라고 했다',
    scene_jp: 'おばあちゃんが封筒を持ってきて、自治会費を払うように言った',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: '今月の自治会費なんですけど、よかったら加入してもらえませんか？地域のためになるんですよ。',
    dialogue_kr: '이번 달 자치회비인데요, 가입해주시겠어요? 지역을 위한 거예요.',
    vocab_word: '自治会費',
    vocab_reading: 'じちかいひ',
    vocab_meaning: '자치회비 (동네 자치회에 내는 회비)',
    vocab_example_jp: '「自治会費は月500円です」자치회비는 월 500엔입니다.',
    vocab_example_kr: '일본 주택가의 자치회(自治会)는 쓰레기 수거, 방재, 축제 등을 주민이 함께 운영하는 조직이에요.',
    vocab_korea_compare: '한국 아파트의 관리비에 해당하지만, 강제 가입이 아니라 임의 단체입니다. 그래도 지역 생활을 위해 가입하는 게 관행이에요.',
    expressions: [
      { japanese: '加入する', reading: 'かにゅうする', pronunciation: '카뉴-스루', korean: '가입하다', example: '「自治会に加入する」자치회에 가입하다' },
      { japanese: 'よかったら', reading: 'よかったら', pronunciation: '요캇타라', korean: '괜찮으시다면, 할 수 있으시면', example: '「よかったら一緒にどうぞ」괜찮으시다면 같이 어떠세요' },
      { japanese: '地域のため', reading: 'ちいきのため', pronunciation: '치이키노 타메', korean: '지역을 위해', example: '「地域のために働く」지역을 위해 일하다' },
    ],
    deeper_reading: '일본의 自治会(자치회) 또는 町内会(초나이카이)는 주민이 자발적으로 운영하는 지역 공동체 조직입니다. 쓰레기 수거일 공지, 지역 축제, 방재 훈련, 어린이 등하교 안전 등을 담당합니다. 외국인도 가입 가능하며, 지역에 녹아들고 싶다면 가입을 권장합니다.',
  },
  {
    id: 'granny-05',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 5,
    tag: '계절행사',
    scene_kr: '할머니가 동네 꽃놀이 행사에 초대해줬다',
    scene_jp: 'おばあちゃんが町内のお花見に誘ってくれた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: '来週の土曜日、公園でお花見するんだけど、よかったら一緒にどうぞ。手ぶらで来ていいわよ。',
    dialogue_kr: '다음 주 토요일에 공원에서 꽃놀이 하는데, 괜찮으시면 같이 오세요. 빈손으로 오셔도 돼요.',
    vocab_word: 'お花見',
    vocab_reading: 'おはなみ',
    vocab_meaning: '꽃놀이 (벚꽃을 보며 야외에서 음식을 먹는 행사)',
    vocab_example_jp: '「花見でお弁当を食べる」꽃놀이에서 도시락을 먹다',
    vocab_example_kr: '일본의 꽃놀이는 3~4월 벚꽃 시즌에 공원에서 자리를 깔고 음식을 먹는 국민 행사입니다.',
    vocab_korea_compare: '한국에서도 꽃놀이는 있지만, 일본의 お花見는 회사·동네 단위로도 열리며 자리 확보(場所取り)가 치열한 특별한 문화예요.',
    expressions: [
      { japanese: '手ぶらで来る', reading: 'てぶらでくる', pronunciation: '테부라데 쿠루', korean: '빈손으로 오다', example: '「手ぶらで来ていいよ」빈손으로 와도 돼' },
      { japanese: '一緒にどうぞ', reading: 'いっしょにどうぞ', pronunciation: '잇쇼니 도-조', korean: '같이 어떠세요 (초대 표현)', example: '「よかったら一緒にどうぞ」괜찮으시면 같이 오세요' },
      { japanese: '場所取り', reading: 'ばしょとり', pronunciation: '바쇼토리', korean: '자리 잡기', example: '「朝早く行って場所取りをする」아침 일찍 가서 자리를 잡다' },
    ],
    deeper_reading: 'お花見(꽃놀이)는 일본에서 봄을 알리는 가장 대표적인 행사입니다. 벚꽃 개화 예측(桜前線, さくらぜんせん)을 뉴스에서 매일 보도할 만큼 중요한 문화적 이벤트예요. 회사에서는 신입사원이 꽃놀이 자리 확보를 담당하는 관행도 있습니다.',
  },
  {
    id: 'granny-06',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 6,
    tag: '여름축제',
    scene_kr: '할머니가 여름 마을 축제에서 저를 알아보고 말을 걸었다',
    scene_jp: 'おばあちゃんが夏祭りで私を見つけて声をかけてくれた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: 'あら、浴衣を着てきたの？とっても似合ってるわよ。露店でなにか買った？',
    dialogue_kr: '어머, 유카타 입고 왔어요? 너무 잘 어울려요. 노점에서 뭐 샀어요?',
    vocab_word: '浴衣',
    vocab_reading: 'ゆかた',
    vocab_meaning: '유카타 (여름용 간편 기모노)',
    vocab_example_jp: '「夏祭りに浴衣で行く」여름 축제에 유카타를 입고 가다',
    vocab_example_kr: '유카타는 여름 축제나 불꽃놀이 때 입는 가벼운 기모노예요. 관광지 렌탈도 많습니다.',
    vocab_korea_compare: '한국의 한복을 행사 때 빌려 입는 것처럼, 일본에서도 여름 축제 전에 유카타 렌탈 가게가 붐빕니다.',
    expressions: [
      { japanese: '似合う', reading: 'にあう', pronunciation: '니아우', korean: '어울리다', example: '「とっても似合ってるね」너무 잘 어울려' },
      { japanese: '露店', reading: 'ろてん', pronunciation: '로텐', korean: '노점, 포장마차', example: '「露店でたこ焼きを買う」노점에서 타코야키를 사다' },
      { japanese: '夏祭り', reading: 'なつまつり', pronunciation: '나쓰 마쓰리', korean: '여름 축제', example: '「夏祭りに行く」여름 축제에 가다' },
    ],
    deeper_reading: '일본의 夏祭り(여름 축제)는 7~8월에 각 지역 신사나 공원에서 열립니다. 盆踊り(봉 오도리, 단체 춤), 花火大会(하나비 타이카이, 불꽃놀이), 金魚すくい(금붕어 잡기) 등이 대표 이벤트예요. 유카타를 입고 가족·연인과 함께 하는 여름의 핵심 문화입니다.',
  },
  {
    id: 'granny-07',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 7,
    tag: '방재훈련',
    scene_kr: '할머니가 방재 훈련 날이라며 같이 참가하자고 했다',
    scene_jp: 'おばあちゃんが防災訓練の日だと言って、一緒に参加しようと誘ってくれた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: '今日は防災訓練があるの。避難場所は公民館よ。いざという時のために覚えておいてね。',
    dialogue_kr: '오늘 방재 훈련이 있어요. 대피 장소는 공민관이에요. 만약을 위해 기억해 둬요.',
    vocab_word: '防災訓練',
    vocab_reading: 'ぼうさいくんれん',
    vocab_meaning: '방재 훈련 (재해 대비 훈련)',
    vocab_example_jp: '「年に一度の防災訓練に参加する」연 1회 방재 훈련에 참가하다',
    vocab_example_kr: '일본은 지진 다발 국가라 방재 훈련이 학교·직장·동네 단위로 정기적으로 열립니다.',
    vocab_korea_compare: '한국의 민방위 훈련과 비슷하지만, 일본은 실제 피난 경로 확인과 소화기 사용 실습까지 포함한 경우가 많아요.',
    expressions: [
      { japanese: '避難場所', reading: 'ひなんばしょ', pronunciation: '히난바쇼', korean: '대피 장소', example: '「最寄りの避難場所を確認する」가장 가까운 대피 장소를 확인하다' },
      { japanese: 'いざという時', reading: 'いざというとき', pronunciation: '이자토이우 토키', korean: '만약의 경우, 비상시', example: '「いざという時のために備える」만약의 경우를 위해 대비하다' },
      { japanese: '公民館', reading: 'こうみんかん', pronunciation: '코-민칸', korean: '공민관 (지역 공공 시설)', example: '「公民館で訓練をする」공민관에서 훈련을 하다' },
    ],
    deeper_reading: '일본에서는 9월 1일 関東大震災 기념일에 맞춰 防災の日(방재의 날)를 지정하고 전국적으로 훈련이 열립니다. 각 자치체는 ハザードマップ(재해 위험 지도)를 배포하며, 비상식량·음료·손전등 등 3일치 비상 키트 준비를 권장합니다.',
  },
  {
    id: 'granny-08',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 8,
    tag: '연말대청소',
    scene_kr: '할머니가 연말 대청소 날 복도 청소를 함께 하자고 했다',
    scene_jp: 'おばあちゃんが年末大掃除の日に廊下の掃除を一緒にしようと言ってくれた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: '年末の大掃除、一緒にやりましょうよ。共用部分はみんなで綺麗にするのよ。',
    dialogue_kr: '연말 대청소 같이 합시다. 공용 구역은 다 같이 청소하는 거예요.',
    vocab_word: '大掃除',
    vocab_reading: 'おおそうじ',
    vocab_meaning: '대청소',
    vocab_example_jp: '「年末に大掃除をする」연말에 대청소를 하다',
    vocab_example_kr: '일본의 大掃除는 단순한 청소가 아니라 한 해를 마무리하는 의례적 행위예요. 특히 12월 28일 전후가 피크입니다.',
    vocab_korea_compare: '한국도 연말 대청소 문화가 있지만, 일본은 한 해를 깨끗하게 마무리한다는 의미(年越し)가 강하게 담겨 있습니다.',
    expressions: [
      { japanese: '共用部分', reading: 'きょうようぶぶん', pronunciation: '쿄-요-부분', korean: '공용 구역', example: '「共用部分をきれいにする」공용 구역을 청소하다' },
      { japanese: '年越し', reading: 'としこし', pronunciation: '토시코시', korean: '해를 넘기다, 연말연시', example: '「きれいな家で年越しをする」깨끗한 집에서 해를 넘기다' },
      { japanese: '綺麗にする', reading: 'きれいにする', pronunciation: '키레이니 스루', korean: '깨끗하게 하다, 청소하다', example: '「部屋を綺麗にする」방을 깨끗이 하다' },
    ],
    deeper_reading: '일본에서 大掃除는 12월에 집과 직장을 청소하는 연례 행사입니다. 新年を気持ちよく迎える(기분 좋게 새해를 맞이한다)는 의미가 있어요. 직장에서는 仕事納め(시고토 오사메, 업무 마무리일)에 함께 청소를 하는 관행도 있습니다.',
  },
  {
    id: 'granny-09',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 9,
    tag: '택배·부재',
    scene_kr: '외출 중에 할머니가 내 택배를 대신 받아주셨다',
    scene_jp: '外出中におばあちゃんが宅配便を代わりに受け取ってくれた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: 'さっき宅配便が来たから、代わりに受け取っておいたわよ。玄関に置いてあるから。',
    dialogue_kr: '방금 택배가 왔길래 대신 받아뒀어요. 현관에 놔뒀으니까요.',
    vocab_word: '宅配便',
    vocab_reading: 'たくはいびん',
    vocab_meaning: '택배',
    vocab_example_jp: '「宅配便を受け取る」택배를 받다',
    vocab_example_kr: '일본의 대표 택배는 ヤマト運輸(야마토), 佐川急便(사가와), 日本郵便(일본우편). 부재 시 不在票(후자이효-) 안내서가 우편함에 들어옵니다.',
    vocab_korea_compare: '한국처럼 경비실이 없는 주택가에서는 이웃이 대신 받아주는 문화가 있어요. 이런 관계가 생기면 진정한 ご近所さん입니다.',
    expressions: [
      { japanese: '代わりに', reading: 'かわりに', pronunciation: '카와리니', korean: '대신에', example: '「代わりに受け取る」대신 받다' },
      { japanese: '受け取る', reading: 'うけとる', pronunciation: '우케토루', korean: '수령하다, 받다', example: '「荷物を受け取る」짐을 받다' },
      { japanese: '置いておく', reading: 'おいておく', pronunciation: '오이테오쿠', korean: '두다, 보관해두다', example: '「玄関に置いておきます」현관에 둘게요' },
    ],
    deeper_reading: '일본의 택배 문화에서 再配達(재배달) 신청은 전화나 앱으로 할 수 있습니다. 하지만 환경 부담을 이유로 정부가 再配達削減(재배달 감축) 정책을 추진 중이에요. 택배함(宅配ボックス) 설치가 빠르게 늘고 있는 이유이기도 합니다.',
  },
  {
    id: 'granny-10',
    series_id: 'granny',
    series_name_jp: '隣のおばあちゃんトーク',
    series_name_kr: '이웃 할머니 토크',
    number: 10,
    tag: '이웃소개',
    scene_kr: '새 이웃이 이사 와서 할머니가 나에게 소개해줬다',
    scene_jp: '新しい隣人が引っ越してきて、おばあちゃんが私に紹介してくれた',
    character_name_jp: 'おばあちゃん',
    character_name_kr: '이웃 할머니',
    character_emoji: '👵',
    dialogue_jp: 'こちら、先月引っ越してきた山田さんよ。同じ外国出身なんですって。仲良くしてあげてね。',
    dialogue_kr: '이쪽은 지난 달에 이사 오신 야마다 씨예요. 같은 외국 출신이래요. 잘 지내줘요.',
    vocab_word: '仲良くする',
    vocab_reading: 'なかよくする',
    vocab_meaning: '사이좋게 지내다, 친하게 지내다',
    vocab_example_jp: '「隣の人と仲良くする」옆집 사람과 사이좋게 지내다',
    vocab_example_kr: '일본 문화에서 "仲良くしてあげてね"는 상대방에 대한 배려와 환영의 표현이에요.',
    vocab_korea_compare: '한국의 "잘 챙겨줘"와 비슷한 뉘앙스이지만, 일본은 직접적인 부탁보다는 부드러운 권유 표현을 씁니다.',
    expressions: [
      { japanese: '先月', reading: 'せんげつ', pronunciation: '센게쓰', korean: '지난 달', example: '「先月引っ越してきた」지난 달에 이사 왔다' },
      { japanese: '出身', reading: 'しゅっしん', pronunciation: '슷신', korean: '출신', example: '「どちらのご出身ですか」어디 출신이세요?' },
      { japanese: '仲良くする', reading: 'なかよくする', pronunciation: '나카요쿠 스루', korean: '사이좋게 지내다', example: '「ぜひ仲良くしてください」꼭 친하게 지내주세요' },
    ],
    deeper_reading: '일본에서 이웃 소개는 드문 편이지만, 오랜 주민(특히 할머니)이 중간 역할을 해주는 경우가 있습니다. 외국인 거주자가 늘면서 국제화된 주택가도 많아졌어요. 같은 외국 출신 이웃을 만나는 것은 일본 생활의 든든한 연결망이 됩니다.',
  },
]

export function getEpisodesBySeriesId(seriesId: string) {
  return EPISODES.filter((e) => e.series_id === seriesId).sort((a, b) => a.number - b.number)
}

export function getEpisodeById(id: string) {
  return EPISODES.find((e) => e.id === id)
}

export const SERIES_LIST = [
  {
    id: 'granny',
    name_jp: '隣のおばあちゃんトーク',
    name_kr: '이웃 할머니 토크',
    description: '일본 주택가의 이웃 할머니에게 배우는 진짜 생활 일본어',
    emoji: '👵',
    total: 21,
    available: 10,
    tag: '지역공동체',
  },
]
