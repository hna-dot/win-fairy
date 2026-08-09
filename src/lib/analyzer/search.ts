// 탐색 알고리즘 (analyzer.py find_forced_condition / _search 포팅)
// SPEC 3.4: 승요 조건은 커버리지를 최대→최소로 낮춰가며 depth 1~3(예외 시 4)을 탐색.
// 패배방지 모드는 대칭이지만 대조군이 없어 "진 날 전체를 100% 커버"하는 조건만 채택한다.

import { conditionPriorityScore, diversityScore } from "./categories";
import type { AnalysisRecord, AvoidanceResult, ConditionResult } from "./types";

/** 표준 조합 생성기. 결과를 배열로 한번에 만들지 않고 지연 생성해 depth3~4 탐색에서도 메모리를 아낀다. */
function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  const n = arr.length;
  if (k > n || k <= 0) return;
  const indices = Array.from({ length: k }, (_, i) => i);
  for (;;) {
    yield indices.map((i) => arr[i]);
    let i = k - 1;
    while (i >= 0 && indices[i] === i + n - k) i--;
    if (i < 0) return;
    indices[i]++;
    for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
  }
}

type KeyElem = number | string[];

function compareKeyElem(a: KeyElem, b: KeyElem): number {
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] === undefined) return -1;
      if (b[i] === undefined) return 1;
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  }
  return (a as number) - (b as number);
}

function compareKeys(a: KeyElem[], b: KeyElem[]): number {
  for (let i = 0; i < a.length; i++) {
    const c = compareKeyElem(a[i], b[i]);
    if (c !== 0) return c;
  }
  return 0;
}

function argMinBy<T>(items: T[], keyFn: (item: T) => KeyElem[]): T {
  let best = items[0];
  let bestKey = keyFn(best);
  for (let i = 1; i < items.length; i++) {
    const key = keyFn(items[i]);
    if (compareKeys(key, bestKey) < 0) {
      best = items[i];
      bestKey = key;
    }
  }
  return best;
}

interface Candidate {
  condition: string[];
  coverage: number;
  depth: number;
  coveredDates: string[];
  diversity: number;
}

/** 최종 후보 선택: coverage 큰 것 > 티어 낮은(공감가는) 것 > depth 얕은(간결한) 것 > 다양성 높은 것 > 이름순 */
function pickBest(candidates: Candidate[]): Candidate {
  return argMinBy(candidates, (c) => {
    const [minTier, avgTier] = conditionPriorityScore(c.condition);
    return [-c.coverage, minTier, avgTier, c.depth, -c.diversity, [...c.condition].sort()];
  });
}

function searchWinCondition(
  records: AnalysisRecord[],
  maxDepth: number,
  minCoverageFloor: number,
): ConditionResult | null {
  const wins = records.filter((r) => r.result === "승");
  const losses = records.filter((r) => r.result === "패");
  if (wins.length === 0) return null;
  if (losses.length === 0) {
    return {
      type: "완전승요",
      coverage: wins.length,
      condition: [],
      depth: 0,
      coveredDates: wins.map((w) => w.date),
    };
  }

  const allFeatureNames = Object.keys(wins[0].features).sort();
  const maxCoverage = wins.length;

  for (let targetCoverage = maxCoverage; targetCoverage >= minCoverageFloor; targetCoverage--) {
    const candidates: Candidate[] = [];
    for (let depth = 1; depth <= maxDepth; depth++) {
      for (const combo of combinations(allFeatureNames, depth)) {
        const coveredWins = wins.filter((r) => combo.every((f) => r.features[f]));
        if (coveredWins.length < targetCoverage) continue;
        const coveredLosses = losses.filter((r) => combo.every((f) => r.features[f]));
        if (coveredLosses.length > 0) continue;
        candidates.push({
          condition: combo,
          coverage: coveredWins.length,
          depth,
          coveredDates: coveredWins.map((r) => r.date),
          diversity: diversityScore(combo),
        });
      }
    }
    if (candidates.length > 0) {
      const best = pickBest(candidates);
      return { type: "부분승요", ...best };
    }
  }
  return null;
}

/**
 * 승요 조건 탐색 (SPEC 3.4). 기본 depth 3까지, 하나도 못 찾으면 depth 4로 한 번 더 시도.
 * records에 승리가 없으면 null (패배방지 모드로 별도 처리할 것).
 */
export function findForcedCondition(
  records: AnalysisRecord[],
  maxDepth = 3,
  minCoverageFloor = 1,
  fallbackMaxDepth = 4,
): ConditionResult | null {
  const result = searchWinCondition(records, maxDepth, minCoverageFloor);
  if (result !== null) return result;
  if (maxDepth < fallbackMaxDepth) {
    return searchWinCondition(records, fallbackMaxDepth, minCoverageFloor);
  }
  return null;
}

function searchAvoidanceCondition(records: AnalysisRecord[], maxDepth: number): AvoidanceResult | null {
  const losses = records.filter((r) => r.result === "패");
  if (losses.length === 0) return null;

  const allFeatureNames = Object.keys(losses[0].features).sort();
  const candidates: Candidate[] = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    for (const combo of combinations(allFeatureNames, depth)) {
      const coveredLosses = losses.filter((r) => combo.every((f) => r.features[f]));
      if (coveredLosses.length !== losses.length) continue; // 대조군 없이 진 날 전체를 100% 커버해야 함
      candidates.push({
        condition: combo,
        coverage: coveredLosses.length,
        depth,
        coveredDates: coveredLosses.map((r) => r.date),
        diversity: diversityScore(combo),
      });
    }
  }
  if (candidates.length === 0) return null;
  const best = pickBest(candidates);
  return { type: "패배방지", ...best };
}

/**
 * 패배방지(회피) 조건 탐색 (SPEC 3.4 대칭 로직). 승리 기록이 전혀 없을 때(패 전용)만 호출한다.
 * 대조군이 없으므로 부분 커버리지는 인정하지 않고, 진 날 전체를 100% 설명하는 조건만 채택한다.
 */
export function findAvoidanceCondition(
  records: AnalysisRecord[],
  maxDepth = 3,
  fallbackMaxDepth = 4,
): AvoidanceResult | null {
  const result = searchAvoidanceCondition(records, maxDepth);
  if (result !== null) return result;
  if (maxDepth < fallbackMaxDepth) {
    return searchAvoidanceCondition(records, fallbackMaxDepth);
  }
  return null;
}
