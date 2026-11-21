export interface DrillOption {
  text: string;
  good: boolean;
  feedback: string;
}

export interface DrillItem {
  id: string;
  /** 相手の発言や状況 */
  prompt: string;
  options: DrillOption[];
}

export interface Drill {
  id: string;
  title: string;
  /** なぜ効くのか(1–2 文) */
  why: string;
  /** 根拠となる文献(著者・年) */
  refs: string[];
  /** 現実で試すときの合言葉 */
  rule: string;
  items: DrillItem[];
}

export const DRILLS: Drill[] = [
  {
    id: "followup",
    title: "深掘り質問",
    why: "話題を変える質問より、相手の直前の話を受けた質問のほうが「ちゃんと聞いてくれている」と感じられ、好かれやすい。話し手本人はこの効果を低く見積もりがち。",
    refs: ["Huang et al. (2017) J. Personality and Social Psychology"],
    rule: "話題を変える前に、直前の話から 2 回続けて聞く",
    items: [
      {
        id: "f1",
        prompt: "相手「週末、久しぶりに山に登ってきたんですよ」",
        options: [
          { text: "どこの山に行ったんですか？", good: true, feedback: "直前の話を受けた質問。相手は続きを話しやすい。" },
          { text: "そうなんですね。ところで仕事は忙しいですか？", good: false, feedback: "話題を変える質問。山の話を聞いてもらえなかったと感じさせやすい。" },
          { text: "私は先週カラオケに行きました", good: false, feedback: "すぐ自分の話に移ると、相手の話が置き去りになる。まず 1–2 回聞いてから。" },
        ],
      },
      {
        id: "f2",
        prompt: "相手「最近、パンを焼くのにはまってて」",
        options: [
          { text: "へえ、何がきっかけで始めたんですか？", good: true, feedback: "きっかけを聞くと、相手の価値観や人柄に半歩近づける。" },
          { text: "パンいいですね", good: false, feedback: "悪くはないが、相手が次を探す必要がある。質問を一つ足すと続く。" },
          { text: "うまく焼けたやつ、どんなのでした？", good: true, feedback: "具体的な場面を聞く質問。相手は楽しく話しやすい。" },
        ],
      },
      {
        id: "f3",
        prompt: "相手「昨日は徹夜でレポート書いてました…」",
        options: [
          { text: "うわ、大変でしたね。何のレポートだったんですか？", good: true, feedback: "気持ちを受け止めてから、中身を聞いている。" },
          { text: "計画的にやらないとですね", good: false, feedback: "助言や評価は、初対面や雑談では説教に聞こえやすい。" },
          { text: "終わりました？", good: true, feedback: "短くても直前の話を受けた質問。十分に効く。" },
        ],
      },
      {
        id: "f4",
        prompt: "あなたが「どこの山に？」と聞き、相手「高尾山です。人が多くて」と返した。2 回目の質問は？",
        options: [
          { text: "人が多いの意外です。何時ごろ行ったんですか？", good: true, feedback: "相手の言葉(人が多い)を拾って続けている。" },
          { text: "高尾山いいですね。ほかに趣味はありますか？", good: false, feedback: "2 回目で話題を変えている。もう 1 回だけ同じ話を続けよう。" },
          { text: "頂上で何か食べました？", good: true, feedback: "場面を広げる質問。答えやすい。" },
        ],
      },
    ],
  },
  {
    id: "reflect",
    title: "気持ちの言い換え",
    why: "話の要点と気持ちを短く言い換えると「理解された」と感じられ、関係の質が上がる。オウム返しを機械的に繰り返すと不自然になる。",
    refs: ["Weger et al. (2014) Int. J. of Listening", "Kluger et al. (2024) J. of Business and Psychology"],
    rule: "会話中に 1–2 回、「つまり〜で〇〇だったんですね」",
    items: [
      {
        id: "r1",
        prompt: "相手「バイト先で急にシフト増やされて、テストもあるのに…」",
        options: [
          { text: "テスト前に増えるのはきついですね", good: true, feedback: "状況と気持ちを短くまとめている。" },
          { text: "断ればいいんですよ", good: false, feedback: "すぐの助言は「わかってもらえない」と感じさせやすい。まず受け止める。" },
          { text: "シフト増やされて、テストもあるんですね", good: false, feedback: "言葉を並べ直しただけのオウム返し。気持ち(大変さ)を一言足すと伝わる。" },
        ],
      },
      {
        id: "r2",
        prompt: "相手「やっと内定もらえたんです！」",
        options: [
          { text: "おめでとうございます！ほっとしましたね", good: true, feedback: "うれしい話も気持ちを言葉にすると喜びが深まる。" },
          { text: "どこの会社ですか？", good: false, feedback: "悪くはないが、先に喜びを受け止めると距離が縮まる。" },
          { text: "私もまだなんですよね", good: false, feedback: "相手の喜びの瞬間に自分の話へ移っている。" },
        ],
      },
      {
        id: "r3",
        prompt: "相手「引っ越してきたばかりで、まだ知り合いがいなくて」",
        options: [
          { text: "新しい場所で一人だと、ちょっと心細いですよね", good: true, feedback: "気持ちを推測して言葉にしている。外れても相手が訂正してくれる。" },
          { text: "すぐできますよ", good: false, feedback: "励ましのつもりでも、気持ちを飛ばしている。" },
        ],
      },
    ],
  },
  {
    id: "ending",
    title: "会話の締め方",
    why: "会話が双方の望むタイミングで終わることはほとんどなく、相手がいつ終わりたいかを当てるのも難しい。締め方の型を持っておくと、気まずさなく自分から終えられる。",
    refs: ["Mastroianni et al. (2021) PNAS"],
    rule: "盛り上がった直後に「要約 + 区切り + 次につなぐ一言」",
    items: [
      {
        id: "e1",
        prompt: "休憩中、5 分ほど話して少し盛り上がった。戻りたい。",
        options: [
          { text: "山の話、おもしろかったです。そろそろ戻りますね、また聞かせてください", good: true, feedback: "要約 + 区切り + 次につなぐ一言がそろっている。" },
          { text: "(黙ってスマホを見始める)", good: false, feedback: "相手は「何か悪いことを言ったか」と受け取りやすい。" },
          { text: "あ、じゃあ…", good: false, feedback: "区切りだけだと唐突。楽しかった点を一言足すと印象が変わる。" },
        ],
      },
      {
        id: "e2",
        prompt: "話が途切れがちになってきた。",
        options: [
          { text: "今日は話せてよかったです。また〇〇の話、聞かせてください", good: true, feedback: "途切れてきたときこそ、前向きに締めると印象がよく残る。" },
          { text: "(沈黙を埋めようと無理に話題を探し続ける)", good: false, feedback: "安全行動になりやすい。締めてよい場面もある。" },
        ],
      },
      {
        id: "e3",
        prompt: "交流会で初対面の人と話した。別の人とも話したい。",
        options: [
          { text: "お話しできてよかったです。ほかの方にもあいさつしてきますね", good: true, feedback: "交流会では普通の締め方。相手も同じことを考えていることが多い。" },
          { text: "すみません、ちょっとトイレに…", good: false, feedback: "使ってもよいが、毎回の口実は本人の負担になる。正直な締め方で十分通じる。" },
        ],
      },
    ],
  },
  {
    id: "topic",
    title: "話題の入り方",
    why: "初対面では答えやすい話題から始め、少しずつ個人的な話へ進むと不確かさが下がる。家族や将来の夢は、日本の初対面では立ち入りすぎになりやすい。",
    refs: ["Berger & Calabrese (1975) Human Communication Research", "Altman & Taylor (1973) 社会的浸透理論"],
    rule: "趣味・休日 → 今やっていること → きっかけ、の順",
    items: [
      {
        id: "t1",
        prompt: "初対面の人と二人になった。最初の質問は？",
        options: [
          { text: "休みの日は何してることが多いですか？", good: true, feedback: "誰でも答えやすく、話が広がりやすい。" },
          { text: "ご結婚されてるんですか？", good: false, feedback: "家族の話は初対面では立ち入りすぎになりやすい。" },
          { text: "将来の夢って何ですか？", good: false, feedback: "面接のように感じさせやすい。打ち解けてからに。" },
          { text: "今日はどういうつながりで来たんですか？", good: true, feedback: "その場の共通点から入る質問。答えやすい。" },
        ],
      },
      {
        id: "t2",
        prompt: "自己紹介を求められた。",
        options: [
          { text: "〇〇です。最近はサウナにはまってます", good: true, feedback: "名前 + はまっていること 1 つ。相手が質問しやすい「取っ手」がある。" },
          { text: "〇〇です。よろしくお願いします", good: false, feedback: "間違いではないが、相手が次に聞くことを探す必要がある。" },
          { text: "〇〇です。経歴は〜(1 分以上話す)", good: false, feedback: "長いと相手の番が来ない。15 秒で十分。" },
        ],
      },
    ],
  },
  {
    id: "disclosure",
    title: "少しずつ自分を出す",
    why: "事実 → 好み・感想 → 価値観や小さな弱み、と段階的に、相手と交互に自分のことを話すと、短時間でも親しさが生まれる。一方的に重い話をすると逆効果。",
    refs: ["Aron et al. (1997) PSPB", "Collins & Miller (1994) Psychological Bulletin", "Kardas et al. (2022) JPSP"],
    rule: "相手が同じ深さで返してくれたら、一段だけ深める",
    items: [
      {
        id: "d1",
        prompt: "相手「休みの日はだいたい映画見てます」。あなたも映画が好き。",
        options: [
          { text: "私も好きです。最近だと〇〇がよかったです。どんなの見ます？", good: true, feedback: "同じ深さで自分を出し、相手にも返している。" },
          { text: "そうなんですね", good: false, feedback: "自分のことを全く出さないと、相手だけが話す形になって距離が縮まりにくい。" },
          { text: "私、映画で人生変わったんです。実は昔…(重い話)", good: false, feedback: "一気に深すぎる。相手が同じ深さで返しにくい。" },
        ],
      },
      {
        id: "d2",
        prompt: "何度か話して打ち解けてきた。もう一段深めたい。",
        options: [
          { text: "それ、始めたきっかけって何だったんですか？", good: true, feedback: "動機は価値観に近い話題。人は深い話を思ったより嫌がらない。" },
          { text: "天気いいですね", good: false, feedback: "安全だが浅いまま。半歩だけ深い話を試す価値がある。" },
        ],
      },
    ],
  },
  {
    id: "aizuchi",
    title: "あいづち",
    why: "日本語の会話はあいづちが多く、話し手と聞き手が一緒に話を進める。あいづちは「同意」ではなく「聞いています、続けて」の合図。",
    refs: ["Clancy et al. (1996) J. of Pragmatics", "Maynard (1986) Linguistics"],
    rule: "「はい」以外を 3 種類使う。話の区切り(〜ね、〜で)に合わせる",
    items: [
      {
        id: "a1",
        prompt: "相手が驚いた体験を話している。",
        options: [
          { text: "えっ、それでどうなったんですか？", good: true, feedback: "驚き + 続きを促す。話し手は乗ってくる。" },
          { text: "はい。はい。はい。", good: false, feedback: "同じあいづちの繰り返しは「聞き流されている」と感じさせやすい。" },
        ],
      },
      {
        id: "a2",
        prompt: "相手が仕事の大変さを話している。",
        options: [
          { text: "うわぁ…それは大変ですね", good: true, feedback: "相手の感情のトーンに合わせている。" },
          { text: "なるほどですね〜(明るく)", good: false, feedback: "トーンがずれると、聞いていないように見える。" },
        ],
      },
    ],
  },
  {
    id: "silence",
    title: "沈黙との付き合い方",
    why: "会話の切り替えは普段とても速いので、数秒の沈黙を「拒絶」と感じやすい。ただし沈黙は失敗ではなく、慌てて埋め続けるほうが相手の考える時間を奪う。",
    refs: ["Koudenburg et al. (2011) J. Experimental Social Psychology", "Stivers et al. (2009) PNAS"],
    rule: "3 秒待つ。それでも続かなければ「そういえばさっきの〜」",
    items: [
      {
        id: "s1",
        prompt: "質問に答えようとして、言葉が出てこない。",
        options: [
          { text: "うーん、ちょっと考えますね", good: true, feedback: "考え中だと口にすると、沈黙が「間」に変わる。" },
          { text: "(焦って思いついたことを次々話す)", good: false, feedback: "沈黙を埋める安全行動。かえってまとまらない。" },
        ],
      },
      {
        id: "s2",
        prompt: "話が途切れて 3 秒たった。",
        options: [
          { text: "そういえば、さっきの〇〇の話なんですけど", good: true, feedback: "前の話題に戻るのは一番自然な再開方法。" },
          { text: "すみません、話がつまらなくて…", good: false, feedback: "相手は気にしていないことが多い。謝ると相手が気をつかう。" },
          { text: "(そのまま少し待つ)", good: true, feedback: "相手が話し出すこともある。待てたこと自体が実験の成果。" },
        ],
      },
    ],
  },
];

export const drillById = (id: string) => DRILLS.find((d) => d.id === id);
