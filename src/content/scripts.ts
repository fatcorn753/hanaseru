/**
 * 分岐つき台本会話。AI を使わず、あらかじめ書いた会話の分かれ道をたどる。
 * 「正解」で進む仕組みにはしない。どの返しでも会話は続き、気まずくなっても立て直せることを体験させる。
 */

export type Tone = "good" | "ok" | "closed";
export type SkillId =
  | "followup" | "reflect" | "ending" | "topic" | "disclosure" | "aizuchi" | "silence"
  | "askhelp" | "request" | "decline" | "speech";

export interface ScriptChoice {
  text: string;
  next: string;
  tone: Tone;
  /** 選んだあとに出す短い解説 */
  note: string;
  /** この返しで使えている型(道場のドリル ID) */
  skill?: SkillId;
}

export interface ScriptNode {
  /** 相手のセリフ。空なら相手は話さない(自分から話しかける、沈黙など) */
  says?: string;
  /** 状況の説明(読み上げない) */
  context?: string;
  choices?: ScriptChoice[];
  /** 会話の終わり */
  end?: boolean;
}

export type Scene = "class" | "work" | "circle" | "shop" | "office" | "assert";

export interface Script {
  id: string;
  scene: Scene;
  title: string;
  setting: string;
  partner: string;
  /** 読み上げの声の高さと速さ(1 が標準) */
  voice: { pitch: number; rate: number };
  start: string;
  nodes: Record<string, ScriptNode>;
}

export const SCENE_NAMES: Record<Scene, string> = {
  class: "授業・ゼミの前後",
  work: "バイト・職場の休憩",
  circle: "サークル・集まりの初対面",
  shop: "店や美容院",
  office: "職場・バイトのやりとり",
  assert: "頼む・断る",
};

const classScript: Script = {
  id: "class-before",
  scene: "class",
  title: "授業の前に、隣の人と",
  setting: "授業が始まる 5 分前。いつも同じあたりに座っている人が、隣でレジュメを見ている。",
  partner: "隣の席の人",
  voice: { pitch: 1.1, rate: 1.05 },
  start: "n1",
  nodes: {
    n1: {
      context: "あなたから声をかけてみます。",
      choices: [
        { text: "今日って小テストありましたっけ？", next: "n2a", tone: "good", skill: "topic", note: "目の前の共通の話題(授業)は、切り出しとして自然。答えやすい質問から入れている。" },
        { text: "こんにちは。いつもこのあたりに座ってますよね", next: "n2b", tone: "good", skill: "topic", note: "相手を覚えていたと伝えると、好意が伝わりやすい。人は話しかけられることを、話しかける側が思うより喜ぶ。" },
        { text: "(黙ってスマホを見る)", next: "n2c", tone: "closed", note: "見送るのも一つの選択。練習なので、今回は相手から話しかけられた場合を体験してみましょう。" },
      ],
    },
    n2a: {
      says: "え、ないと思いますよ。来週じゃなかったかな。",
      choices: [
        { text: "よかった…全然準備してなくて(笑)", next: "n3", tone: "good", skill: "disclosure", note: "小さな自己開示。相手も「自分も」と返しやすくなる。" },
        { text: "そうですか", next: "n3c", tone: "closed", note: "事実だけの返事で終わると、会話の糸口が切れやすい。気持ちや理由を一言足すと続く。" },
        { text: "来週なんですね。この授業、課題多くないですか？", next: "n3", tone: "good", skill: "topic", note: "答えを受けてから、同じ授業の話題を広げている。" },
      ],
    },
    n2b: {
      says: "あ、はい(笑)。前のほうだと、指されそうで緊張するので。",
      choices: [
        { text: "わかります、前は緊張しますよね", next: "n3", tone: "good", skill: "reflect", note: "相手の気持ち(緊張)をそのまま受けとめている。共感は短くても伝わる。" },
        { text: "そうなんですね", next: "n3c", tone: "ok", skill: "aizuchi", note: "あいづちは悪くない。ただ、それだけだと相手が次を探すことになる。一言足すと続く。" },
        { text: "何年生ですか？", next: "n3", tone: "ok", note: "質問はよい。ただ、相手の「緊張する」に触れずに話題を変えている。まず一言受けてからだと、なおよい。" },
      ],
    },
    n2c: {
      says: "あの、すみません。今日って出席カード、もう配られました？",
      choices: [
        { text: "まだだと思います。いつも最初に回ってきますよね", next: "n3", tone: "good", skill: "topic", note: "答えに一言足して、話を続けやすくしている。" },
        { text: "いえ", next: "n3c", tone: "closed", note: "答えとしては十分。ただ、相手からの話しかけは会話の入口でもある。一言足すと広がる。" },
        { text: "まだです。…この授業、出席厳しいですよね", next: "n3", tone: "good", skill: "topic", note: "答えてから、同じ話題で自分から一歩進めている。" },
      ],
    },
    n3c: {
      context: "会話が止まって、数秒の沈黙。気まずく感じるかもしれないが、沈黙は相手にとっては、自分が思うほど気になっていないことが多い。",
      choices: [
        { text: "(もう一度)この授業、けっこう大変じゃないですか？", next: "n3", tone: "good", skill: "silence", note: "止まった会話は、もう一度話しかければ戻せる。沈黙のあとの一言は、思ったより自然に受け取られる。" },
        { text: "(そのまま授業を待つ)", next: "endQuiet", tone: "closed", note: "今日はここまでで大丈夫。次は、目の前の授業の話題から一言だけ試してみましょう。" },
      ],
    },
    n3: {
      says: "ですよね。この授業、けっこう大変ですよね。何学部なんですか？",
      choices: [
        { text: "工学部です。そちらは？", next: "n4", tone: "good", note: "答えてから聞き返すと、会話が往復になる。" },
        { text: "工学部です", next: "n4", tone: "ok", note: "答えはよい。「そちらは？」と聞き返すと、相手も話しやすくなる。" },
        { text: "工学部で、この授業は興味があって取ったんです", next: "n4", tone: "good", skill: "disclosure", note: "答えに理由を一つ添えると、相手が次に聞けることが増える。" },
      ],
    },
    n4: {
      says: "私は文学部です。この授業、他の学部の人けっこう多いですよね。",
      choices: [
        { text: "多いですね。文学部だと、どんな授業が多いんですか？", next: "n5", tone: "good", skill: "followup", note: "相手の話から質問を続けている(深掘り質問)。聞いてくれていると感じてもらいやすい。" },
        { text: "へえ", next: "n5", tone: "closed", note: "短いあいづちだけだと、相手は「興味ないのかな」と感じやすい。" },
        { text: "そうですね。自分の学部の授業より面白いです", next: "n5", tone: "ok", skill: "disclosure", note: "自分の感想を返している。ここから相手に質問を返すと、さらに続く。" },
      ],
    },
    n5: {
      context: "先生が教室に入ってきた。",
      says: "あ、始まりますね。",
      choices: [
        { text: "ですね。またレポートのこととか、聞いてもいいですか？", next: "endGood", tone: "good", skill: "ending", note: "次につながる終わり方。会話は、相手がもう少し話したいと思っているうちに終えるくらいがちょうどいい。" },
        { text: "(うなずいて前を向く)", next: "endOk", tone: "ok", note: "これでも十分。次に会ったとき「この前はどうも」と声をかけやすい。" },
        { text: "あ、はい", next: "endOk", tone: "ok", note: "自然な終わり方。余裕があれば、次につながる一言を足してみましょう。" },
      ],
    },
    endGood: { says: "もちろんです。いつでもどうぞ。", end: true },
    endOk: { context: "授業が始まった。最初の会話はここまで。", end: true },
    endQuiet: { context: "今日は話さずに授業が始まった。それも一つの選択。", end: true },
  },
};

const workScript: Script = {
  id: "work-break",
  scene: "work",
  title: "バイトの休憩で",
  setting: "バイトの休憩室。最近入った同年代の人と二人きりになった。",
  partner: "最近入った同僚",
  voice: { pitch: 0.95, rate: 1.0 },
  start: "w1",
  nodes: {
    w1: {
      says: "おつかれさまです。…今日、混んでましたね。",
      choices: [
        { text: "おつかれさまです。ほんとに、昼すごかったですね", next: "w2", tone: "good", skill: "reflect", note: "相手の言葉を受けて、同じ気持ちを返している。" },
        { text: "そうですね", next: "w1c", tone: "closed", note: "返事としては十分。ただ、相手からのきっかけを広げる一言があると続く。" },
        { text: "おつかれさまです。最近入った方ですよね？", next: "w2b", tone: "good", skill: "topic", note: "相手自身に関心を向けた質問。初対面に近い相手には特に効く。" },
      ],
    },
    w1c: {
      context: "会話が止まった。相手はお茶を飲んでいる。沈黙のあとに、もう一度話しかけるのも練習。",
      choices: [
        { text: "あの、最近入った方ですよね？", next: "w2b", tone: "good", skill: "silence", note: "沈黙のあとでも、話しかければ会話は戻る。" },
        { text: "昼、すごい混んでましたね", next: "w2", tone: "good", skill: "silence", note: "さっきの話題に戻るのも、自然な立て直し方。" },
        { text: "(スマホを見て休憩を過ごす)", next: "wQuiet", tone: "closed", note: "休憩は休むための時間でもある。今日はここまででも大丈夫。" },
      ],
    },
    w2: {
      says: "ですよね。レジ、ずっと並んでて焦りました。",
      choices: [
        { text: "焦りますよね。私も最初のころ、お釣りまちがえたことあります", next: "w3", tone: "good", skill: "disclosure", note: "小さな失敗談の自己開示。相手は安心し、距離が縮まりやすい。" },
        { text: "大変でしたね", next: "w3", tone: "ok", skill: "reflect", note: "気持ちを受けとめるのはよい。自分の体験や質問を一言足すと、会話が続く。" },
        { text: "でもレジのほうが楽じゃないですか？", next: "w2r", tone: "closed", note: "相手の大変さを打ち消す返しは、悪気がなくても「わかってもらえない」と感じさせやすい。" },
      ],
    },
    w2r: {
      context: "相手が少し困った顔をした。言い直しても大丈夫。",
      says: "うーん…人によるかもですね(笑)。",
      choices: [
        { text: "たしかに。焦っちゃうの、わかります", next: "w3", tone: "good", skill: "reflect", note: "言い直しは気まずさを増やさない。むしろ相手を気づかう姿勢が伝わる。" },
        { text: "(話題を変えて)休憩って何分でしたっけ？", next: "w4b", tone: "ok", note: "話題を変えるのも一つの手。次は、相手の気持ちを一言受けてから変えてみましょう。" },
      ],
    },
    w2b: {
      says: "はい、先月からです。まだ全然慣れなくて。",
      choices: [
        { text: "最初は覚えること多いですよね。何か困ってることあります？", next: "w3", tone: "good", skill: "reflect", note: "気持ちを受けとめてから、相手の役に立つ質問をしている。" },
        { text: "そうなんですね", next: "w3", tone: "ok", skill: "aizuchi", note: "あいづちとしてはよい。もう一言あると、相手も話しやすい。" },
        { text: "先月からなんですね。前も何かバイトしてたんですか？", next: "w3", tone: "good", skill: "followup", note: "相手の話を受けた質問(深掘り質問)。" },
      ],
    },
    w3: {
      says: "ありがとうございます(笑)。…あ、休みの日とか、何してるんですか？",
      choices: [
        { text: "最近は、近所のカフェを開拓してます。そちらは？", next: "w4", tone: "good", skill: "disclosure", note: "具体的な一つを答えて、聞き返している。会話が往復になる。" },
        { text: "特に何も…", next: "w4b", tone: "closed", note: "「何もない」と返すと話が止まりやすい。小さなことで大丈夫。「寝てます(笑)」でも、一言足せば続く。" },
        { text: "寝てばっかりです(笑)。何かおすすめあります？", next: "w4", tone: "good", skill: "disclosure", note: "大したことでなくても、正直に言って質問を返せば十分に続く。" },
      ],
    },
    w4: {
      says: "私は最近、ずっとゲームしてます。",
      choices: [
        { text: "何のゲームですか？", next: "w5", tone: "good", skill: "followup", note: "相手の話を受けた質問。好きなことの話は、相手も話しやすい。" },
        { text: "ゲームかあ", next: "w5", tone: "ok", skill: "aizuchi", note: "受けとめてはいる。質問を一つ足すと、相手が話を広げやすい。" },
        { text: "へえ。私はゲームはあまりやらないですね", next: "w5", tone: "ok", skill: "disclosure", note: "自分は違うと伝えるのは悪くない。「でも、どんなのが面白いんですか？」と足すと続く。" },
      ],
    },
    w4b: {
      says: "あ、わかります。休みの日って一瞬で終わりますよね。",
      choices: [
        { text: "ほんとに。気づいたら夕方です(笑)", next: "w5", tone: "good", skill: "disclosure", note: "相手の話に乗って、自分の体験を返している。" },
        { text: "ですね", next: "w5", tone: "ok", skill: "aizuchi", note: "自然な返事。余裕があれば、一言足してみましょう。" },
      ],
    },
    w5: {
      context: "休憩の終わりが近づいてきた。",
      says: "あ、もうこんな時間。",
      choices: [
        { text: "話せてよかったです。またシフト一緒のとき、よろしくお願いします", next: "wGood", tone: "good", skill: "ending", note: "次につながる終わり方。次に会ったときも話しかけやすくなる。" },
        { text: "ですね、戻りましょうか", next: "wOk", tone: "ok", note: "自然な終わり方。" },
        { text: "(黙って立ち上がる)", next: "wOk", tone: "closed", note: "これでも失礼ではない。一言添えると、次に会ったときに話しやすい。" },
      ],
    },
    wGood: { says: "こちらこそ。また話しましょう。", end: true },
    wOk: { context: "休憩が終わった。最初の会話はここまで。", end: true },
    wQuiet: { context: "静かに休憩を過ごした。それも一つの選択。", end: true },
  },
};

const circleScript: Script = {
  id: "circle-first",
  scene: "circle",
  title: "サークルの集まりで初対面",
  setting: "写真サークルの集まり。何人かで話している輪の横にいたら、先輩が気づいて話を振ってくれた。",
  partner: "サークルの先輩",
  voice: { pitch: 1.15, rate: 1.1 },
  start: "c1",
  nodes: {
    c1: {
      says: "あ、はじめまして！ 新しく来た人ですよね？",
      choices: [
        { text: "はじめまして。2 年です。今日初めて来ました", next: "c2", tone: "good", skill: "disclosure", note: "学年や「初めて」を一言添えると、相手が次の質問をしやすい。" },
        { text: "あ、はい…", next: "c2", tone: "closed", note: "緊張すると短くなりがち。学年など一言足すと、相手が話を広げやすい。" },
        { text: "はじめまして。今日初めてなんですけど、みなさん仲いいですね", next: "c2b", tone: "good", skill: "topic", note: "その場で見えたことを話題にしている。初対面の切り出しとして自然。" },
      ],
    },
    c2: {
      says: "そうなんだ！ なんでこのサークル、気になったの？",
      choices: [
        { text: "前から写真を撮るのが好きで。スマホでですけど(笑)", next: "c3", tone: "good", skill: "disclosure", note: "理由を一つ、正直に言っている。相手が乗りやすい。" },
        { text: "なんとなくです", next: "c3c", tone: "closed", note: "「なんとなく」で止まると、相手は次の質問を探すことになる。小さな理由を一つ添えると続く。" },
        { text: "友だちに誘われて。…先輩はいつから入ってるんですか？", next: "c3b", tone: "good", note: "答えてから聞き返している。会話が往復になる。" },
      ],
    },
    c2b: {
      says: "ありがとう(笑)。わりとゆるい感じだよ。写真は撮るの？",
      choices: [
        { text: "スマホばっかりですけど、旅行先で撮るのが好きです", next: "c3", tone: "good", skill: "disclosure", note: "具体的に一つ言うと、相手が質問しやすい。" },
        { text: "あんまり撮らないです", next: "c3c", tone: "ok", note: "正直でよい。「でも興味はあって」など、一言足すと続く。" },
        { text: "少しだけ。みなさんはカメラ持ってるんですか？", next: "c3b", tone: "good", note: "答えてから、相手側のことを聞いている。" },
      ],
    },
    c3c: {
      context: "相手が次の話題を探して、少し間があいた。",
      says: "そっかそっか。",
      choices: [
        { text: "あの、みなさん普段はどこで撮ってるんですか？", next: "c4", tone: "good", skill: "silence", note: "間があいても、質問一つで会話は戻る。" },
        { text: "すみません、緊張してて(笑)", next: "c3n", tone: "good", skill: "disclosure", note: "緊張していると言葉にすると、多くの場合相手は親しみを感じ、場がやわらぐ。緊張を隠すより楽になることが多い。" },
        { text: "(黙ってうなずく)", next: "c5", tone: "closed", note: "これでも大丈夫。次は、質問を一つだけ用意しておくと楽になる。" },
      ],
    },
    c3n: {
      says: "わかる！ 最初はみんなそうだよ。私もそうだった。",
      choices: [
        { text: "そう言ってもらえると、ほっとします", next: "c4", tone: "good", skill: "reflect", note: "相手の気づかいを受けとめている。" },
        { text: "先輩もですか？ 意外です", next: "c4", tone: "good", skill: "followup", note: "相手の話に関心を向けている。" },
      ],
    },
    c3: {
      says: "スマホでも全然いいよ！ 最近どんなの撮った？",
      choices: [
        { text: "この前、夕焼けがきれいで撮りました。見ます？", next: "c4", tone: "good", skill: "disclosure", note: "具体的な一つを見せようとしている。話が一気に広がる。" },
        { text: "えっと、ごはんとか…(笑)", next: "c4", tone: "good", skill: "disclosure", note: "照れて小さく言っても大丈夫。具体的に一つ言えば、相手は乗りやすい。" },
        { text: "大したものは撮ってないです", next: "c4", tone: "closed", note: "謙遜しすぎると話が閉じやすい。「大したものじゃないですけど、〜」と続けると開く。" },
      ],
    },
    c3b: {
      says: "私は 1 年の春から。最初はカメラも持ってなかったよ。",
      choices: [
        { text: "そうなんですか！ どうやって覚えたんですか？", next: "c4", tone: "good", skill: "followup", note: "相手の話を受けた質問(深掘り質問)。" },
        { text: "へえ", next: "c4", tone: "closed", note: "あいづちだけだと、相手は話を広げにくい。" },
        { text: "安心しました。私も持ってないので", next: "c4", tone: "good", skill: "disclosure", note: "共通点を見つけて返している。共通点は距離を縮める。" },
      ],
    },
    c4: {
      says: "今度の土曜、みんなで川沿いに撮りに行くんだけど、来る？",
      choices: [
        { text: "行ってみたいです。何時ごろですか？", next: "c5", tone: "good", note: "前向きな返事に質問を添えている。" },
        { text: "考えておきます", next: "c5", tone: "ok", note: "即答しなくても大丈夫。「予定を見て連絡します」など、次につながる言い方もある。" },
        { text: "初心者でも大丈夫ですか？", next: "c5", tone: "good", skill: "disclosure", note: "不安を言葉にして確かめている。聞けば、たいてい安心できる答えが返ってくる。" },
      ],
    },
    c5: {
      context: "別の人が先輩を呼んでいる。",
      says: "あ、ちょっと呼ばれたから行くね。",
      choices: [
        { text: "はい！ 話しかけてくれて、ありがとうございました", next: "cGood", tone: "good", skill: "ending", note: "感謝で終えると、相手の印象に残りやすい。" },
        { text: "あ、はい", next: "cOk", tone: "ok", note: "自然な終わり方。" },
      ],
    },
    cGood: { says: "こちらこそ！ また話そうね。", end: true },
    cOk: { context: "先輩は別の輪に移っていった。最初の会話はここまで。", end: true },
  },
};

const aboutStylist: ScriptChoice[] = [
  { text: "サウナいいですね！ よく行くところあるんですか？", next: "s4", tone: "good", skill: "followup", note: "相手の話を受けた質問。好きなことの話は、相手も楽しく話せる。" },
  { text: "へえ", next: "s4", tone: "closed", note: "あいづちだけでも失礼ではない。質問を一つ足すと、相手は話を広げやすい。" },
  { text: "サウナってそんなにいいんですか？ 行ったことなくて", next: "s4", tone: "good", skill: "disclosure", note: "知らないことを素直に聞くと、相手は教える側になって話しやすい。" },
];

const shopScript: Script = {
  id: "shop-salon",
  scene: "shop",
  title: "美容院で",
  setting: "美容院でカットの途中。美容師さんが話しかけてきた。",
  partner: "美容師さん",
  voice: { pitch: 1.05, rate: 1.0 },
  start: "s1",
  nodes: {
    s1: {
      says: "今日はこのあと、お出かけですか？",
      choices: [
        { text: "いえ、このまま帰ります。ゆっくりしようかなと", next: "s2", tone: "good", skill: "disclosure", note: "答えに一言添えている。相手が次を聞きやすい。" },
        { text: "いえ", next: "s2c", tone: "closed", note: "短い返事でも失礼ではない。話したくない日はそれで十分。話す練習をしたいなら、一言足してみましょう。" },
        { text: "はい、ちょっと友だちと会うんです", next: "s2b", tone: "good", skill: "disclosure", note: "予定を少し話している。相手が話を広げやすい。" },
      ],
    },
    s2: {
      says: "いいですね。お休みの日は、いつも何されてるんですか？",
      choices: [
        { text: "最近は料理にはまってます", next: "s3", tone: "good", skill: "disclosure", note: "具体的な一つを答えている。" },
        { text: "家でだらだらしてます(笑)", next: "s3", tone: "ok", skill: "disclosure", note: "正直でよい。「美容師さんは？」と聞き返すと、会話が往復になる。" },
        { text: "特に何も", next: "s2c", tone: "closed", note: "話が止まりやすい返事。小さなことでいいので一つ言うと続く。" },
      ],
    },
    s2b: {
      says: "いいですね！ どこか行かれるんですか？",
      choices: [
        { text: "駅前のカフェに行く予定です。最近できたところで", next: "s3", tone: "good", skill: "disclosure", note: "具体的に話している。" },
        { text: "まだ決めてないです(笑)。美容師さんは、休みの日どこ行かれるんですか？", next: "s3b", tone: "good", note: "答えてから聞き返している。" },
        { text: "ちょっと…", next: "s2c", tone: "closed", note: "言いたくないことは言わなくてよい。その場合は、相手のことを聞く方向に変えると話が続く。" },
      ],
    },
    s2c: {
      context: "美容師さんが作業に集中し始めた。話さなくても失礼ではない。話してみたいなら、相手のことを聞いてみるのも一つ。",
      choices: [
        { text: "(話さずに過ごす)", next: "sQuiet", tone: "ok", note: "美容院で静かに過ごすのは普通のこと。自分で選べたなら十分。" },
        { text: "美容師さんは、お休みの日何されてるんですか？", next: "s3b", tone: "good", skill: "topic", note: "沈黙のあと、相手に関心を向けた質問で会話を始めている。" },
      ],
    },
    s3: { says: "いいですね。私は最近、休みの日はもっぱらサウナなんですよ(笑)。", choices: aboutStylist },
    s3b: { says: "私ですか？ 最近はもっぱらサウナです(笑)。", choices: aboutStylist },
    s4: {
      says: "近所の銭湯にサウナがあって、週 2 で行ってます。",
      choices: [
        { text: "週 2！ 整うってやつですか？", next: "s5", tone: "good", skill: "followup", note: "相手の話をさらに聞いている。" },
        { text: "すごいですね", next: "s5", tone: "ok", skill: "aizuchi", note: "あいづちとしてはよい。" },
        { text: "私は暑いのが苦手なんです", next: "s5", tone: "ok", skill: "disclosure", note: "自分は違うと伝えるのは悪くない。「でも気になります」と添えると、話が続く。" },
      ],
    },
    s5: {
      context: "カットが終わりに近づいた。",
      says: "はい、こんな感じでどうでしょう。後ろも見てみてください。",
      choices: [
        { text: "ありがとうございます。いい感じです。前髪だけ、もう少し短くしてもらえますか？", next: "s6", tone: "good", note: "遠慮して言えないことの多い場面。希望は、感謝と一緒に伝えれば失礼ではない。" },
        { text: "大丈夫です", next: "sEnd", tone: "ok", note: "満足ならそれで OK。気になる所があるのに言えないなら、ここが練習の場面。" },
      ],
    },
    s6: {
      says: "前髪ですね、了解です！",
      choices: [{ text: "ありがとうございます", next: "sEnd", tone: "good", skill: "ending", note: "頼んだあとに感謝で返すと、気持ちよく終わる。" }],
    },
    sEnd: { says: "ありがとうございました。またお待ちしてます。", end: true },
    sQuiet: { context: "静かに過ごして、カットが終わった。", end: true },
  },
};

const officeAsk: Script = {
  id: "office-ask",
  scene: "office",
  title: "わからないことを聞いて、報告する",
  setting: "バイト先で、新しい作業を任された。やり方の途中がわからず、手が止まっている。近くに先輩がいる。",
  partner: "バイトの先輩",
  voice: { pitch: 0.95, rate: 1.05 },
  start: "o1",
  nodes: {
    o1: {
      context: "15 分ほど手が止まっている。先輩は少し忙しそう。",
      choices: [
        { text: "すみません、いま少しいいですか？ 棚の補充、在庫表の見方がわからなくて", next: "o2", tone: "good", skill: "askhelp", note: "相手の都合を一言聞いてから、何がわからないかを具体的に言っている。" },
        { text: "(もう少し自分で考える)", next: "o1c", tone: "closed", note: "自分で考えるのは大切。ただ、決めた時間を過ぎたら聞くほうが、自分にも相手にも早い。" },
        { text: "すみません…全然わからないんですけど", next: "o2b", tone: "ok", skill: "askhelp", note: "聞けたのはよい。どこがわからないかを添えると、相手は短く答えられる。" },
      ],
    },
    o1c: {
      context: "さらに 10 分たった。先輩がこちらに気づいた。",
      says: "あれ、まだそこやってる？ 何か困ってる？",
      choices: [
        { text: "はい、実は在庫表の見方がわからなくて止まってました", next: "o2", tone: "good", skill: "askhelp", note: "聞かれたときに正直に言えれば十分。次は自分から声をかけてみましょう。" },
        { text: "いえ、大丈夫です", next: "o1x", tone: "closed", note: "大丈夫でないときの「大丈夫です」は、問題を先送りにしやすい。" },
      ],
    },
    o1x: {
      says: "そう？ わからなかったら、いつでも聞いてね。",
      choices: [
        { text: "あ、やっぱり一ついいですか？ 在庫表の見方なんですけど", next: "o2", tone: "good", skill: "askhelp", note: "一度断ってからでも、言い直せる。相手はたいてい気にしていない。" },
        { text: "はい、ありがとうございます", next: "oEndQuiet", tone: "closed", note: "今日はここまで。次は「どこまでできたか」を一言にまとめてから声をかけてみましょう。" },
      ],
    },
    o2: {
      says: "ああ、これね。この列が今ある数で、こっちが補充する数。わかりにくいよね。",
      choices: [
        { text: "なるほど、こっちが補充する数なんですね。ありがとうございます", next: "o3", tone: "good", skill: "reflect", note: "聞いた内容を短く言い直すと、理解が合っているか確かめられる。" },
        { text: "はい", next: "o3", tone: "ok", note: "返事としては十分。わかったことを一言くり返すと、行き違いを防げる。" },
      ],
    },
    o2b: {
      says: "どのへんがわからない？",
      choices: [
        { text: "在庫表の、どの数を見ればいいかがわからなくて", next: "o2", tone: "good", skill: "askhelp", note: "わからない場所が具体的になった。" },
        { text: "えっと…全部です", next: "o2", tone: "ok", note: "本当に全部なら、それでもよい。相手が順に説明してくれる。" },
      ],
    },
    o3: {
      context: "30 分後、補充が終わった。先輩はレジにいる。",
      choices: [
        { text: "棚の補充終わりました。一つだけ、洗剤の在庫が足りなかったです", next: "o4", tone: "good", skill: "askhelp", note: "結論が先、気になる点が後。相手が一言で判断できる。" },
        { text: "(言わずに次の作業に移る)", next: "o3c", tone: "closed", note: "終わったことを伝えないと、相手は確認しに来ることになる。" },
        { text: "えっと、さっきの補充なんですけど、最初に飲み物の棚をやって、それから…", next: "o4", tone: "ok", note: "経緯から話すと長くなる。「終わりました」を先に言うと伝わりやすい。" },
      ],
    },
    o3c: {
      says: "あ、補充どうなった？",
      choices: [
        { text: "終わりました。洗剤だけ在庫が足りなかったです", next: "o4", tone: "good", skill: "askhelp", note: "聞かれてからでも、結論から答えられれば十分。" },
      ],
    },
    o4: {
      says: "ありがとう、助かった。洗剤は明日入るから大丈夫。",
      choices: [
        { text: "わかりました。在庫表の見方、教えてもらえて助かりました", next: "oEnd", tone: "good", skill: "ending", note: "具体的にお礼を言うと、次も聞きやすい関係になる。" },
        { text: "はい", next: "oEnd", tone: "ok", note: "自然な終わり方。" },
      ],
    },
    oEnd: { says: "また何かあったら聞いてね。", end: true },
    oEndQuiet: { context: "わからないまま作業を続けた。次は 15 分で声をかけると決めておくと楽になる。", end: true },
  },
};

const officeMistake: Script = {
  id: "office-mistake",
  scene: "office",
  title: "ミスを伝える",
  setting: "バイト先で、予約の時間を一つ間違えて伝えていたことに気づいた。店長は事務所にいる。",
  partner: "店長",
  voice: { pitch: 0.9, rate: 1.0 },
  start: "m1",
  nodes: {
    m1: {
      context: "気づいたのは 5 分前。まだお客さんは来ていない。",
      choices: [
        { text: "店長、すみません。14 時の予約を、お客さんに 15 時と伝えてしまいました", next: "m2", tone: "good", skill: "askhelp", note: "事実を先に、短く伝えている。早いほど打てる手が多い。" },
        { text: "(お客さんが来るまで様子を見る)", next: "m1c", tone: "closed", note: "様子を見るほど、打てる手は減っていく。" },
        { text: "あの、本当にすみません、私いつもこういうことしてしまって…", next: "m2b", tone: "ok", note: "謝る気持ちは伝わる。ただ、相手が最初に知りたいのは何が起きたか。" },
      ],
    },
    m1c: {
      context: "15 分後。お客さんから「何時でしたっけ？」と電話があったと、店長が言いに来た。",
      says: "さっき予約のお客さんから電話があったんだけど、時間がずれてるみたいで。何か知ってる？",
      choices: [
        { text: "すみません、私が 15 時と伝えてしまっていました", next: "m2", tone: "good", skill: "askhelp", note: "聞かれたときに事実を言えれば、立て直せる。" },
        { text: "えっ、どうしてでしょう…", next: "m1x", tone: "closed", note: "知っていることを言わないと、相手が原因を探すことになる。" },
      ],
    },
    m1x: {
      context: "店長が予約表を見ている。いまからでも言える。",
      choices: [
        { text: "…すみません、実は私が時間を間違えて伝えていました", next: "m2", tone: "good", skill: "askhelp", note: "少し遅れても、自分から言い直せたことは大きい。" },
      ],
    },
    m2: {
      says: "そっか、教えてくれてありがとう。どうしようか。",
      choices: [
        { text: "いまからお客さんに電話して、14 時で大丈夫か確認しましょうか", next: "m3", tone: "good", skill: "askhelp", note: "対応案を添えると、相手は判断しやすい。" },
        { text: "どうしたらいいでしょう…", next: "m3b", tone: "ok", note: "相談するのはよい。自分の案を一つ添えられるとなおよい。" },
      ],
    },
    m2b: {
      says: "まあまあ、落ち着いて。何があったの？",
      choices: [
        { text: "14 時の予約を、お客さんに 15 時と伝えてしまいました", next: "m2", tone: "good", skill: "askhelp", note: "事実が伝わった。ここから一緒に考えられる。" },
      ],
    },
    m3b: {
      says: "お客さんに電話して、どっちの時間がいいか聞いてみてくれる？",
      choices: [
        { text: "わかりました、すぐ電話します", next: "m3", tone: "good", note: "指示を受けて、すぐ動いている。" },
      ],
    },
    m3: {
      context: "電話したら、お客さんは 15 時のほうが都合がいいとのこと。15 時の枠は空いていた。",
      choices: [
        { text: "お客さん、15 時でいいそうです。予約表を直しておきました", next: "m4", tone: "good", skill: "askhelp", note: "結果を結論から報告している。" },
        { text: "(予約表だけ直しておく)", next: "m4b", tone: "ok", note: "直したことも伝えておくと、相手は安心できる。" },
      ],
    },
    m4b: {
      says: "さっきの件、どうなった？",
      choices: [{ text: "15 時で大丈夫だそうで、予約表も直しました", next: "m4", tone: "good", skill: "askhelp", note: "聞かれてからでも、結論から答えられた。" }],
    },
    m4: {
      says: "了解、ありがとう。早めに言ってくれて助かったよ。",
      choices: [
        { text: "すみませんでした。次から、予約は復唱して確認します", next: "mEnd", tone: "good", note: "次にどうするかを一言添えると、話がきれいに終わる。" },
        { text: "本当にすみません…", next: "mEnd", tone: "ok", note: "謝るのは自然。何度も謝るより、次の工夫を一つ言うほうが相手も安心する。" },
      ],
    },
    mEnd: { says: "うん、よろしくね。", end: true },
  },
};

const assertDecline: Script = {
  id: "assert-decline",
  scene: "assert",
  title: "誘いを断る",
  setting: "授業のあと、同じゼミの人から週末のカラオケに誘われた。疲れていて、今回は行きたくない。",
  partner: "ゼミの友人",
  voice: { pitch: 1.1, rate: 1.1 },
  start: "d1",
  nodes: {
    d1: {
      says: "ねえ、土曜にみんなでカラオケ行くんだけど、来ない？",
      choices: [
        { text: "誘ってくれてありがとう。今回はやめておくね", next: "d2", tone: "good", skill: "decline", note: "感謝と結論を先に。理由は言わなくても失礼ではない。" },
        { text: "あー、土曜か…どうだろう…", next: "d1c", tone: "closed", note: "あいまいにすると、相手は返事を待ち続けることになる。" },
        { text: "うん、行く行く(本当は行きたくない)", next: "d1y", tone: "closed", note: "断るのを避けるのは安全行動の一つ。断られた側は、断る側が思うより気にしていないことが多い。" },
      ],
    },
    d1c: {
      says: "まだわからない感じ？ 決まったら教えて！",
      choices: [
        { text: "ごめん、やっぱり今回はやめておくね。誘ってくれてありがとう", next: "d2", tone: "good", skill: "decline", note: "迷ったあとでも、はっきり言い直せた。" },
        { text: "うん、また連絡するね", next: "d1y", tone: "ok", note: "あとで断るのも一つ。その場で言えると、あとで気にする時間が減る。" },
      ],
    },
    d1y: {
      context: "その日の夜、まだ気が重い。いまからでも連絡はできる。",
      choices: [
        { text: "(メッセージで)土曜なんだけど、ごめん、今回はやめておくね。誘ってくれてありがとう", next: "d2", tone: "good", skill: "decline", note: "あとからでも断れる。早めに伝えるほど、相手も予定を立てやすい。" },
        { text: "(そのまま行く)", next: "dEndGo", tone: "ok", note: "行ってみたら楽しいこともある。ただ、毎回無理をしていたら、断る実験をしてみる価値がある。" },
      ],
    },
    d2: {
      says: "そっかー、残念。何か予定あるの？",
      choices: [
        { text: "ちょっと最近疲れてて、週末はゆっくりしたくて", next: "d3", tone: "good", skill: "decline", note: "正直で短い理由。言いわけを作り込まなくてよい。" },
        { text: "うん、ちょっとね", next: "d3", tone: "ok", skill: "decline", note: "言いたくなければ、詳しく話さなくてよい。" },
        { text: "えっと、親戚が来るかもしれなくて、それにバイトも入るかもで…", next: "d3", tone: "closed", note: "理由を重ねるほど話が長くなり、断りにくくなる。" },
      ],
    },
    d3: {
      says: "そっか、了解！ また次の機会にね。",
      choices: [
        { text: "うん、また誘って。今度ごはんとかなら行きたいな", next: "dEnd", tone: "good", skill: "decline", note: "代わりの案を添えると、関係が続く。行きたくないときは、無理に案を出さなくてよい。" },
        { text: "うん、ありがとう", next: "dEnd", tone: "good", note: "これで十分。相手は思っているより気にしていない。" },
      ],
    },
    dEnd: { says: "うん、またね！", end: true },
    dEndGo: { context: "土曜はカラオケに行った。次に誘われたときは、断る練習の機会にしてもよい。", end: true },
  },
};

const assertRequest: Script = {
  id: "assert-request",
  scene: "assert",
  title: "グループ課題で頼む",
  setting: "グループ課題の締め切りが来週。スライドが 1 枚、まだ誰の担当にもなっていない。メンバーの一人と話す。",
  partner: "グループのメンバー",
  voice: { pitch: 1.0, rate: 1.05 },
  start: "r1",
  nodes: {
    r1: {
      context: "相手は、そのスライドの内容を調べてくれた人。",
      choices: [
        { text: "〇〇さん、まとめの前のスライド 1 枚、木曜までにお願いできますか？ 調べてくれた内容なので", next: "r2", tone: "good", skill: "request", note: "何を・いつまでに・なぜ、が入っている。相手は判断しやすい。" },
        { text: "あの…もしよかったらでいいんですけど、手が空いてたら…", next: "r2b", tone: "ok", note: "遠慮が伝わるのはよい。ただ、何を頼んでいるかが相手にわからない。" },
        { text: "(自分で全部作る)", next: "r1c", tone: "closed", note: "頼むのを避けるのは安全行動の一つ。頼まれた側は、頼む側が思うより引き受けてくれやすい。" },
      ],
    },
    r1c: {
      context: "その夜、ほかの作業もあって間に合いそうにない。",
      choices: [
        { text: "(メッセージで)ごめん、スライド 1 枚お願いできないかな。木曜までだと助かる", next: "r2", tone: "good", skill: "request", note: "一度ためらっても、頼み直せる。" },
        { text: "(徹夜で仕上げる)", next: "rEndAlone", tone: "closed", note: "今回は乗り切れても、毎回は続かない。次は早めに頼む実験をしてみましょう。" },
      ],
    },
    r2b: {
      says: "うん、いいよ。何をすればいい？",
      choices: [
        { text: "まとめの前のスライドを 1 枚、木曜までにお願いしたくて", next: "r2", tone: "good", skill: "request", note: "具体的になった。相手は引き受けやすい。" },
      ],
    },
    r2: {
      says: "木曜かあ…水曜まで別の課題があって、ちょっときついかも。",
      choices: [
        { text: "そっか。じゃあ金曜の朝まででも大丈夫？", next: "r3", tone: "good", skill: "request", note: "相手の事情を受けて、条件を調整している。" },
        { text: "あ、じゃあ大丈夫です、自分でやります", next: "r2x", tone: "closed", note: "すぐ引っ込めると、相手が提案する余地もなくなる。" },
        { text: "でも、みんなやってるので…", next: "r3b", tone: "closed", note: "押しつけると、引き受けてもらえても関係がぎくしゃくしやすい。" },
      ],
    },
    r2x: {
      says: "え、いいの？ 金曜の朝までならできるよ。",
      choices: [
        { text: "本当？ じゃあ金曜の朝までにお願いしたい", next: "r3", tone: "good", skill: "request", note: "相手からの提案を受けられた。頼みごとは、話しながら決めればよい。" },
      ],
    },
    r3b: {
      says: "うーん…まあ、なんとかやってみる。",
      context: "相手の声が少し硬い。",
      choices: [
        { text: "ごめん、急かしたね。金曜の朝まででも大丈夫だよ", next: "r3", tone: "good", skill: "request", note: "言い直せば、関係は戻せる。" },
      ],
    },
    r3: {
      says: "それなら大丈夫。調べたやつまとめるね。",
      choices: [
        { text: "ありがとう、助かる！ 何か手伝えることがあったら言ってね", next: "rEnd", tone: "good", skill: "ending", note: "感謝と、こちらからも手を貸す一言。頼み合える関係になる。" },
        { text: "ありがとうございます", next: "rEnd", tone: "good", note: "感謝を伝えられれば十分。" },
      ],
    },
    rEnd: { says: "うん、こちらこそ。", end: true },
    rEndAlone: { context: "一人で仕上げた。次は締め切りの 1 週間前に、1 つだけ頼んでみましょう。", end: true },
  },
};

export const SCRIPTS: Script[] = [classScript, workScript, circleScript, shopScript, officeAsk, officeMistake, assertDecline, assertRequest];

export const scriptById = (id: string) => SCRIPTS.find((s) => s.id === id);
