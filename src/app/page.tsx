"use client";

import { track } from "@vercel/analytics";
import { toBlob } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";
import CalendarHint from "@/components/CalendarHint";
import ErrorCard from "@/components/ErrorCard";
import LoadingCard from "@/components/LoadingCard";
import ResultCard from "@/components/ResultCard";
import TeamSelector from "@/components/TeamSelector";
import VisitCalendar from "@/components/VisitCalendar";
import { analyzeVisits } from "@/lib/analyzer";
import { getAnalysisToday, getTeamGames, resolveVisitRecords } from "@/lib/data/schedule";
import { getTeamMeta } from "@/lib/data/teams";
import { useVisitState } from "@/lib/useVisitState";

const HEADER_GRADIENT = "radial-gradient(130% 100% at 50% 0%, #46545F 0%, #313D48 45%, #1E2830 100%)";
const ATTEMPT_COUNT_KEY = "seungyo-pandokgi:attempt-count:v1";

// 이미지 저장/공유 캡처 직전에 exportMode로 전환되면서 쓰이는 도장/체크 PNG. 캡처 시점에
// 처음 로드되면 아직 브라우저에 없어 깨진 이미지로 캡처될 수 있으므로 미리 받아둔다.
const EXPORT_IMAGE_PATHS = [
  "/stamps/gold.png",
  "/stamps/red.png",
  "/stamps/stockblue.png",
  "/stamps/grey.png",
  "/stamps/check-gold.png",
  "/stamps/check-red.png",
  "/stamps/check-stockblue.png",
  "/stamps/check-grey.png",
];

/** 다음 두 번의 페인트가 지나갈 때까지 기다린다 — exportMode 전환(SVG->PNG)이 DOM에
 * 실제로 반영된 뒤에 캡처하기 위함. */
function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

// html-to-image는 각 DOM 노드를 복제하며 getComputedStyle(node).cssText를 그대로 복사하는데,
// 일부 브라우저(사파리/iOS 포함, WebKit/Blink 버전에 따라)는 cssText가 빈 문자열을 반환하는
// 알려진 버그가 있다. 이 경우 라이브러리는 속성 이름 목록을 하나씩 순회하며 값을 복사하는
// 폴백으로 넘어가는데, 그 목록이 브라우저마다 달라져서 카드의 flex/margin/padding 같은
// 레이아웃 속성이 통째로 누락되고 텍스트가 전부 겹쳐 보이는 버그로 이어질 수 있다.
// (일부 기기에서 저장 이미지가 깨지는 문제의 원인으로 추정됨.) 브라우저 기본 목록에
// 의존하지 않도록 레이아웃에 필요한 속성을 명시적으로 지정해 폴백 경로에서도 항상
// 동일하게 동작하도록 한다.
const CAPTURE_STYLE_PROPERTIES = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "z-index",
  "box-sizing",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "aspect-ratio",
  "overflow",
  "overflow-x",
  "overflow-y",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "flex-direction",
  "flex-wrap",
  "align-items",
  "align-content",
  "align-self",
  "justify-content",
  "justify-items",
  "justify-self",
  "gap",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-template-rows",
  "grid-column",
  "grid-row",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border",
  "border-width",
  "border-style",
  "border-color",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-radius",
  "background",
  "background-color",
  "background-image",
  "background-position",
  "background-size",
  "background-repeat",
  "color",
  "opacity",
  "mix-blend-mode",
  "box-shadow",
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "text-overflow",
  "white-space",
  "word-break",
  "vertical-align",
  "transform",
  "transform-origin",
  "object-fit",
  "object-position",
  "pointer-events",
  "visibility",
  "clip-path",
  "filter",
  "stroke",
  "stroke-width",
  "fill",
];

/** 이 브라우저에서 지금까지 판독을 시도한 누적 횟수. Vercel Analytics 이벤트 속성으로 붙여서
 * "여러 번 판독한 사람이 몇 명인지"를 대시보드에서 가늠할 수 있게 한다. */
function bumpAttemptCount(): number {
  if (typeof window === "undefined") return 1;
  const next = Number(window.localStorage.getItem(ATTEMPT_COUNT_KEY) ?? "0") + 1;
  window.localStorage.setItem(ATTEMPT_COUNT_KEY, String(next));
  return next;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[11px] w-[11px]">
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[11px] w-[11px]">
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

const IMAGE_ERROR_MESSAGE = "이미지 발급에 실패했습니다. 다시 시도해도 안 되면 다른 브라우저를 이용해주세요.";
const NO_SHARE_SHEET_MESSAGE = "이 브라우저는 공유 시트를 지원하지 않습니다. 이미지로 저장해 직접 공유해주세요.";
const SHARE_SUCCESS_MESSAGE = "저장/공유 완료!";
const LOADING_DURATION_MS = 2200;

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-8 left-1/2 z-50 w-[calc(100%-48px)] max-w-[320px] -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-center text-[12px] leading-[1.5] text-paper shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
      {message}
    </div>
  );
}

export default function Home() {
  const { teamId, dates, setTeam, toggleDate, reset } = useVisitState();
  const [screen, setScreen] = useState<"select" | "loading" | "result" | "error">("select");
  const [sharing, setSharing] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  const [attemptedWithoutTeam, setAttemptedWithoutTeam] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = getAnalysisToday();

  useEffect(() => {
    for (const src of EXPORT_IMAGE_PATHS) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  const team = teamId ? getTeamMeta(teamId) : undefined;

  const analysis = useMemo(() => {
    if (!teamId) return { result: null, failed: false };
    try {
      const visits = resolveVisitRecords(teamId, dates);
      const teamGames = getTeamGames(teamId);
      return { result: analyzeVisits(visits, teamGames, today), failed: false };
    } catch (err) {
      console.error(err);
      return { result: null, failed: true };
    }
  }, [teamId, dates, today]);
  const result = analysis.result;

  useEffect(() => {
    // 언마운트 시 타이머가 남아 setState를 호출하지 않도록 정리
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // 브라우저/제스처 뒤로가기 시 로딩·결과·에러 화면 어디서든 선택 화면으로 돌아온다
    function handlePopState() {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      setScreen("select");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function startAnalysis() {
    if (screen === "select") {
      window.history.pushState({ page: "detail" }, "");
    } else {
      window.history.replaceState({ page: "detail" }, "");
    }
    track("판독_시도", { team: teamId ?? "", games: dates.length, attemptNo: bumpAttemptCount() });
    setScreen("loading");
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => {
      if (analysis.failed || !analysis.result) {
        track("판독_실패");
        setScreen("error");
      } else {
        track("판독_완료", { status: analysis.result.status });
        setScreen("result");
      }
    }, LOADING_DURATION_MS);
  }

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

  async function handleShare() {
    if (!cardRef.current || !team) return;
    setSharing(true);
    setExportMode(true);
    try {
      await waitForNextPaint();
      if (document.fonts?.ready) await document.fonts.ready;
      if (!cardRef.current) return;
      const captureOptions = { pixelRatio: 2, includeStyleProperties: CAPTURE_STYLE_PROPERTIES };
      // 일부 기기(주로 iOS 사파리)는 캡처를 한 번 "예열"해야 두 번째 시도부터 레이아웃이
      // 정상적으로 캡처되는 문제가 보고돼 있어(html-to-image의 알려진 한계), 결과는 버리고
      // 실제 저장/공유에는 두 번째 캡처만 사용한다.
      await toBlob(cardRef.current, captureOptions);
      const blob = await toBlob(cardRef.current, captureOptions);
      if (!blob) throw new Error("toBlob returned null");
      const file = new File([blob], `승요판독기_${team.id}.png`, { type: "image/png" });

      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "승요 판독기",
          text: "내 직관 승요 조건은?\n#승요판독기 #직관기록\nhttps://win-fairy.vercel.app/",
        });
        showToast(SHARE_SUCCESS_MESSAGE);
      } else {
        // 공유 시트를 지원하지 않는 브라우저(주로 데스크톱)는 이미지 저장으로 대체
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = file.name;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast(NO_SHARE_SHEET_MESSAGE);
      }
      track("공유하기", { team: team.id });
    } catch (err) {
      // 사용자가 공유 시트를 취소한 경우는 에러로 취급하지 않는다
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        console.error(err);
        showToast(IMAGE_ERROR_MESSAGE);
      }
    } finally {
      setExportMode(false);
      setSharing(false);
    }
  }

  if (screen === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] bg-page-bg px-4 py-7">
        <LoadingCard />
      </main>
    );
  }

  if (screen === "error") {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] bg-page-bg px-4 py-7">
        <ErrorCard onRetry={startAnalysis} />
      </main>
    );
  }

  if (screen === "result" && team && result) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] bg-page-bg px-4 py-7">
        <ResultCard ref={cardRef} team={team} result={result} today={today} exportMode={exportMode} />
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            aria-label="공유하기"
            title="공유하기"
            className="flex h-[39px] w-[39px] items-center justify-center rounded-full bg-ink text-paper disabled:opacity-50"
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="다시 고르기"
            title="다시 고르기"
            className="flex h-[39px] w-[39px] items-center justify-center rounded-full border border-paper/30 text-paper"
          >
            <BackIcon />
          </button>
        </div>
        {toast && <Toast message={toast} />}
      </main>
    );
  }

  const canSubmit = dates.length > 0 && !!teamId;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-paper pb-8">
      <div className="px-[22px] pt-[26px] pb-5 text-paper" style={{ background: HEADER_GRADIENT }}>
        <div className="font-display text-[11px] font-bold tracking-[0.22em] text-[#D9B84A]">
          SEUNGYO DETECTOR · KBO 2026
        </div>
        <div className="mt-[5px] font-display text-[21px] font-bold tracking-[-0.01em]">승요 판독기</div>
        <div className="mt-1.5 max-w-[250px] text-[11px] leading-[1.55] text-paper/[0.78]">
          응원팀과 직관간 날짜를 골라주세요.
          <br />
          당신도 승요가 될 수 있습니다.
        </div>
      </div>
      <div className="h-1 bg-gold" />
      <div className="mt-0.5 h-px bg-gold/55" />

      <TeamSelector
        selectedTeamId={teamId}
        onSelect={(id) => {
          setTeam(id);
          setAttemptedWithoutTeam(false);
        }}
      />

      {teamId && team ? (
        <VisitCalendar teamId={teamId} teamColor={team.colorMain} selectedDates={dates} onToggleDate={toggleDate} today={today} />
      ) : (
        <CalendarHint today={today} onAttemptSelect={() => setAttemptedWithoutTeam(true)} />
      )}

      <div className="mx-[22px] mt-3.5 flex items-center justify-between gap-2.5">
        {!teamId ? (
          <span className={`text-[11px] ${attemptedWithoutTeam ? "font-bold text-red" : "text-[#8a8266]"}`}>
            팀을 먼저 선택해주세요.
          </span>
        ) : dates.length > 0 ? (
          <span className="flex items-center gap-1.5 text-[11px] text-ink">
            이번 시즌 직관{" "}
            <span className="font-display text-[13.5px] font-bold" style={{ color: team?.colorMain }}>
              {dates.length}경기
            </span>{" "}
            선택됨
          </span>
        ) : (
          <span className="text-[11px] text-[#8a8266]">직관간 날을 선택해주세요.</span>
        )}
        <button type="button" onClick={reset} className="text-[9.5px] whitespace-nowrap text-[#8a8266] underline">
          선택 초기화
        </button>
      </div>

      <div className="mt-4.5 px-[22px]">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={startAnalysis}
          className="w-full rounded-[13px] py-4 text-center font-display text-[14.5px] font-bold tracking-[0.03em] disabled:cursor-not-allowed"
          style={
            canSubmit
              ? { background: "var(--ink)", color: "var(--paper)" }
              : { background: "#DCD5BE", color: "#A49C7C" }
          }
        >
          {canSubmit ? <span className="text-gold">판독하기</span> : "판독하기"} →
        </button>
      </div>

      <div className="mx-[22px] mt-6 text-[9px] leading-[1.6] text-[#a49c7c]">
        <p>
          <span className="font-bold text-[#8a8266]">승요 판독기란?</span>
          <br />
          승요는 조금이라도 팀에 보탬이 되길 바라는 팬들의 간절함입니다.
          <br />
          직관 날짜의 공통점을 뒤져 100% 들어맞는 승리 조건만 채택해 판독합니다.
          <br />
          당신의 승요 조건을 찾아 팀의 승리를 도와주세요.
        </p>
      </div>
    </main>
  );
}
