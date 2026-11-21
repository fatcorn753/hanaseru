export interface BreathPattern {
  id: string;
  name: string;
  when: string;
  /** 秒数の並び。kind は表示文言 */
  phases: { kind: "吸う" | "もう一度吸う" | "吐く" | "止める"; sec: number }[];
  defaultSeconds: number;
  ref: string;
}

/**
 * 息止めや速い呼吸は、過呼吸傾向の人で息苦しさを招くことがあるため入れない。
 * どちらも「吐く息を長く」に絞る。
 */
export const BREATHS: BreathPattern[] = [
  {
    id: "sigh",
    name: "ため息呼吸(cyclic sighing)",
    when: "会話の直前に 1 分",
    phases: [
      { kind: "吸う", sec: 2 },
      { kind: "もう一度吸う", sec: 1 },
      { kind: "吐く", sec: 6 },
    ],
    defaultSeconds: 60,
    ref: "Balban et al. (2023) Cell Reports Medicine",
  },
  {
    id: "slow",
    name: "ゆっくり呼吸(1 分 6 回)",
    when: "朝や寝る前に 5 分",
    phases: [
      { kind: "吸う", sec: 4 },
      { kind: "吐く", sec: 6 },
    ],
    defaultSeconds: 300,
    ref: "Fincham et al. (2023) Scientific Reports",
  },
];

export const REAPPRAISAL = {
  title: "ドキドキを「準備ができた」と読み替える",
  body: [
    "心臓が速いのは、体が本番に向けてエネルギーを出しているサイン。",
    "無理に落ち着こうとしなくていい。",
    "声に出すか、心の中で一つ選んでください。",
  ],
  choices: ["わくわくしてきた", "準備ができてきた", "体がやる気を出している"],
  ref: "Brooks (2014) J. Experimental Psychology: General",
  caution: "しっくりこなければ使わなくてよい。呼吸のほうが合う人もいる。",
};

export const WORRY_DUMP = {
  title: "心配の書き出し(3 分)",
  body: "頭の中の心配を、整えずにそのまま書き出す。書き終えたら閉じて、相手のほうへ注意を向ける。",
  ref: "Ramirez & Beilock (2011) Science",
  seconds: 180,
};

export const SELF_COMPASSION = {
  title: "反省会を止める 3 ステップ",
  steps: [
    { label: "いま、しんどいと認める", hint: "例: 「さっきの会話を思い出して、恥ずかしい気持ちになっている」" },
    { label: "誰でも緊張すると思い出す", hint: "例: 「人前で緊張するのは自分だけじゃない」" },
    { label: "仲のよい友達にかける言葉を、自分に書く", hint: "例: 「行っただけでえらい。相手は思っているほど気にしていない」" },
  ],
  ref: "Neff (2003) Self and Identity; Ferrari et al. (2019) Mindfulness",
  note: "自分を甘やかすためではなく、次に動くための回復です。",
};

export const PMR_STEPS = [
  { part: "両手", tense: "ぐっと握る" },
  { part: "肩", tense: "耳に近づけるように上げる" },
  { part: "顔", tense: "ぎゅっと目と口を閉じる" },
  { part: "足の指", tense: "丸めて力を入れる" },
];

export const PMR = {
  title: "力を入れて抜く(1 分)",
  tenseSec: 5,
  releaseSec: 10,
  ref: "Manzoni et al. (2008) BMC Psychiatry",
  caution: "力を抜いたときに逆に落ち着かなくなる人もいます。不快ならすぐやめてかまいません。",
};

/** 相談先。電話番号は変わりうるので、一覧ページへのリンクを主にする */
export const HELP_LINKS = [
  { name: "まもろうよ こころ(厚生労働省・相談窓口の一覧)", url: "https://www.mhlw.go.jp/mamorouyokokoro/" },
  { name: "こころの耳(働く人のメンタルヘルス)", url: "https://kokoro.mhlw.go.jp/" },
];
