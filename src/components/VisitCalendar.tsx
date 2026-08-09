"use client";

import { useEffect, useState } from "react";
import { getDefaultMonth } from "@/lib/data/defaultMonth";
import { getPlayedGames } from "@/lib/data/schedule";
import { addMonths, daysInMonth, firstWeekday, monthLabel, monthOf, ymd } from "@/lib/dateUtil";

interface Props {
  teamId: string;
  teamColor: string;
  selectedDates: string[];
  onToggleDate: (date: string) => void;
  today: string;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MONDAY_COL = 1; // DOW 배열 기준 월요일 인덱스. KBO는 월요일에 경기가 없다.

const MARK_COLOR: Record<string, string> = {
  승: "#A53328",
  패: "#2B58BD",
  무: "#8A836A",
};
const MARK_LABEL: Record<string, string> = {
  승: "W",
  패: "L",
  무: "D",
};

function compareYm(a: { y: number; m: number }, b: { y: number; m: number }): number {
  return a.y * 12 + a.m - (b.y * 12 + b.m);
}

export default function VisitCalendar({ teamId, teamColor, selectedDates, onToggleDate, today }: Props) {
  const games = getPlayedGames(teamId);
  const gameDateSet = new Set(games.map((g) => g.date));
  const resultByDate = new Map(games.map((g) => [g.date, g.result]));
  const [ym, setYm] = useState(() => getDefaultMonth(games, today));

  useEffect(() => {
    // teamId가 바뀔 때만 기본월을 다시 계산한다. 팀마다 실제 경기 일정이 달라
    // 기본월도 함께 바뀌어야 하므로 파생 상태 리셋이 필요한 의도적 패턴.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYm(getDefaultMonth(getPlayedGames(teamId), today));
    // today는 세션 중 값이 바뀌지 않으므로 의존성에서 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const sortedDates = games.map((g) => g.date).sort();
  const firstMonth = sortedDates.length ? monthOf(sortedDates[0]) : ym;
  const lastMonth = sortedDates.length ? monthOf(sortedDates[sortedDates.length - 1]) : ym;

  const canGoPrev = compareYm(ym, firstMonth) > 0;
  const canGoNext = compareYm(ym, lastMonth) < 0;

  const fw = firstWeekday(ym.y, ym.m);
  const total = daysInMonth(ym.y, ym.m);
  const cells: (number | null)[] = [
    ...Array.from({ length: fw }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div className="mx-[22px] mt-0.5 rounded-xl border border-line bg-white px-[15px] pt-[15px] pb-2.5">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center font-display text-[15px] font-bold text-ink">
        <span />
        <span className="flex items-center gap-3">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => setYm(addMonths(ym.y, ym.m, -1))}
            className="rounded-full px-2 py-1 text-[22px] leading-none text-[#8a8266] disabled:opacity-30"
            aria-label="이전 달"
          >
            ‹
          </button>
          <span>{monthLabel(ym.y, ym.m)}</span>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setYm(addMonths(ym.y, ym.m, 1))}
            className="rounded-full px-2 py-1 text-[22px] leading-none text-[#8a8266] disabled:opacity-30"
            aria-label="다음 달"
          >
            ›
          </button>
        </span>
        <span />
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10.5px]">
        {DOW.map((d) => (
          <div key={d} className="pb-[5px] text-center text-[9.5px] text-[#a49c7c]">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="aspect-square" />;
          const dateStr = ymd(ym.y, ym.m, day);
          const isGameDay = gameDateSet.has(dateStr);
          const isPicked = selectedDates.includes(dateStr);
          const col = (fw + day - 1) % 7;
          const isMonday = col === MONDAY_COL;
          const mark = isPicked ? resultByDate.get(dateStr) : undefined;
          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isGameDay}
              onClick={() => onToggleDate(dateStr)}
              title={isMonday && !isGameDay ? "월요일은 KBO 경기가 없습니다" : undefined}
              className="group flex flex-col items-center gap-0.5 py-0.5"
            >
              <span
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#333] group-disabled:text-[#ccc] ${
                  isMonday && !isGameDay ? "line-through group-disabled:text-[#c4bc9e]" : ""
                }`}
                style={isPicked ? { background: teamColor, color: "#fff", fontWeight: 700 } : undefined}
              >
                {day}
              </span>
              <span
                className="font-display text-[8.5px] leading-none tracking-[0.06em]"
                style={{ color: mark ? MARK_COLOR[mark] : "transparent" }}
              >
                {mark ? MARK_LABEL[mark] : "·"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
