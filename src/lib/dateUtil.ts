// 캘린더 UI용 순수 날짜 유틸 (analyzer의 pyWeekday와는 다른 용도 — 여기는 일요일 시작 그리드용)

export function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 해당 월 1일의 요일 (0=일 ... 6=토) */
export function firstWeekday(y: number, m: number): number {
  return new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
}

export function monthLabel(y: number, m: number): string {
  return `${y}년 ${m}월`;
}

export function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
  const total = (y * 12 + (m - 1)) + delta;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
}

export function monthOf(dateStr: string): { y: number; m: number } {
  const [y, m] = dateStr.split("-").map(Number);
  return { y, m };
}
