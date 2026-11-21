import { useEffect, useRef, useState, type ReactNode } from "react";

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
      <label htmlFor={id}>
        {props.label} <span className="scale-value">{props.value}{props.unit ?? ""}</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={max === 100 ? 5 : 1}
        value={props.value}
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

export function Chips(props: { options: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  return (
    <div className="row">
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
    <div className="steps" aria-label={`${total} 段階中 ${at + 1} 段階目`}>
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
    <button className="ghost" onClick={onClick}>
      {children}
    </button>
  );
}

/** 秒単位のカウントダウン。running が false の間は止まる */
export function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    setLeft(seconds);
    startRef.current = null;
  }, [seconds]);
  useEffect(() => {
    if (!running) return;
    const begin = Date.now() - (seconds - left) * 1000;
    startRef.current = begin;
    const t = setInterval(() => {
      const l = Math.max(0, seconds - Math.floor((Date.now() - begin) / 1000));
      setLeft(l);
      if (l === 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
    // left は開始時点の値だけ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, seconds]);
  return left;
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
