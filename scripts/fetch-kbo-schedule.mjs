#!/usr/bin/env node
/**
 * KBO 2026시즌 전체 일정/결과를 수집해 src/data/kbo-schedule.json으로 정리한다.
 *
 * 데이터 출처: Naver Sports 비공개 스케줄 API (api-gw.sports.naver.com).
 * 이 API는 서비스 이용약관에 "사전 동의 없는 자동화 수단(로봇/스크레이퍼) 사용 금지" 조항이
 * 명시되어 있다. 개인/비영리 팬 프로젝트, 저빈도(하루 1회) 배치, 로컬 캐싱을 전제로
 * 사용자 승인 하에 사용한다. 서버 부하를 최소화하기 위해:
 *   - 7일 단위로 나눠서 요청 (Naver API가 7일 초과 범위는 앞 이틀치만 반환하는 것으로 확인됨)
 *   - 요청 사이 딜레이(POLITE_DELAY_MS)
 *   - 이미 "확정"된(과거, 전부 RESULT 상태) 주간은 캐시에서 재사용하고 재요청하지 않음
 *     (현재/미래 주간만 매일 재요청 -> "하루 1회 배치" 목적에 부합)
 *
 * 실행: node scripts/fetch-kbo-schedule.mjs
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, "data", "kbo-cache");
const OUT_FILE = path.join(ROOT, "src", "data", "kbo-schedule.json");

const SEASON_START = "2026-03-01";
const SEASON_END = "2026-11-01"; // 넉넉히 잡음. 시즌 종료 이후 구간은 빈 응답이라 비용이 거의 없음.
const POLITE_DELAY_MS = 400;
const USER_AGENT = "seungyo-pandokgi-fetcher/1.0 (non-commercial fan project; daily batch fetch)";

const TEAM_IDS = ["삼성", "LG", "키움", "두산", "롯데", "SSG", "한화", "NC", "KIA", "KT"];

const STADIUM_BY_TEAM = {
  삼성: "대구",
  LG: "잠실",
  두산: "잠실",
  키움: "고척",
  롯데: "사직",
  SSG: "인천",
  한화: "대전",
  NC: "창원",
  KIA: "광주",
  KT: "수원",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function* weekWindows(start, end) {
  let cursor = start;
  while (cursor <= end) {
    const weekEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    yield { from: cursor, to: weekEnd };
    cursor = addDays(weekEnd, 1);
  }
}

async function fetchWeek(from, to) {
  const url = `https://api-gw.sports.naver.com/schedule/games?fromDate=${from}&toDate=${to}&upperCategoryId=kbaseball&categoryId=kbo&size=200`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Naver API 응답 실패 ${res.status} (${from}~${to})`);
  const data = await res.json();
  return data.result?.games ?? [];
}

/** 캐시된 주간 데이터가 "확정"인지 판단: 오늘보다 완전히 과거이고, 모든 경기가 RESULT/CANCEL이면 재요청 불필요 */
function isFinalWeek(games, weekTo, today) {
  if (weekTo >= today) return false;
  if (games.length === 0) return false; // 빈 캐시는 신뢰하지 않고 재확인
  return games.every((g) => g.statusCode === "RESULT" || g.statusCode === "CANCEL");
}

async function loadCachedWeek(from) {
  const file = path.join(CACHE_DIR, `${from}.json`);
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCachedWeek(from, games) {
  const file = path.join(CACHE_DIR, `${from}.json`);
  await writeFile(file, JSON.stringify(games, null, 2), "utf-8");
}

async function collectAllGames() {
  await mkdir(CACHE_DIR, { recursive: true });
  const today = todayStr();
  const allGames = [];
  let networkRequests = 0;

  for (const { from, to } of weekWindows(SEASON_START, SEASON_END)) {
    const cached = await loadCachedWeek(from);
    if (cached && isFinalWeek(cached, to, today)) {
      allGames.push(...cached);
      continue;
    }
    await sleep(POLITE_DELAY_MS);
    const games = await fetchWeek(from, to);
    networkRequests++;
    await saveCachedWeek(from, games);
    allGames.push(...games);
    process.stdout.write(`  [fetch] ${from} ~ ${to}: ${games.length}경기\n`);
  }

  console.log(`네트워크 요청 ${networkRequests}회 (나머지는 캐시 재사용)`);
  return allGames;
}

/** 팀 관점으로 경기를 펼친다: 한 경기 -> 홈팀 레코드 1개 + 원정팀 레코드 1개 */
function toTeamPerspectiveGames(rawGames) {
  const perTeam = Object.fromEntries(TEAM_IDS.map((id) => [id, []]));

  for (const g of rawGames) {
    if (g.cancel) continue;
    const { homeTeamName, awayTeamName, homeTeamScore, awayTeamScore, gameDate, statusCode, winner } = g;
    if (!TEAM_IDS.includes(homeTeamName) || !TEAM_IDS.includes(awayTeamName)) continue;

    const isFuture = statusCode !== "RESULT";
    let homeResult = null;
    let awayResult = null;
    if (!isFuture) {
      if (winner === "HOME") {
        homeResult = "승";
        awayResult = "패";
      } else if (winner === "AWAY") {
        homeResult = "패";
        awayResult = "승";
      } else {
        homeResult = "무";
        awayResult = "무";
      }
    }

    perTeam[homeTeamName].push({
      date: gameDate,
      홈원정: "홈",
      상대팀: awayTeamName,
      구장: STADIUM_BY_TEAM[homeTeamName],
      result: homeResult,
      score: isFuture ? null : { my: homeTeamScore, opp: awayTeamScore },
    });
    perTeam[awayTeamName].push({
      date: gameDate,
      홈원정: "원정",
      상대팀: homeTeamName,
      구장: STADIUM_BY_TEAM[homeTeamName],
      result: awayResult,
      score: isFuture ? null : { my: awayTeamScore, opp: homeTeamScore },
    });
  }

  for (const id of TEAM_IDS) {
    perTeam[id].sort((a, b) => a.date.localeCompare(b.date));
    perTeam[id] = computeSeriesAndStreak(perTeam[id]);
  }
  return perTeam;
}

/** 같은 상대팀 연속 등장 = 시리즈. 시리즈차수는 미래 경기도 계산 가능(일정만 있으면 됨).
 *  직전연승/연패 스트릭은 실제 결과가 필요하므로 완료된 경기까지만 갱신하고, 미완료 경기엔 기록하지 않는다
 *  (analyzer의 kboFeatureTrueForSingleDate가 미래 날짜의 스트릭 피처를 항상 false로 보수 처리하므로 무해함). */
function computeSeriesAndStreak(games) {
  let prevOpponent = null;
  let seriesNo = 0;
  let streak = 0;

  return games.map((g) => {
    seriesNo = g.상대팀 !== prevOpponent ? 1 : seriesNo + 1;
    prevOpponent = g.상대팀;

    const out = { ...g, 시리즈차수: seriesNo };
    if (g.result !== null) {
      out.직전연승중 = streak >= 2;
      out.직전연패중 = streak <= -2;
      if (g.result === "승") streak = streak >= 0 ? streak + 1 : 1;
      else if (g.result === "패") streak = streak <= 0 ? streak - 1 : -1;
      else streak = 0;
    }
    return out;
  });
}

async function main() {
  console.log("KBO 2026 시즌 일정 수집 시작...");
  const rawGames = await collectAllGames();
  const perTeam = toTeamPerspectiveGames(rawGames);

  const resultDates = rawGames.filter((g) => g.statusCode === "RESULT").map((g) => g.gameDate);
  const updatedThrough = resultDates.length > 0 ? resultDates.sort().at(-1) : null;

  const output = {
    generatedAt: new Date().toISOString(),
    updatedThrough,
    seasonStart: SEASON_START,
    seasonEnd: SEASON_END,
    source: "Naver Sports (api-gw.sports.naver.com/schedule/games)",
    teams: perTeam,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(output), "utf-8");

  for (const id of TEAM_IDS) {
    const games = perTeam[id];
    const played = games.filter((g) => g.result !== null);
    console.log(`  ${id}: 총 ${games.length}경기 (완료 ${played.length}, 예정 ${games.length - played.length})`);
  }
  console.log(`완료. 결과 반영 기준일: ${updatedThrough}`);
  console.log(`출력: ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
