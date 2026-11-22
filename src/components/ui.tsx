import { useEffect, useState, type ReactNode } from "react";

export function Scale(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: 10 | 100;
  low: string;
  high: string;
  unit?: string;
}) {
  const max = props.max ?? 10;
  const id = "s-" + props.label.replace(/\s/g, "");
  return (
    <div>
      <label className="td-label" htmlFor={id}>
        {props.label} <span className="scale-value">{props.value}{props.unit ?? ""}</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={max === 100 ? 5 : 1}
        value={props.value}
        aria-valuetext={`${props.value}${props.unit ?? ""}`}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      <div className="row muted small">
        <span>{props.low}</span>
        <span className="spacer" />
        <span>{props.high}</span>
      </div>
    </div>
  );
}

/** 選択肢のボタン群。label は読み上げで、どの問いへの選択肢かを伝えるために使う */
export function Chips(props: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  return (
    <div className="row" role="group" aria-label={props.label}>
      {props.options.map((o) => {
        const on = props.value.includes(o);
        return (
          <button
            key={o}
            type="button"
            className="chip"
            aria-pressed={on}
            onClick={() => {
              if (props.single) props.onChange(on ? [] : [o]);
              else props.onChange(on ? props.value.filter((v) => v !== o) : [...props.value, o]);
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Steps({ total, at }: { total: number; at: number }) {
  return (
    <div className="steps" role="img" aria-label={`${total} 段階中 ${at + 1} 段階目`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i <= at ? "on" : ""} />
      ))}
    </div>
  );
}

export function Refs({ refs }: { refs: string[] }) {
  return <p className="refs">根拠: {refs.join(" / ")}</p>;
}

export function Back({ onClick, children = "← もどる" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button className="td-btn" data-variant="ghost" type="button" onClick={onClick}>
      {children}
    </button>
  );
}

/** 秒単位のカウントダウン。running が false の間は止まる */
export function useCountdown(seconds: number, running: boolean) {
  // 残り時間は、どの長さに対する値かと組で持つ。
  // 長さが変わった描画では古い残り時間を使わず、新しい長さから数え直す
  // (長さの変更と開始が同じ描画に重なっても、古い長さで始まらないように)
  const [st, setSt] = useState({ seconds, left: seconds });
  const left = st.seconds === seconds ? st.left : seconds;
  useEffect(() => {
    if (!running) return;
    const begin = Date.now() - (seconds - left) * 1000;
    const t = setInterval(() => {
      const l = Math.max(0, seconds - Math.floor((Date.now() - begin) / 1000));
      setSt({ seconds, left: l });
      if (l === 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
    // left は開始時点の値だけ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seconds]);
  return left;
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * 画面(または画面内の段階)が変わったら、新しい h1 へフォーカスを移す。
 * 押したボタンが消えるとフォーカスが body に落ち、スクリーンリーダーに新しい画面が伝わらず、
 * キーボード操作も先頭からやり直しになるため。最初に表示した h1 には移さない。
 */
export function useFocusHeading() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    let last: HTMLElement | null = null;
    let lastText: string | null = null;
    const check = () => {
      const h = root.querySelector<HTMLElement>("h1");
      if (!h || (h === last && h.textContent === lastText)) return;
      const first = last === null;
      last = h;
      lastText = h.textContent;
      if (first) return;
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    };
    check();
    const mo = new MutationObserver(check);
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);
}
