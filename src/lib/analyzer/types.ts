// 승요 판독기 알고리즘 타입 정의 (analyzer.py 1:1 대응)

export type GameResult = "승" | "패" | "무";

/** YYYY-MM-DD 형식의 날짜 문자열 */
export type DateStr = string;

/** 직관 기록 1건 (localStorage 저장 단위) */
export interface VisitRecord {
  date: DateStr;
  result: GameResult;
}

/** 실제 KBO 경기 데이터 1건 (시즌 일정, 팀 관점). 미래 경기는 result/score가 null. */
export interface KboGame {
  date: DateStr;
  홈원정: "홈" | "원정";
  상대팀: string;
  구장: string;
  result: GameResult | null;
  score?: { my: number; opp: number } | null;
  시리즈차수?: number;
  직전연승중?: boolean;
  직전연패중?: boolean;
}

/** 단일 날짜에서 뽑은 원시 값 (아직 one-hot 아님) */
export interface RawDateFeatures {
  요일: string;
  주말여부: boolean;
  평일여부: boolean;
  일_짝수: boolean;
  일_홀수: boolean;
  월_짝수: boolean;
  월_홀수: boolean;
  월일합: number;
  월일합_짝수: boolean;
  월일합_3의배수: boolean;
  월일곱: number;
  월일차: number;
  자릿수합: number;
  팰린드롬_월일: boolean;
  손없는날_근사: boolean;
  _month: number;
  _day: number;
}

/** 피처 이름 -> boolean */
export type FeatureMap = Record<string, boolean>;

/** 분석 대상 레코드 (승/패만, 무는 사전 제외) */
export interface AnalysisRecord {
  date: DateStr;
  result: "승" | "패";
  features: FeatureMap;
  kbo?: KboGame;
}

export type AnalysisType = "완전승요" | "부분승요" | "패배방지" | "판독보류";

export interface ConditionResult {
  type: "완전승요" | "부분승요";
  condition: string[];
  coverage: number;
  depth: number;
  coveredDates: DateStr[];
}

export interface AvoidanceResult {
  type: "패배방지";
  condition: string[];
  coverage: number;
  depth: number;
  coveredDates: DateStr[];
}

export interface RarityInfo {
  matched: number;
  total: number;
  ratio: number;
}

/** 판독 결과 카드 렌더링에 필요한 모든 데이터 (SPEC 4장 4종 카드에 대응) */
export interface AnalysisOutput {
  status: AnalysisType;
  totalGames: number; // 승+패 (무 제외, 판독보류 진행률의 분자)
  wins: number;
  losses: number;
  ties: number;
  condition?: string[];
  conditionText?: string;
  coverage?: number;
  depth?: number;
  coveredDates?: DateStr[];
  /** undefined = 해당 없음(완전승요/판독보류) */
  rarity?: RarityInfo | null;
  nextGame?: KboGame | null;
}
