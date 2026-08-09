"use client";

import { forwardRef, type ReactNode } from "react";
import type { AnalysisOutput } from "@/lib/analyzer";
import { buildConditionPhrases, rarityToStars } from "@/lib/analyzer";
import { buildEvidenceLabel, buildEvidenceValue, buildFullVerdictEvidenceRow } from "@/lib/cardEvidence";
import { deriveHeaderGradient } from "@/lib/colorGradient";
import { getGameOnDate } from "@/lib/data/schedule";
import type { TeamMeta } from "@/lib/data/teams";
import { buildIssueNumber, formatIssueDate } from "@/lib/issueDoc";
import StampSeal from "./StampSeal";

interface Props {
  team: TeamMeta;
  result: AnalysisOutput;
  today: string;
}

type Accent = "gold" | "red" | "stockblue" | "grey";

const ACCENT_HEX: Record<Accent, string> = {
  gold: "var(--gold)",
  red: "var(--red)",
  stockblue: "var(--stockblue)",
  grey: "var(--grey)",
};

const EYEBROW = "승 요 판 독 결 과";

/**
 * 도장 예외 레이아웃 트리거: 조건에 "숫자놀이" 계열 피처(자릿수합, 월일덧셈/월일곱셈/월일자체
 * 숫자포함)가 하나라도 섞여 있고 depth(조건 개수)가 2 이상이면 문구가 길어지기 쉬워서
 * 도장을 하단으로 옮긴다. 카테고리 자체(자릿수합=N 같은 정확값 매칭 포함)로 판단하며,
 * 월일합=N/월일곱=N 같은 정확값 매칭은 대상이 아니다(숫자 "포함 여부" 체크만 해당).
 */
function isNumerologyStampFeature(fname: string): boolean {
  return (
    fname.startsWith("자릿수합") ||
    fname.startsWith("월일덧셈_숫자") ||
    fname.startsWith("월일곱셈_숫자") ||
    fname.startsWith("월일자체_숫자")
  );
}

function statusMeta(status: AnalysisOutput["status"]): {
  accent: Accent;
  verdictLabel: string;
  hashtag: string;
} {
  switch (status) {
    case "완전승요":
      return {
        accent: "gold",
        verdictLabel: "FORCED VERDICT — 판독 결과",
        hashtag: "#완전승요 #직관필승",
      };
    case "부분승요":
      return {
        accent: "red",
        verdictLabel: "FORCED VERDICT — 판독 결과",
        hashtag: "#승요맞음 #직관필승",
      };
    case "패배방지":
      return {
        accent: "stockblue",
        verdictLabel: "AVOIDANCE VERDICT — 판독 결과",
        hashtag: "#회피경보 #패요탈출",
      };
    case "판독보류":
      return {
        accent: "grey",
        verdictLabel: "STATUS — 판독 보류",
        hashtag: "#예비승요 #수련중",
      };
  }
}

function StatRow({ big, sub }: { big: string; sub: string }) {
  return (
    <div className="mt-2.5 mb-[7px] flex items-baseline gap-2.5 border-t border-dashed border-line pt-2.5">
      <div className="font-display text-[29px] font-bold">{big}</div>
      <div className="text-[11px] text-[#5c563f]">{sub}</div>
    </div>
  );
}

function RarityRow({ accent, label, result }: { accent: Accent; label: string; result: AnalysisOutput }) {
  if (result.rarity === undefined) return null;
  if (result.rarity === null) return null; // 팀 일정 데이터가 없는 예외 상황
  const pct = (result.rarity.ratio * 100).toFixed(1);
  return (
    <div className="my-0.5 flex items-center gap-2 text-[10.5px] text-[#5c563f]">
      <span className="text-[#8a8266]">{label}</span>
      <span className="tracking-[2px] text-[12.5px]" style={{ color: ACCENT_HEX[accent] }}>
        {rarityToStars(result.rarity.ratio)}
      </span>
      <span>
        (시즌 {result.rarity.total}경기 중 {result.rarity.matched}경기, {pct}%)
      </span>
    </div>
  );
}

const EVIDENCE_MAX_ROWS = 8;

function EvidenceBlock({ teamId, result }: { teamId: string; result: AnalysisOutput }) {
  if (!result.coveredDates || result.coveredDates.length === 0) return null;
  const isFullSweep = result.status === "완전승요";
  const shownDates = result.coveredDates.slice(0, EVIDENCE_MAX_ROWS);
  const hiddenCount = result.coveredDates.length - shownDates.length;
  return (
    <div className="mt-[9px] space-y-[3px] border-t border-dashed border-line pt-[9px] text-[10px] leading-[1.8] text-[#4a4636]">
      {shownDates.map((date) => {
        const kboGame = getGameOnDate(teamId, date);
        if (isFullSweep) {
          const row = buildFullVerdictEvidenceRow(date, kboGame);
          return (
            <div key={date} className="flex justify-between gap-2">
              <span className="whitespace-nowrap text-[#8a8266]">{row.label}</span>
              <span className="text-right">{row.value}</span>
            </div>
          );
        }
        const label = buildEvidenceLabel(date, kboGame);
        const value = buildEvidenceValue(date, kboGame);
        return (
          <div key={date} className="flex justify-between gap-2">
            <span className="whitespace-nowrap text-[#8a8266]">{label}</span>
            <span className="text-right">{value}</span>
          </div>
        );
      })}
      {hiddenCount > 0 && <div className="text-[#8a8266]">외 {hiddenCount}경기 더</div>}
    </div>
  );
}

function NextBox({ accent, result, team }: { accent: Accent; result: AnalysisOutput; team: TeamMeta }) {
  const color = ACCENT_HEX[accent];
  let boxLabel: string;
  let dateLine: string;
  let descLine: string;

  if (result.status === "완전승요") {
    boxLabel = "다음 경기 전망";
    dateLine = "당장 다음 경기";
    descLine = `${team.fullName}는 당신의 힘이 필요합니다.`;
  } else if (result.status === "부분승요") {
    boxLabel = "다음 승요 확정처";
    if (!result.nextGame) {
      dateLine = "조건에 맞는 예정 경기 없음";
      descLine = "발표된 일정 범위 내에서는 찾지 못함";
    } else {
      dateLine = formatUpcomingDate(result.nextGame.date, result.nextGame.홈원정);
      descLine = `${result.nextGame.구장} · 조건 100% 충족`;
    }
  } else {
    boxLabel = "다음 회피 대상 경기";
    if (!result.nextGame) {
      dateLine = "조건에 맞는 예정 경기 없음";
      descLine = "발표된 일정 범위 내에서는 찾지 못함";
    } else {
      dateLine = formatUpcomingDate(result.nextGame.date, result.nextGame.홈원정);
      descLine = `${result.nextGame.구장} · 직관 자제 권고`;
    }
  }

  return (
    <div className="mt-[9px] flex items-center justify-between gap-2 rounded-[7px] border border-dashed px-3 py-2.5" style={{ borderColor: color }}>
      <div>
        <div className="font-display text-[8.5px] font-bold tracking-[0.08em]" style={{ color }}>
          {boxLabel}
        </div>
        <div className="mt-[3px] font-display text-[13.5px] font-bold text-ink">{dateLine}</div>
        <div className="mt-[1px] text-[9.5px] text-[#5c563f]">{descLine}</div>
      </div>
      <svg viewBox="0 0 28 28" className="h-[22px] w-[22px] shrink-0">
        <defs>
          <filter id="sy-chk-d1" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={3} seed={9} result="n1" />
            <feDisplacementMap in="SourceGraphic" in2="n1" scale="0.9" xChannelSelector="R" yChannelSelector="G" result="dsp" />
            <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves={4} seed={6} result="n2" />
            <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.44" result="spek" />
            <feComposite in="dsp" in2="spek" operator="out" />
          </filter>
        </defs>
        <path
          filter="url(#sy-chk-d1)"
          d="M3.8 14.2 L6.3 12.1 C8.2 13.8 10.1 16.5 11.9 19.6 C15.2 13.2 19.1 8.2 24.2 3.9 L25.6 5.9 C20.7 11.1 16.1 17.6 13.1 24.3 L10.9 24.1 C9.1 20.6 6.4 16.8 3.8 14.2 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

function formatUpcomingDate(date: string, homeAway: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)} ${homeAway}`;
}

function footerNote(result: AnalysisOutput): string {
  if (result.status === "완전승요") {
    return `이 결과는 직관 ${result.totalGames}경기 전부 승리를 근거로 하며, 그 외의 통계적 유의미성은 판독기의 알 바 아님.`;
  }
  if (result.status === "부분승요" || result.status === "패배방지") {
    return `본 결과는 표본 ${result.coverage ?? result.totalGames}경기를 100% 만족하는 조건이며, 그 외의 통계적 유의미성은 판독기의 알 바 아님.`;
  }
  return "판독은 최소 3경기의 직관 기록이 누적된 후 자동으로 재개됩니다.";
}

/** text에서 char가 처음 나오는 지점 바로 뒤에 줄바꿈을 넣는다 (char가 없으면 원문 그대로) */
function breakAfter(text: string, char: string): ReactNode {
  const idx = text.indexOf(char);
  if (idx === -1) return text;
  const cut = idx + char.length;
  return (
    <>
      {text.slice(0, cut)}
      <br />
      {text.slice(cut).trimStart()}
    </>
  );
}

const ResultCard = forwardRef<HTMLDivElement, Props>(function ResultCard({ team, result, today }, ref) {
  const meta = statusMeta(result.status);
  const [g1, g2, g3] = deriveHeaderGradient(team.colorMain);
  const issueNumber = buildIssueNumber(team.id, result.coveredDates ?? [], result.status);
  const issueDate = formatIssueDate(today);
  const condition = result.condition ?? [];
  const stampException = condition.length >= 2 && condition.some(isNumerologyStampFeature);

  return (
    <div
      ref={ref}
      className="relative mx-auto flex aspect-[9/16] w-full max-w-[375px] flex-col overflow-visible rounded-[2px] bg-paper shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 left-0 z-10 h-3 -top-2.5 rotate-180"
        style={{
          background: "radial-gradient(circle at 10px 0, transparent 9px, var(--page-bg) 9.5px) repeat-x",
          backgroundSize: "20px 20px",
        }}
      />

      <div
        className="px-[26px] pt-[26px] pb-[18px] text-center text-paper"
        style={{ background: `radial-gradient(130% 100% at 50% 0%, ${g1} 0%, ${g2} 45%, ${g3} 100%)` }}
      >
        <div className="font-display text-[10.5px] font-semibold tracking-[0.28em] text-paper/65">{EYEBROW}</div>
        <div className="mt-[7px] font-display text-[12.5px] font-semibold tracking-[0.17em] text-gold">
          {team.fullName.toUpperCase()} · {team.stadium}
        </div>
        <div className="mt-[9px] text-[9.5px] tracking-[0.06em] text-paper/68">
          발급번호 {issueNumber} · 발급일 {issueDate}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col px-6 pt-3.5 pb-3 text-ink">
        <div className="border-b border-dashed border-line pb-2.5 font-display text-[9.5px] font-semibold tracking-[0.2em] text-[#8a8266]">
          {meta.verdictLabel}
        </div>

        {result.status === "판독보류" ? (
          <HoldBody result={result} />
        ) : (
          <>
            <VerdictBlock result={result} accent={meta.accent} />
            <StatRow
              big={
                result.status === "패배방지"
                  ? `${result.coverage ?? result.totalGames}전 ${result.coverage ?? result.totalGames}패`
                  : `${result.coverage ?? result.totalGames}전 ${result.coverage ?? result.totalGames}승`
              }
              sub={result.status === "패배방지" ? "패배율 100%" : "승률 100%"}
            />
            {result.status === "완전승요" ? (
              <div className="my-0.5 flex items-center gap-2 text-[10.5px] text-[#5c563f]">
                <span className="text-[#8a8266]">비고</span>
                <span>별도 조건을 산출할 필요가 없는 최상위 등급입니다.</span>
              </div>
            ) : (
              <RarityRow accent={meta.accent} label="희귀도" result={result} />
            )}
            <EvidenceBlock teamId={team.id} result={result} />
            <NextBox accent={meta.accent} result={result} team={team} />
          </>
        )}

        <div className="mt-auto border-t border-dashed border-line pt-2.5 text-[9px] leading-[1.65] text-[#9c9678]">
          {breakAfter(footerNote(result), ",")}
        </div>

        {stampException ? (
          <div className="pointer-events-none absolute right-[8px] bottom-[2px] opacity-95">
            <StampSeal accent={meta.accent} size={137} />
          </div>
        ) : (
          <div className="pointer-events-none absolute top-[44px] right-[10px] opacity-95">
            <StampSeal accent={meta.accent} size={124} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-[26px] pt-3 pb-3.5 text-paper" style={{ background: g3 }}>
        <div className="font-display text-[11.5px] font-bold tracking-[0.06em] text-paper/92">
          승요 판독기<span className="text-gold">.</span>
        </div>
        <div className="text-[9.5px] text-paper/55">{meta.hashtag}</div>
      </div>
    </div>
  );
});

export default ResultCard;

function VerdictBlock({ result, accent }: { result: AnalysisOutput; accent: Accent }) {
  const color = ACCENT_HEX[accent];

  if (result.status === "완전승요") {
    // "무승부 제외" 안내는 무승부+전승 조합(완전승요인데 무승부도 섞여있는 경우)에서만 의미가 있다.
    const tieNote =
      result.ties > 0 ? (
        <span className="mt-2 block font-mono text-[10px] leading-[1.6] font-normal text-[#5c563f]">
          참고: 무승부 {result.ties}경기는 판독 대상에서 제외함.
        </span>
      ) : null;
    return (
      <div className="mt-[13px] mb-1 font-serif-kr text-[21px] leading-[1.44] font-black tracking-[-0.01em]">
        직관간 <span className="verdict-highlight">{result.totalGames}경기 전부 승리.</span>
        <span className="mt-[5px] block text-[15.5px] font-bold" style={{ color }}>
          → 조건 없음. 당신 자체가 승요.
        </span>
        {tieNote}
      </div>
    );
  }

  const phrases = buildConditionPhrases(result.condition ?? []);
  const tail = result.status === "패배방지" ? "→ 반드시 집니다. 피하십시오." : "→ 무조건 승요.";

  return (
    <div className="mt-[13px] mb-1 font-serif-kr text-[20px] leading-[1.44] font-black tracking-[-0.01em]">
      {phrases.map((p, i) => (
        <span key={i} className="verdict-highlight block w-fit">
          {p}
          {i < phrases.length - 1 ? "서" : ""}
        </span>
      ))}
      <span className="mt-[5px] block text-[15.5px] font-bold" style={{ color }}>
        {tail}
      </span>
    </div>
  );
}

function HoldBody({ result }: { result: AnalysisOutput }) {
  const pct = Math.min(100, Math.round((result.totalGames / 3) * 100));
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-1.5 text-center">
      <div className="mb-3 font-serif-kr text-[27px] font-black text-grey">판독 보류</div>
      <div className="text-[11px] leading-[1.75] text-[#5c563f]">
        표본 부족으로 승요 여부를 판독할 수 없습니다.
        <br />
        현재 직관 기록 <b className="text-ink">{result.totalGames}경기</b> (최소 3경기 필요)
      </div>
      <div className="mt-[18px] mb-2 h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full bg-grey" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[9.5px] text-[#8a8266]">{result.totalGames} / 3경기</div>
      <div className="mt-5 font-serif-kr text-[13.5px] font-bold text-ink">승요가 되기 위해서는 수련이 필요합니다.</div>
    </div>
  );
}
