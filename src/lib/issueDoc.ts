// 결과 카드 상단의 "발급번호 / 발급일" 라인 (claude design/승요 판독기.dc.html 신규 추가 요소).
// 근엄한 공문서 톤을 강화하기 위한 장식 요소라 진짜 발급 시스템은 없다 — 입력값으로부터
// 결정론적으로 계산해 같은 직관 기록이면 항상 같은 번호가 나오게만 한다.

export function buildIssueNumber(teamId: string, seedDates: readonly string[], status: string): string {
  const seed = `${teamId}|${status}|${seedDates.join(",")}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) >>> 0;
  }
  const year = new Date().getFullYear();
  return `KBO-${year}-${String(hash % 100000).padStart(5, "0")}`;
}

export function formatIssueDate(dateStr: string): string {
  return dateStr.replaceAll("-", ".");
}
