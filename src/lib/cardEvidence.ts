// 결과 카드 "근거" 라인 포맷터. 조건 종류(KBO 조건이든 날짜 계산이든)와 무관하게 항상
// 실제 경기 정보(상대팀·구장·시리즈차수)로 통일해서 보여준다 — 어떤 조건이었든 결국
// "이 날짜에 실제로 있었던 경기"를 보여주는 게 가장 일관되고 유용하기 때문.

import { extractRawValues } from "./analyzer/dateFeatures";
import type { DateStr, KboGame } from "./analyzer/types";

const WEEKDAY_LABEL: Record<string, string> = {
  월: "월", 화: "화", 수: "수", 목: "목", 금: "금", 토: "토", 일: "일",
};

function mmdd(date: DateStr): string {
  const [, m, d] = date.split("-");
  return `${m}/${d}`;
}

/** 이 날짜에 실제로 있었던 경기 정보 (오른쪽 컬럼). kboGame이 없는 예외적인 경우엔 요일만 표기. */
export function buildEvidenceValue(date: DateStr, kboGame?: KboGame): string {
  if (kboGame) {
    return `${kboGame.상대팀}전 · ${kboGame.구장} · ${kboGame.시리즈차수 ?? "?"}차전`;
  }
  const raw = extractRawValues(date);
  return `${WEEKDAY_LABEL[raw.요일] ?? raw.요일}요일`;
}

/** 왼쪽 컬럼: MM/DD + (홈/원정 또는 요일) */
export function buildEvidenceLabel(date: DateStr, kboGame?: KboGame): string {
  const raw = extractRawValues(date);
  const suffix = kboGame ? kboGame.홈원정 : `(${WEEKDAY_LABEL[raw.요일] ?? raw.요일})`;
  return `${mmdd(date)} ${suffix}`;
}

/** 완전승요 카드 전용: "MM/DD vs 상대팀" / "홈원정 · 승" 형태 */
export function buildFullVerdictEvidenceRow(date: DateStr, kboGame?: KboGame): { label: string; value: string } {
  if (kboGame) {
    return { label: `${mmdd(date)} vs ${kboGame.상대팀}`, value: `${kboGame.홈원정} · 승` };
  }
  const raw = extractRawValues(date);
  return { label: `${mmdd(date)} (${raw.요일})`, value: "승" };
}
