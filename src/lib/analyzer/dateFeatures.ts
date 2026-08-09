// A그룹: 날짜 계산 + 캘린더 피처 (analyzer.py extract_raw_values / build_feature_matrix 포팅)

import type { DateStr, FeatureMap, RawDateFeatures } from "./types";

export const WEEKDAY_KR = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function parseYMD(dateStr: DateStr): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

/** Python date.weekday(): 월요일=0 ... 일요일=6. UTC 고정으로 계산해 로컬 타임존 영향을 받지 않는다. */
export function pyWeekday(y: number, m: number, d: number): number {
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=일 ... 6=토
  return (jsDay + 6) % 7;
}

function digitSumReduce(n: number): number {
  n = Math.abs(n);
  while (n >= 10) {
    n = String(n)
      .split("")
      .reduce((sum, ch) => sum + Number(ch), 0);
  }
  return n;
}

function reverseStr(s: string): string {
  return s.split("").reverse().join("");
}

export function extractRawValues(dateStr: DateStr): RawDateFeatures {
  const { y, m, d } = parseYMD(dateStr);
  const weekdayIdx = pyWeekday(y, m, d);

  const monthPlusDay = m + d;
  const monthTimesDay = m * d;
  const monthMinusDay = Math.abs(m - d);
  const digitSum = digitSumReduce(monthPlusDay);

  const isPalindromeMd = String(m) === reverseStr(String(d)) || String(d) === reverseStr(String(m));

  return {
    요일: WEEKDAY_KR[weekdayIdx],
    주말여부: weekdayIdx >= 5,
    평일여부: weekdayIdx < 5,
    일_짝수: d % 2 === 0,
    일_홀수: d % 2 === 1,
    월_짝수: m % 2 === 0,
    월_홀수: m % 2 === 1,
    월일합: monthPlusDay,
    월일합_짝수: monthPlusDay % 2 === 0,
    월일합_3의배수: monthPlusDay % 3 === 0,
    월일곱: monthTimesDay,
    월일차: monthMinusDay,
    자릿수합: digitSum,
    팰린드롬_월일: isPalindromeMd,
    손없는날_근사: d % 10 === 9 || d % 10 === 0,
    _month: m,
    _day: d,
  };
}

const CATEGORICAL_KEYS = ["요일", "월일합", "월일곱", "월일차", "자릿수합"] as const;
const BOOLEAN_KEYS = [
  "주말여부",
  "평일여부",
  "일_짝수",
  "일_홀수",
  "월_짝수",
  "월_홀수",
  "월일합_짝수",
  "월일합_3의배수",
  "팰린드롬_월일",
  "손없는날_근사",
] as const;
const DIGIT_SOURCE_KEYS: Record<string, keyof RawDateFeatures> = {
  월일덧셈: "월일합",
  월일곱셈: "월일곱",
  자릿수합: "자릿수합",
};

/**
 * raw_list 전체를 보고 카테고리형 값들을 일관된 one-hot 피처로 변환한다.
 * (데이터셋 전체 기준으로 유니크 값을 모으는 방식이라 build_feature_matrix는 항상 전체 리스트를 받는다)
 */
export function buildFeatureMatrix(rawList: RawDateFeatures[]): FeatureMap[] {
  const uniqueValues: Record<string, string[]> = {};
  for (const key of CATEGORICAL_KEYS) {
    const set = new Set(rawList.map((r) => String(r[key])));
    uniqueValues[key] = Array.from(set).sort();
  }

  return rawList.map((raw) => {
    const feats: FeatureMap = {};
    for (const key of BOOLEAN_KEYS) {
      feats[key] = raw[key] as boolean;
    }
    for (const key of CATEGORICAL_KEYS) {
      for (const v of uniqueValues[key]) {
        feats[`${key}=${v}`] = String(raw[key]) === v;
      }
    }
    for (let n = 0; n <= 9; n++) {
      feats[`월일자체_숫자${n}포함`] =
        String(raw._month).includes(String(n)) || String(raw._day).includes(String(n));
    }
    for (const [label, sourceKey] of Object.entries(DIGIT_SOURCE_KEYS)) {
      const value = raw[sourceKey];
      for (let n = 0; n <= 9; n++) {
        feats[`${label}_숫자${n}포함`] = String(value).includes(String(n));
      }
    }
    return feats;
  });
}

/** 단일 미래 날짜에 대해 A그룹 피처 하나가 참인지 재계산 방식으로 판정 (one-hot 매트릭스 없이) */
export function dateFeatureTrueForSingleDate(fname: string, dateStr: DateStr): boolean | null {
  const raw = extractRawValues(dateStr);
  const { m, d } = parseYMD(dateStr);

  if (fname.startsWith("요일=")) return raw.요일 === fname.split("=")[1];
  if (fname === "주말여부") return raw.주말여부;
  if (fname === "평일여부") return raw.평일여부;
  if (fname === "월_짝수") return m % 2 === 0;
  if (fname === "월_홀수") return m % 2 === 1;
  if (fname === "일_짝수") return d % 2 === 0;
  if (fname === "일_홀수") return d % 2 === 1;
  if (fname.startsWith("월일합=")) return raw.월일합 === Number(fname.split("=")[1]);
  if (fname === "월일합_짝수") return raw.월일합_짝수;
  if (fname === "월일합_3의배수") return raw.월일합_3의배수;
  if (fname.startsWith("월일곱=")) return raw.월일곱 === Number(fname.split("=")[1]);
  if (fname.startsWith("월일차=")) return raw.월일차 === Number(fname.split("=")[1]);
  if (fname.startsWith("자릿수합=")) return raw.자릿수합 === Number(fname.split("=")[1]);
  if (fname === "팰린드롬_월일") return raw.팰린드롬_월일;
  if (fname === "손없는날_근사") return raw.손없는날_근사;
  if (fname.startsWith("월일자체_숫자")) {
    const n = fname.replace("월일자체_숫자", "").replace("포함", "");
    return String(m).includes(n) || String(d).includes(n);
  }
  if (fname.startsWith("월일덧셈_숫자")) {
    const n = fname.replace("월일덧셈_숫자", "").replace("포함", "");
    return String(raw.월일합).includes(n);
  }
  if (fname.startsWith("월일곱셈_숫자")) {
    const n = fname.replace("월일곱셈_숫자", "").replace("포함", "");
    return String(raw.월일곱).includes(n);
  }
  if (fname.startsWith("자릿수합_숫자")) {
    const n = fname.replace("자릿수합_숫자", "").replace("포함", "");
    return String(raw.자릿수합).includes(n);
  }
  return null; // A그룹 피처가 아님 (KBO 피처일 가능성 -> 호출부에서 처리)
}
