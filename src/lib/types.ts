/** 課題のはしごの段階。1 が最も易しい */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

export interface Mission {
  id: string;
  level: Level;
  title: string;
  detail: string;
  /** スキル道場の関連ドリル */
  skillIds?: string[];
}

export type ExperimentStatus = "planned" | "done" | "abandoned";

/** 1 回の行動実験。予想(実行前)と結果(実行後)を 1 レコードで持つ */
export interface Experiment {
  id?: number;
  createdAt: number;
  status: ExperimentStatus;
  missionId?: string;
  title: string;
  level: Level;
  /** 最悪の予想 */
  prediction: string;
  /** 最悪の予想が起きる確信度 0–100 */
  confidence: number;
  /** 予想する緊張 0–10 */
  expectedAnxiety: number;
  safetyBehaviorDropped?: string;
  focusTask?: string;
  doneAt?: number;
  /** 起きた事実(解釈は入れない) */
  happened?: string;
  /** 最悪の予想はどの程度当たったか 0–100 */
  cameTrue?: number;
  /** 実際の緊張の最高値 0–10 */
  peakAnxiety?: number;
  /** 学んだこと 1 文 */
  learned?: string;
  /** 会話後の反省会チェックを済ませたか */
  pepChecked?: boolean;
}

export type SleepQuality = "poor" | "ok" | "good";

export interface SleepLog {
  /** YYYY-MM-DD(端末のローカル日付) */
  date: string;
  quality: SleepQuality;
}

export interface VideoReview {
  id?: number;
  createdAt: number;
  /** 見る前の予想 0–100: どれだけ緊張して見えるか */
  predicted: Record<VideoAspect, number>;
  /** 他人のつもりで見た後の評価 0–100 */
  observed: Record<VideoAspect, number>;
  note?: string;
}

export type VideoAspect = "nervous" | "shaky" | "awkward";

export interface Reflection {
  id?: number;
  createdAt: number;
  experimentId?: number;
  kind: "facts" | "compassion" | "worry-dump";
  /** 自由記述。書き出しは保存しない設定もある */
  text?: string;
  /** 反省会は役に立ったか 0–100(メタ認知的信念を弱めるために記録) */
  helpful?: number;
}

export interface DrillAttempt {
  id?: number;
  createdAt: number;
  drillId: string;
  itemId: string;
  correct: boolean;
}

export interface Profile {
  onboardedAt?: number;
  /** 自分の安全行動(チェックリストから選択) */
  safetyBehaviors: string[];
  /** もし〜したら、〜する */
  ifThen?: { when: string; then: string };
  /** 苦手な場面の自己評価 0–10(診断用ではない) */
  baseline?: Record<string, number>;
}
