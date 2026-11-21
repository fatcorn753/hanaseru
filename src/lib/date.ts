/** 端末のローカル日付を YYYY-MM-DD で返す。toISOString は UTC になるため使わない */
export function localDate(t: number | Date = Date.now()): string {
  const d = typeof t === "number" ? new Date(t) : t;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(t: number, n: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
}
