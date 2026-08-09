// KBO 10구단 메타 정보 (팀명, 코드, 홈구장, 팀컬러)
// 팀컬러는 승요 판독기.dc.html의 teamData를 그대로 따른다 (claude design 폴더, 최신 디자인 기준).

export interface TeamMeta {
  id: string; // 표준 키 = Naver API의 team 이름과 동일. public/team-logos/{id}.svg 파일명과도 일치.
  fullName: string;
  stadium: string; // 홈구장
  colorMain: string; // 팀 배지 색상. 카드 헤더 그라디언트는 deriveHeaderGradient()로 여기서 계산.
}

export const TEAMS: TeamMeta[] = [
  { id: "삼성", fullName: "삼성 라이온즈", stadium: "대구", colorMain: "#002D72" },
  { id: "LG", fullName: "LG 트윈스", stadium: "잠실", colorMain: "#C30452" },
  { id: "키움", fullName: "키움 히어로즈", stadium: "고척", colorMain: "#8E1834" },
  { id: "두산", fullName: "두산 베어스", stadium: "잠실", colorMain: "#131230" },
  { id: "롯데", fullName: "롯데 자이언츠", stadium: "사직", colorMain: "#041E42" },
  { id: "SSG", fullName: "SSG 랜더스", stadium: "인천", colorMain: "#CE0E2D" },
  { id: "한화", fullName: "한화 이글스", stadium: "대전", colorMain: "#FF6600" },
  { id: "NC", fullName: "NC 다이노스", stadium: "창원", colorMain: "#315288" },
  { id: "KIA", fullName: "KIA 타이거즈", stadium: "광주", colorMain: "#C11A1A" },
  { id: "KT", fullName: "KT 위즈", stadium: "수원", colorMain: "#333333" },
];

export const TEAM_IDS = TEAMS.map((t) => t.id);

export function getTeamMeta(id: string): TeamMeta | undefined {
  return TEAMS.find((t) => t.id === id);
}
