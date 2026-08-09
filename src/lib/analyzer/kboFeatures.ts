// B그룹: KBO 경기 데이터 피처 (analyzer.py build_kbo_feature_matrix / kbo_data.py compute_series_and_streak 포팅)

import type { FeatureMap, KboGame } from "./types";

// 구장은 탐색 가능한 조건에서 제외한다 (홈원정 여부로 대체 표현되고, 표시용 텍스트에서는
// KboGame.구장 값을 그대로 쓴다 — cardEvidence.ts / NextBox 참고).
const CATEGORICAL_KEYS = ["홈원정", "상대팀", "시리즈차수"] as const;
const BOOLEAN_KEYS = ["직전연승중", "직전연패중"] as const;

/** kboRawList: [game 또는 null, ...] -> boolean 피처 매트릭스 (데이터셋 전체 기준 통일된 one-hot) */
export function buildKboFeatureMatrix(kboRawList: (KboGame | null)[]): FeatureMap[] {
  const valid = kboRawList.filter((g): g is KboGame => g !== null);
  const uniqueValues: Record<string, string[]> = {};
  for (const key of CATEGORICAL_KEYS) {
    const set = new Set(valid.map((g) => String(g[key])));
    uniqueValues[key] = Array.from(set).sort();
  }

  return kboRawList.map((g) => {
    const feats: FeatureMap = {};
    if (g === null) {
      for (const key of BOOLEAN_KEYS) feats[key] = false;
      for (const key of CATEGORICAL_KEYS) {
        for (const v of uniqueValues[key]) feats[`${key}=${v}`] = false;
      }
    } else {
      for (const key of BOOLEAN_KEYS) feats[key] = Boolean(g[key]);
      for (const key of CATEGORICAL_KEYS) {
        for (const v of uniqueValues[key]) feats[`${key}=${v}`] = String(g[key]) === v;
      }
    }
    return feats;
  });
}

/** 같은 상대팀이 연속 등장하면 같은 시리즈로 보고 시리즈차수/직전 연승·연패 스트릭을 계산한다. games는 날짜 오름차순이어야 함. */
export function computeSeriesAndStreak(games: KboGame[]): KboGame[] {
  let prevOpponent: string | null = null;
  let seriesNo = 0;
  let streak = 0; // 양수=연승, 음수=연패, 0=시작

  return games.map((g) => {
    seriesNo = g.상대팀 !== prevOpponent ? 1 : seriesNo + 1;
    prevOpponent = g.상대팀;

    const 직전연승중 = streak >= 2;
    const 직전연패중 = streak <= -2;

    if (g.result === "승") {
      streak = streak >= 0 ? streak + 1 : 1;
    } else if (g.result === "패") {
      streak = streak <= 0 ? streak - 1 : -1;
    } else {
      streak = 0;
    }

    return { ...g, 시리즈차수: seriesNo, 직전연승중, 직전연패중 };
  });
}

/** 단일 경기(KBO 정보 포함)에 대해 B그룹 피처 하나가 참인지 판정. 완료된 경기는 실제 계산된
 * 스트릭 값을 쓰고, 아직 결과가 없는 미래 경기는 필드 자체가 없어(undefined) 자동으로 false 처리된다
 * (미래 스트릭은 알 수 없으므로 보수적으로 false여야 함 — computeSeriesAndStreak 참고). */
export function kboFeatureTrueForSingleDate(fname: string, game: KboGame): boolean | null {
  if (fname.startsWith("홈원정=")) return game.홈원정 === fname.split("=")[1];
  if (fname.startsWith("상대팀=")) return game.상대팀 === fname.split("=")[1];
  if (fname.startsWith("시리즈차수=")) return String(game.시리즈차수 ?? "") === fname.split("=")[1];
  if (fname === "직전연승중") return Boolean(game.직전연승중);
  if (fname === "직전연패중") return Boolean(game.직전연패중);
  return null; // KBO 피처가 아님
}
