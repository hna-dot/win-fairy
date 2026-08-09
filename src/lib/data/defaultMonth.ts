import { monthOf } from "@/lib/dateUtil";
import type { DateStr, KboGame } from "@/lib/analyzer";

/**
 * 캘린더 기본 펼침 월 (SPEC 5, 8장 확정: 오늘이 시즌 중이면 오늘이 속한 달,
 * 비시즌이면 지난 시즌 마지막 달을 기본으로 연다).
 */
export function getDefaultMonth(teamGames: KboGame[], today: DateStr): { y: number; m: number } {
  if (teamGames.length === 0) {
    return monthOf(today);
  }
  const dates = teamGames.map((g) => g.date).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];

  if (today >= first && today <= last) return monthOf(today);
  if (today < first) return monthOf(first); // 시즌 개막 전: 데이터 확보된 가장 이른 달
  return monthOf(last); // 시즌 종료 후: 지난 시즌 마지막 달
}
