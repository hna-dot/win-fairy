// 승요 판독기 알고리즘 최상위 진입점 (analyzer.py 전체 흐름 포팅, SPEC 3.1~3.6)

import { buildFeatureMatrix, extractRawValues } from "./dateFeatures";
import { buildKboFeatureMatrix } from "./kboFeatures";
import { findNextMatchingGame } from "./nextGame";
import { conditionToText } from "./phrases";
import { computeRarity } from "./rarity";
import { findAvoidanceCondition, findForcedCondition } from "./search";
import type { AnalysisOutput, AnalysisRecord, DateStr, KboGame, VisitRecord } from "./types";

export * from "./types";
export { getFeatureCategory, getCategoryTier } from "./categories";
export { rarityToStars } from "./rarity";
export { featureToPhrase, conditionToText, buildConditionPhrases } from "./phrases";

const MIN_GAMES_REQUIRED = 3;

/** 직관 기록(무 제외) + 해당 팀의 KBO 일정을 합쳐 분석용 레코드를 만든다 (A그룹 + B그룹 피처 병합) */
function buildAnalysisRecords(nonTieVisits: VisitRecord[], teamGames: KboGame[]): AnalysisRecord[] {
  const gameByDate = new Map(teamGames.map((g) => [g.date, g]));

  const rawList = nonTieVisits.map((v) => extractRawValues(v.date));
  const dateFeatureMatrix = buildFeatureMatrix(rawList);

  const kboRawList = nonTieVisits.map((v) => gameByDate.get(v.date) ?? null);
  const kboFeatureMatrix = buildKboFeatureMatrix(kboRawList);

  return nonTieVisits.map((v, i) => ({
    date: v.date,
    result: v.result as "승" | "패",
    features: { ...dateFeatureMatrix[i], ...kboFeatureMatrix[i] },
    kbo: kboRawList[i] ?? undefined,
  }));
}

/**
 * 승요 판독 메인 함수.
 * @param visits 직관 기록 (무승부 포함 가능, 분석에서는 내부적으로 제외)
 * @param teamGames 해당 팀의 KBO 전체 일정(과거+미래), 날짜순 정렬 불필요(내부에서 처리).
 *   희귀도 계산의 모집단으로도 그대로 쓰인다.
 * @param today 오늘 날짜(YYYY-MM-DD). 다음 경기 탐색의 기준.
 */
export function analyzeVisits(visits: VisitRecord[], teamGames: KboGame[], today: DateStr): AnalysisOutput {
  const nonTie = visits.filter((v) => v.result !== "무");
  const wins = nonTie.filter((v) => v.result === "승").length;
  const losses = nonTie.filter((v) => v.result === "패").length;
  const ties = visits.length - nonTie.length;

  // 최소 표본 기준(3경기)은 무승부를 포함한 전체 선택 경기 수로 판단한다.
  // 다만 승패 판독 자체(승요/회피 조건 탐색)는 무승부를 제외한 결과만으로 계산한다.
  if (visits.length < MIN_GAMES_REQUIRED) {
    return { status: "판독보류", totalGames: visits.length, wins, losses, ties };
  }
  if (nonTie.length === 0) {
    // 전부 무승부라 승패 신호가 아예 없는 극단적인 경우 -> 판독 자체가 불가능
    return { status: "판독보류", totalGames: visits.length, wins, losses, ties };
  }

  const records = buildAnalysisRecords(nonTie, teamGames);
  const upcomingGames = teamGames
    .filter((g) => g.result === null && g.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (wins === 0) {
    const avoidance = findAvoidanceCondition(records);
    if (!avoidance) {
      // 회피 조건조차 못 찾은 극히 드문 경우: 조건 없이 상태만 반환 (UI에서 대체 문구 처리)
      return { status: "패배방지", totalGames: nonTie.length, wins, losses, ties };
    }
    const rarity = computeRarity(avoidance.condition, teamGames);
    const nextGame = findNextMatchingGame(avoidance.condition, upcomingGames);
    return {
      status: "패배방지",
      totalGames: nonTie.length,
      wins,
      losses,
      ties,
      condition: avoidance.condition,
      conditionText: conditionToText(avoidance.condition),
      coverage: avoidance.coverage,
      depth: avoidance.depth,
      coveredDates: avoidance.coveredDates,
      rarity,
      nextGame,
    };
  }

  const forced = findForcedCondition(records);
  if (!forced) {
    // wins >= 1이면 항상 완전승요 또는 부분승요 후보가 나오므로 이론상 도달하지 않음
    return { status: "판독보류", totalGames: nonTie.length, wins, losses, ties };
  }

  if (forced.type === "완전승요") {
    return {
      status: "완전승요",
      totalGames: nonTie.length,
      wins,
      losses,
      ties,
      condition: [],
      coverage: forced.coverage,
      depth: 0,
      coveredDates: forced.coveredDates,
    };
  }

  const rarity = computeRarity(forced.condition, teamGames);
  const nextGame = findNextMatchingGame(forced.condition, upcomingGames);

  return {
    status: "부분승요",
    totalGames: nonTie.length,
    wins,
    losses,
    ties,
    condition: forced.condition,
    conditionText: conditionToText(forced.condition),
    coverage: forced.coverage,
    depth: forced.depth,
    coveredDates: forced.coveredDates,
    rarity,
    nextGame,
  };
}
