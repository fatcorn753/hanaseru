import type { Level, Mission } from "../lib/types";

export const LEVEL_NAMES: Record<Level, string> = {
  1: "一言を添える",
  2: "短く尋ねる",
  3: "知っている人と少し話す",
  4: "初対面と話す",
  5: "輪に入る・自分から動く",
  6: "半歩深く話す",
};

/**
 * 雑談・初対面の課題のはしご。
 * 同じ段を相手・場所・時間を変えて繰り返すと学習が定着しやすい(文脈の多様化)。
 */
export const MISSIONS: Mission[] = [
  // 1: 一言を添える
  { id: "l1-thanks-plus", level: 1, title: "店員さんに「ありがとう」+ 一言", detail: "会計のときに「ありがとうございます、助かりました」など一言足す。" },
  { id: "l1-greet-neighbor", level: 1, title: "近所の人や守衛さんにあいさつ", detail: "目を合わせて、相手に聞こえる声で「おはようございます」。" },
  { id: "l1-weather", level: 1, title: "天気の一言", detail: "店員さんやエレベーターで「今日は寒いですね」と言ってみる。返事がなくても実験は成立。" },
  { id: "l1-compliment-item", level: 1, title: "物をほめる", detail: "店で「この〇〇、いいですね」と一言。相手の反応を観察する。" },
  { id: "l1-voice-louder", level: 1, title: "いつもより少し大きな声で注文", detail: "安全行動「小声で済ませる」をやめてみる実験。" },
  { id: "l1-eye-contact", level: 1, title: "目を見て会釈", detail: "すれ違う知人や店員さんに、目を見て軽く会釈する。" },
  // 2: 短く尋ねる
  { id: "l2-ask-recommend", level: 2, title: "おすすめを聞く", detail: "店員さんに「どれがおすすめですか？」と聞き、理由も一つ聞き返す。", skillIds: ["followup"] },
  { id: "l2-ask-way", level: 2, title: "場所や行き方を尋ねる", detail: "知っていても、駅員さんや店員さんに一つ尋ねてみる。" },
  { id: "l2-ask-time", level: 2, title: "あえて少し言葉に詰まる", detail: "質問の途中で 2 秒止まってみる。相手がどう反応するか観察する(わざと小さな失敗をする実験)。", skillIds: ["silence"] },
  { id: "l2-phone-shop", level: 2, title: "電話で営業時間を聞く", detail: "店に電話して営業時間か在庫を一つだけ聞く。" },
  { id: "l2-classmate-q", level: 2, title: "同級生・同僚に事務的な質問", detail: "「次の〇〇っていつでしたっけ？」と聞き、お礼を言う。" },
  { id: "l2-return-q", level: 2, title: "聞かれたら聞き返す", detail: "「〇〇は？」と聞かれたら、答えたあと「〇〇さんは？」と返す。" },
  // 3: 知っている人と少し話す
  { id: "l3-weekend", level: 3, title: "週末の話を聞く", detail: "知り合いに「週末どうでした？」と聞き、返事に深掘り質問を 2 回続ける。", skillIds: ["followup"] },
  { id: "l3-aizuchi", level: 3, title: "あいづちを変えてみる", detail: "「はい」だけでなく「そうなんですね」「なるほど」「えっ、それで？」を使い分ける。", skillIds: ["aizuchi"] },
  { id: "l3-reflect", level: 3, title: "気持ちを言い換える", detail: "相手の話を「つまり〜で大変だったんですね」と 1 回まとめてみる。", skillIds: ["reflect"] },
  { id: "l3-share-small", level: 3, title: "自分の小さな話をする", detail: "最近あった小さな出来事を 30 秒で話す。オチはなくてよい。", skillIds: ["disclosure"] },
  { id: "l3-lunch", level: 3, title: "一緒にお昼や休憩をとる", detail: "知り合いに「一緒にいいですか？」と声をかける。" },
  { id: "l3-external-focus", level: 3, title: "相手の話の名詞を 3 つ覚える", detail: "自分の話し方ではなく、相手の話の中身に注意を向ける実験。後で書き出す。" },
  { id: "l3-no-rehearse", level: 3, title: "頭の中で台本を作らずに話す", detail: "安全行動「事前の頭内リハーサル」をやめて、その場で返してみる。" },
  // 4: 初対面と話す
  { id: "l4-intro", level: 4, title: "初対面の人に自己紹介", detail: "名前 + 一言(最近はまっていること)で、15 秒の自己紹介。", skillIds: ["topic"] },
  { id: "l4-topic-r", level: 4, title: "休日の過ごし方から入る", detail: "初対面の人に「休みの日は何してるんですか？」から話す。", skillIds: ["topic", "followup"] },
  { id: "l4-followup-2", level: 4, title: "初対面で深掘り質問を 2 回", detail: "話題を変える前に、相手の直前の話から 2 回続けて質問する。", skillIds: ["followup"] },
  { id: "l4-end-self", level: 4, title: "自分から会話を締める", detail: "「〇〇の話おもしろかったです。そろそろ戻りますね、また」と締める。", skillIds: ["ending"] },
  { id: "l4-silence-3s", level: 4, title: "3 秒の間をそのままにする", detail: "沈黙をすぐ埋めず 3 秒待つ。相手が話し出すか観察する。", skillIds: ["silence"] },
  { id: "l4-wait-line", level: 4, title: "待ち時間に隣の人へ一言", detail: "行列やイベントで「混んでますね」など。続かなくても実験は成立。" },
  { id: "l4-name-remember", level: 4, title: "相手の名前を呼ぶ", detail: "初対面の相手の名前を、会話中に 1 回呼ぶ。" },
  // 5: 輪に入る・自分から動く
  { id: "l5-join-group", level: 5, title: "3 人以上の輪に入る", detail: "話している輪の近くに立ち、うなずきから入って、1 回発言する。" },
  { id: "l5-speak-meeting", level: 5, title: "会議・ゼミで 1 回発言", detail: "質問でも賛成でもよいので、最初の 10 分以内に 1 回話す。" },
  { id: "l5-invite", level: 5, title: "自分から誘う", detail: "「今度〇〇行きませんか？」と誘う。断られても実験は成立。" },
  { id: "l5-contact-after", level: 5, title: "会ったあとに連絡する", detail: "話した相手に「昨日はありがとうございました」と送る。相手は思っているより好意的なことが多い。" },
  { id: "l5-disagree", level: 5, title: "やわらかく違う意見を言う", detail: "「私は少し違って、〜と思っていて」と一度言ってみる。" },
  { id: "l5-event", level: 5, title: "交流会・サークルに行く", detail: "初めての集まりに参加し、2 人と話す。" },
  { id: "l5-joke", level: 5, title: "軽い冗談を言う", detail: "滑ってもよい。相手の反応を事実として記録する。" },
  // 6: 半歩深く話す
  { id: "l6-why", level: 6, title: "「なぜ」を一つ聞く", detail: "趣味や仕事の話で「それを始めたきっかけは？」と動機を聞く。", skillIds: ["disclosure", "followup"] },
  { id: "l6-share-weak", level: 6, title: "小さな弱みを話す", detail: "「実は〇〇が苦手で」と、相手が同じくらい話してくれたら一段だけ深める。", skillIds: ["disclosure"] },
  { id: "l6-gratitude", level: 6, title: "感謝を具体的に伝える", detail: "「あのとき〇〇してくれて助かった」と、具体的な場面を添えて伝える。" },
  { id: "l6-ask-advice", level: 6, title: "相談する", detail: "小さな悩みを一つ相談する。人は頼られると好意を持ちやすい。" },
  { id: "l6-long-talk", level: 6, title: "20 分以上の 1 対 1", detail: "知り合いと 20 分以上話す。途中の沈黙も記録する。" },
  { id: "l6-blush-ok", level: 6, title: "緊張していると言う", detail: "「ちょっと緊張してて」と口にしてみる。相手の反応を観察する。" },
];

export const missionById = (id?: string) => MISSIONS.find((m) => m.id === id);

/** 安全行動のチェックリスト(Clark & Wells モデル)。やめる実験の候補になる */
export const SAFETY_BEHAVIORS = [
  "話す前に頭の中でセリフを練習する",
  "相手の目を見ない",
  "沈黙が怖くて話し続ける",
  "小さな声・早口で話す",
  "自分のことを話さず質問だけする",
  "スマホを見て話しかけられないようにする",
  "手の震えや顔の赤さを隠そうとする",
  "会話を早く切り上げる",
  "知っている人のそばから離れない",
  "相手の反応を見張り続ける",
];

/** 外に注意を向けるお題。気をそらすためではなく、現実の情報を集めるために使う */
export const FOCUS_TASKS = [
  "相手の話の名詞を 3 つ覚える",
  "相手が一番うれしそうだった話題を見つける",
  "相手の服や持ち物の色を 1 つ覚える",
  "相手が使った言葉を 1 つそのまま返す",
  "相手の表情が変わった瞬間を 1 つ見つける",
];
