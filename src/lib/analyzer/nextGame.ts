// 다음 경기 추천 (SPEC 3.6, analyzer.py find_next_matching_game 포팅)

import { dateFeatureTrueForSingleDate } from "./dateFeatures";
import { kboFeatureTrueForSingleDate } from "./kboFeatures";
import type { DateStr, KboGame } from "./types";

/** 단일 미래 경기에 대해 피처 하나가 참인지 판정 (A그룹 우선 확인 후 B그룹) */
export function featureTrueForSingleDate(fname: string, game: KboGame): boolean {
  const dateResult = dateFeatureTrueForSingleDate(fname, game.date as DateStr);
  if (dateResult !== null) return dateResult;
  const kboResult = kboFeatureTrueForSingleDate(fname, game);
  if (kboResult !== null) return kboResult;
  return false;
}

/** 조건을 만족하는 가장 가까운 미래 경기를 찾는다. upcomingGames는 날짜 오름차순이어야 함. */
export function findNextMatchingGame(condition: readonly string[], upcomingGames: KboGame[]): KboGame | null {
  for (const g of upcomingGames) {
    if (condition.every((f) => featureTrueForSingleDate(f, g))) return g;
  }
  return null;
}
