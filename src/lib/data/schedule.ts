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

const schedule = rawSchedule as unknown as ScheduleFile;

export const SEASON_START = schedule.seasonStart;
export const SEASON_END = schedule.seasonEnd;
export const UPDATED_THROUGH = schedule.updatedThrough;

export function getTeamGames(teamId: string): KboGame[] {
  return schedule.teams[teamId] ?? [];
}

/** 이미 결과가 확정된(=직관 기록으로 선택 가능한) 경기만. 아직 안 열린 예정 경기는 "직관"할 수 없으므로 제외. */
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

/** 유저가 탭한 날짜들 -> 분석용 VisitRecord[] (결과는 실제 KBO 데이터에서 조회). 결과 미확정(미래) 날짜는 제외. */
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

/** 마지막으로 데이터가 갱신된 날짜(=결과가 확정된 가장 최근 날짜) 다음날부터를 "오늘"의 분석 기준으로 쓴다. */
export function getAnalysisToday(): DateStr {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}
