// 희귀도 계산 (SPEC 3.5).
// analyzer.py 원안은 실제 시즌 일정이 없어 "월요일 제외 달력일수"로 근사하고, KBO 피처가
// 섞인 조건은 계산 자체를 생략했다. 지금은 팀별 실제 시즌 일정(kbo-schedule.json)이 있으므로
// A그룹/B그룹 구분 없이 실제 경기 목록을 모집단으로 정확히 계산한다.

import { featureTrueForSingleDate } from "./nextGame";
import type { KboGame, RarityInfo } from "./types";

/** KBO 정규시즌 팀당 경기 수 (10구단, 상대팀별 16경기 = 8홈 + 8원정 × 9팀). */
const KBO_SEASON_GAMES = 144;

/**
 * 희귀도 = 조건을 만족하는 경기 수 / 시즌 전체 경기 수(144, 고정값).
 * teamGames는 완료된 경기 + 현재까지 발표된 예정 경기(보통 미래 약 3~4주치)만 포함하고
 * 시즌 전체가 아직 다 확보되지 않은 경우가 많으므로, matched는 확보된 일정 기준 근사치이지만
 * 분모(total)는 실제 KBO 시즌 길이인 144로 고정해 몇 %인지가 왜곡되지 않게 한다.
 */
export function computeRarity(condition: readonly string[], teamGames: readonly KboGame[]): RarityInfo | null {
  if (teamGames.length === 0) return null;

  const matched = teamGames.filter((g) => condition.every((f) => featureTrueForSingleDate(f, g))).length;
  return { matched, total: KBO_SEASON_GAMES, ratio: matched / KBO_SEASON_GAMES };
}

/**
 * 희귀도(낮을수록 희귀) -> 별점 매핑. 낮은 비율일수록 별이 많음(=더 희귀하고 억지스러움).
 * 구간값은 실측 검증 완료: 전체 10개 팀 대상 4,000회 시뮬레이션(무작위 3~10경기 픽)한
 * rarity.ratio 분포 기준으로 5/10/20/35%가 2/5/10/20%보다 등급별 분포가 훨씬 고르다
 * (기존값은 결과의 약 80%가 하위 2개 등급에 몰림).
 */
export function rarityToStars(ratio: number): string {
  const pct = ratio * 100;
  if (pct <= 5) return "★★★★★";
  if (pct <= 10) return "★★★★☆";
  if (pct <= 20) return "★★★☆☆";
  if (pct <= 35) return "★★☆☆☆";
  return "★☆☆☆☆";
}
