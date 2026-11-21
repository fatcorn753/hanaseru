import type { Experiment, Level, Mission, Track } from "../lib/types";

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
  // ---- 発表・人前で話す ----
  { id: "sp1-rehearse", track: "speech", level: 1, title: "1 分、声に出してリハーサル", detail: "道場の「人前で話すリハーサル」で、テーマを決めて 1 分話す。原稿は読まない。", skillIds: ["speech"] },
  { id: "sp1-record", track: "speech", level: 1, title: "自分の話す声を録音して聞く", detail: "スマホの録音で 1 分話し、他人の声のつもりで聞く。思っていたより落ち着いて聞こえるか確かめる。" },
  { id: "sp2-answer", track: "speech", level: 2, title: "当てられたら一言+理由で答える", detail: "授業や会議で聞かれたら「〇〇だと思います。△△だからです」と答える。" },
  { id: "sp2-agree", track: "speech", level: 2, title: "少人数で「賛成です」と言う", detail: "ゼミやグループで、賛成の一言を理由つきで言う。" },
  { id: "sp3-question", track: "speech", level: 3, title: "授業や説明会で質問を 1 つする", detail: "手を挙げて質問する。質問は短く、1 つだけ。", skillIds: ["speech"] },
  { id: "sp3-early", track: "speech", level: 3, title: "最初の 10 分で発言する", detail: "話し合いの始めのうちに一度話す。遅くなるほど言いにくくなる。" },
  { id: "sp4-intro-front", track: "speech", level: 4, title: "前に出て 30 秒の自己紹介", detail: "名前と、最近はまっていることを一つ。聞いている誰か一人に向けて話す。", skillIds: ["speech"] },
  { id: "sp4-pause", track: "speech", level: 4, title: "文の終わりで 1 拍置く", detail: "安全行動「早口で終わらせる」をやめる実験。間が聞き手にどう受け取られたか観察する。", skillIds: ["speech"] },
  { id: "sp5-present", track: "speech", level: 5, title: "原稿を読まずに 3 分発表する", detail: "要点だけのメモで話す。言いよどんでもそのまま続ける。", skillIds: ["speech"] },
  { id: "sp5-faces", track: "speech", level: 5, title: "発表中に聞き手 3 人の顔を見る", detail: "自分の様子ではなく、聞き手の反応に注意を向ける。うなずいた人を覚えておく。", skillIds: ["speech"] },
  { id: "sp6-stop", track: "speech", level: 6, title: "発表中にわざと 3 秒止まる", detail: "「えーと、少し待ってください」と言って 3 秒止まる。聞き手がどう反応したか記録する。", skillIds: ["speech"] },
  { id: "sp6-dont-know", track: "speech", level: 6, title: "「いま答えられません」と言う", detail: "質疑で「いま答えられないので、調べてお伝えします」と言ってみる。" },
  { id: "sp6-feedback", track: "speech", level: 6, title: "発表後に感想を聞く", detail: "聞き手に「わかりにくい所ありましたか？」と聞く。" },
  // ---- 職場・バイトのやりとり ----
  { id: "wk1-greet", track: "work", level: 1, title: "相手に届く声であいさつ", detail: "出勤・退勤のときに、相手の顔を見て「おつかれさまです」。" },
  { id: "wk1-thanks", track: "work", level: 1, title: "具体的にお礼を言う", detail: "「さっき〇〇を代わってくれて、助かりました」と、何に感謝したかを添える。" },
  { id: "wk2-confirm", track: "work", level: 2, title: "指示を復唱して確かめる", detail: "「〇〇を△時までに、で合っていますか？」と確認する。", skillIds: ["askhelp"] },
  { id: "wk2-where", track: "work", level: 2, title: "物の場所ややり方を 1 つ聞く", detail: "知っていそうな人に短く聞いて、お礼を言う。", skillIds: ["askhelp"] },
  { id: "wk3-stuck", track: "work", level: 3, title: "15 分詰まったら質問する", detail: "「〇〇まではできたのですが、△△がわからなくて」と、どこまでできたかを添えて聞く。", skillIds: ["askhelp"] },
  { id: "wk3-advice", track: "work", level: 3, title: "先輩にコツを聞く", detail: "「〇〇のコツってありますか？」と助言を求める。難しいことについて助言を求めると、むしろ有能に見られやすいという研究がある。", skillIds: ["askhelp"] },
  { id: "wk4-done", track: "work", level: 4, title: "終わったら結論から報告する", detail: "「〇〇終わりました。△△だけ気になった点があります」と、結論を先に言う。", skillIds: ["askhelp"] },
  { id: "wk4-progress", track: "work", level: 4, title: "途中経過を自分から伝える", detail: "聞かれる前に「いま半分くらいです。〇時には終わりそうです」と伝える。" },
  { id: "wk5-mistake", track: "work", level: 5, title: "小さなミスをすぐ伝える", detail: "気づいたら早めに「〇〇を間違えました。△△で直そうと思います」と、事実と対応案を伝える。早く共有するほど直しやすく、チームも同じミスを防げる。", skillIds: ["askhelp"] },
  { id: "wk5-late", track: "work", level: 5, title: "間に合わなさそうなら早めに相談", detail: "締め切りの前に「このままだと〇日になりそうです。どうしましょう」と相談する。", skillIds: ["askhelp"] },
  { id: "wk6-suggest", track: "work", level: 6, title: "一つ提案する", detail: "「〇〇してみるのはどうでしょう」と、小さな改善を一つ言う。" },
  { id: "wk6-concern", track: "work", level: 6, title: "懸念を一点だけ伝える", detail: "話し合いで「一点だけ気になっているのが」と、やわらかく伝える。" },
  // ---- 頼む・断る ----
  { id: "as1-order", track: "assert", level: 1, title: "店で小さな希望を言う", detail: "「氷少なめで」「袋はいりません」など、自分の希望を一つ言う。" },
  { id: "as1-seat", track: "assert", level: 1, title: "「この席いいですか？」と聞く", detail: "空いている席に座る前に一言聞く。" },
  { id: "as2-favor", track: "assert", level: 2, title: "ちょっとしたことを頼む", detail: "「それ取ってもらえますか？」など、すぐ済むことを頼む。", skillIds: ["request"] },
  { id: "as2-repeat", track: "assert", level: 2, title: "「もう一度お願いします」と言う", detail: "聞き取れなかったら、聞こえたふりをせずに聞き返す。", skillIds: ["request"] },
  { id: "as3-sales", track: "assert", level: 3, title: "勧誘や試食を断る", detail: "「今日は大丈夫です、ありがとうございます」と短く断る。理由は言わなくてよい。", skillIds: ["decline"] },
  { id: "as3-wrong", track: "assert", level: 3, title: "注文の間違いを伝える", detail: "「すみません、頼んだのは〇〇なんです」と伝える。" },
  { id: "as4-help", track: "assert", level: 4, title: "手間のかかることを頼む", detail: "友人や同僚に、理由と期限を添えて頼む。頼まれた側は、頼む側が思うより引き受けてくれやすい。", skillIds: ["request"] },
  { id: "as4-notes", track: "assert", level: 4, title: "休んだ授業のノートを見せてもらう", detail: "「〇日のノート、見せてもらえませんか？」と頼む。", skillIds: ["request"] },
  { id: "as5-invite", track: "assert", level: 5, title: "気が進まない誘いを断る", detail: "「誘ってくれてありがとう。今回はやめておくね」と、感謝と結論を先に言う。", skillIds: ["decline"] },
  { id: "as5-task", track: "assert", level: 5, title: "引き受けられない頼みを断る", detail: "「今週は〇〇があって難しいです。来週なら手伝えます」と、代案を添えて断る。", skillIds: ["decline"] },
  { id: "as6-prefer", track: "assert", level: 6, title: "決めごとで希望を先に言う", detail: "「私は〇〇がいいです」と、ほかの人より先に言う。", skillIds: ["request"] },
  { id: "as6-boundary", track: "assert", level: 6, title: "嫌なことをやめてもらう", detail: "「〇〇はやめてもらえると助かります」と、落ち着いて一度伝える。", skillIds: ["request"] },
];

export const missionById = (id?: string) => MISSIONS.find((m) => m.id === id);

export const TRACKS: Track[] = ["chat", "speech", "work", "assert"];

export const TRACK_INFO: Record<Track, { name: string; levels: Record<Level, string> }> = {
  chat: { name: "雑談・初対面", levels: LEVEL_NAMES },
  speech: {
    name: "発表・人前で話す",
    levels: { 1: "ひとりで声に出す", 2: "少人数の前で一言", 3: "自分から発言する", 4: "前に出て短く話す", 5: "発表する", 6: "わざと小さく失敗する" },
  },
  work: {
    name: "職場・バイトのやりとり",
    levels: { 1: "あいさつとお礼", 2: "短く確認する", 3: "質問・相談する", 4: "自分から報告する", 5: "ミスや遅れを伝える", 6: "意見・提案をする" },
  },
  assert: {
    name: "頼む・断る",
    levels: { 1: "小さな希望を言う", 2: "小さく頼む", 3: "小さく断る", 4: "手間のかかることを頼む", 5: "誘いや頼まれごとを断る", 6: "自分の考えを通す" },
  },
};

export const trackOfMission = (m: Mission): Track => m.track ?? "chat";

/** 記録の場面。古い記録には track がないので、課題から引き、なければ雑談とみなす */
export function trackOf(x: Pick<Experiment, "track" | "missionId">): Track {
  if (x.track) return x.track;
  const m = missionById(x.missionId);
  return m ? trackOfMission(m) : "chat";
}

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
