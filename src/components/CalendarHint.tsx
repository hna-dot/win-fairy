import { daysInMonth, firstWeekday, monthLabel, monthOf } from "@/lib/dateUtil";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const MONDAY_COL = 1;

interface Props {
  today: string;
  /** 팀 선택 전에 날짜 칸을 탭했을 때 호출 (팀부터 고르라는 경고를 띄우는 용도) */
  onAttemptSelect?: () => void;
}

/** 팀을 아직 고르지 않았을 때 보여주는 자리표시자 캘린더 (claude design 01번 화면 상태) */
export default function CalendarHint({ today, onAttemptSelect }: Props) {
  const { y, m } = monthOf(today);
  const fw = firstWeekday(y, m);
  const total = daysInMonth(y, m);
  const cells: (number | null)[] = [
    ...Array.from({ length: fw }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div className="mx-[22px] mt-0.5 rounded-xl border border-line bg-white px-[15px] pt-[15px] pb-2.5">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center font-display text-[15px] font-bold text-ink">
        <span />
        <span className="flex items-center gap-3">
          <span className="rounded-full px-2 py-1 text-[22px] leading-none text-[#8a8266]">‹</span>
          <span>{monthLabel(y, m)}</span>
          <span className="rounded-full px-2 py-1 text-[22px] leading-none text-[#8a8266]">›</span>
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
          const col = (fw + day - 1) % 7;
          const isMonday = col === MONDAY_COL;
          return (
            <button
              key={day}
              type="button"
              onClick={onAttemptSelect}
              className={`flex aspect-square items-center justify-center rounded-full ${
                isMonday ? "text-[#c4bc9e] line-through" : "text-[#333]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
