// 피처 카테고리 태깅 + 우선순위 티어 (analyzer.py 1.5절 포팅)

/** 티어가 낮을수록(숫자 작을수록) "공감 가는" 카테고리, 높을수록 "억지스러운" 카테고리 */
export const CATEGORY_TIER: Record<string, number> = {
  // 티어 1: KBO 경기조건 (구장은 조건 탐색에서 제외 — 홈원정 정보로 표시 시점에 역산)
  홈원정: 1,
  상대팀: 1,
  시리즈차수: 1,
  선발투수: 1,
  연승연패: 1,
  낮밤경기: 1,

  // 티어 2: 캘린더/미신
  요일: 2,
  주말여부: 2,
  손없는날: 2,
  월령: 2, // 미구현, 자리만

  // 티어 3: 날짜 사칙연산
  월홀짝: 3,
  일홀짝: 3,
  월일덧셈: 3,
  월일곱셈: 3,
  월일차: 3,
  팰린드롬: 3,

  // 티어 4: 숫자놀이 (가장 추상적, 억지력 최고)
  월일자체숫자: 4,
  자릿수합: 4,

  기타: 3,
};

export function getFeatureCategory(fname: string): string {
  if (fname.startsWith("요일=")) return "요일";
  if (fname === "주말여부" || fname === "평일여부") return "주말여부";
  if (fname === "월_짝수" || fname === "월_홀수") return "월홀짝";
  if (fname === "일_짝수" || fname === "일_홀수") return "일홀짝";
  if (fname.startsWith("월일자체_숫자")) return "월일자체숫자";
  if (fname.startsWith("월일덧셈_숫자") || fname.startsWith("월일합=")) return "월일덧셈";
  if (fname === "월일합_짝수" || fname === "월일합_3의배수") return "월일덧셈";
  if (fname.startsWith("월일곱셈_숫자") || fname.startsWith("월일곱=")) return "월일곱셈";
  if (fname.startsWith("자릿수합_숫자") || fname.startsWith("자릿수합=")) return "자릿수합";
  if (fname.startsWith("월일차=")) return "월일차";
  if (fname === "팰린드롬_월일") return "팰린드롬";
  if (fname === "손없는날_근사") return "손없는날";
  if (fname.startsWith("홈원정=")) return "홈원정";
  if (fname.startsWith("상대팀=")) return "상대팀";
  if (fname.startsWith("시리즈차수=")) return "시리즈차수";
  if (fname === "직전연승중" || fname === "직전연패중") return "연승연패";
  return "기타";
}

export function getCategoryTier(category: string): number {
  return CATEGORY_TIER[category] ?? 3;
}

/**
 * 조건(피처 조합)의 우선순위 점수. 낮을수록 좋음(더 그럴듯함/공감 가능).
 * [최소티어, 평균티어] 튜플. 정렬 시 min으로 우선, 동률이면 avg로 비교.
 */
export function conditionPriorityScore(condition: readonly string[]): [number, number] {
  const tiers = condition.map((f) => getCategoryTier(getFeatureCategory(f)));
  const min = Math.min(...tiers);
  const avg = tiers.reduce((a, b) => a + b, 0) / tiers.length;
  return [min, avg];
}

/** 조건(피처 조합)에 서로 다른 카테고리가 몇 개 섞였는지 */
export function diversityScore(condition: readonly string[]): number {
  return new Set(condition.map(getFeatureCategory)).size;
}
