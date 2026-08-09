// 직관 기록 localStorage 저장 (SPEC 6: 로그인 없음, 기기 로컬 저장 + 기록 초기화)

const STORAGE_KEY = "seungyo-pandokgi:visits:v1";

export interface StoredState {
  teamId: string | null;
  /** 유저가 탭한 직관 날짜(YYYY-MM-DD). 결과(승/패)는 저장하지 않고 KBO 일정에서 그때그때 조회한다. */
  dates: string[];
}

const EMPTY_STATE: StoredState = { teamId: null, dates: [] };

export function loadState(): StoredState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredState> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE;
    return {
      teamId: typeof parsed.teamId === "string" ? parsed.teamId : null,
      dates: Array.isArray(parsed.dates) ? parsed.dates.filter((d) => typeof d === "string") : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveState(state: StoredState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
