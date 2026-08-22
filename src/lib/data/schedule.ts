import rawSchedule from "@/data/kbo-schedule.json";
import type { DateStr, GameResult, KboGame, VisitRecord } from "@/lib/analyzer";

interface ScheduleFile {
  generatedAt: string;
  updatedThrough: string | null;
  seasonStart: DateStr;
  seasonEnd: DateStr;
  source: string;
  teams: Record<string, KboGame[]>;
}

// 번들에 포함된 JSON을 기본값으로 사용하고, 앱 시작 시 GitHub Raw에서 최신 데이터로 교체한다.
// 이렇게 하면 토스 미니앱 재배포 없이 매일 KBO 데이터가 갱신된다.
let _schedule: ScheduleFile = rawSchedule as unknown as ScheduleFile;

const SCHEDULE_URL =
  "https://raw.githubusercontent.com/hna-dot/win-fairy/main/src/data/kbo-schedule.json";

/** 앱 시작 시 한 번 호출. 최신 JSON을 받아오면 모듈 내부 스케줄을 교체한다. */
export async function refreshSchedule(): Promise<void> {
  try {
    const res = await fetch(SCHEDULE_URL);
    if (!res.ok) return;
    const data: ScheduleFile = await res.json();
    _schedule = data;
  } catch {
    // 네트워크 실패 시 번들 데이터로 계속 동작
  }
}

export function getSeasonStart(): DateStr {
  return _schedule.seasonStart;
}
export function getSeasonEnd(): DateStr {
  return _schedule.seasonEnd;
}
export function getUpdatedThrough(): string | null {
  return _schedule.updatedThrough;
}

export function getTeamGames(teamId: string): KboGame[] {
  return _schedule.teams[teamId] ?? [];
}

/** 이미 결과가 확정된(=직관 기록으로 선택 가능한) 경기만. */
export function getPlayedGames(teamId: string): KboGame[] {
  return getTeamGames(teamId).filter((g) => g.result !== null);
}

/** 캘린더에서 선택 가능한(=이미 열려서 결과가 있는) 날짜 집합 */
export function getGameDateSet(teamId: string): Set<DateStr> {
  return new Set(getPlayedGames(teamId).map((g) => g.date));
}

export function getGameOnDate(teamId: string, date: DateStr): KboGame | undefined {
  return getTeamGames(teamId).find((g) => g.date === date);
}

/** 유저가 탭한 날짜들 → 분석용 VisitRecord[] */
export function resolveVisitRecords(teamId: string, dates: DateStr[]): VisitRecord[] {
  const games = getTeamGames(teamId);
  const gameByDate = new Map(games.map((g) => [g.date, g]));
  const records: VisitRecord[] = [];
  for (const date of dates) {
    const g = gameByDate.get(date);
    if (!g || g.result === null) continue;
    records.push({ date, result: g.result as GameResult });
  }
  return records;
}

export function getAnalysisToday(): DateStr {
  return new Date().toISOString().slice(0, 10);
}
