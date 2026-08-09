interface Props {
  onRetry: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildTimestamp(date: Date): { display: string; code: string } {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return {
    display: `${y}.${m}.${d} ${hh}:${mm}`,
    code: `ERR-${y}-${m}${d}-${hh}${mm}`,
  };
}

export default function ErrorCard({ onRetry }: Props) {
  const { display, code } = buildTimestamp(new Date());

  return (
    <div className="relative mx-auto flex aspect-[9/16] w-full max-w-[375px] flex-col overflow-visible rounded-[2px] bg-paper shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 left-0 z-10 h-3 -top-2.5 rotate-180"
        style={{
          background: "radial-gradient(circle at 10px 0, transparent 9px, var(--page-bg) 9.5px) repeat-x",
          backgroundSize: "20px 20px",
        }}
      />

      <div
        className="px-6.5 pt-6.5 pb-4.5 text-center text-paper"
        style={{ background: "radial-gradient(130% 100% at 50% 0%, #55585C 0%, #3B3E43 45%, #26282C 100%)" }}
      >
        <div className="font-display text-[10.5px] font-semibold tracking-[0.28em] text-paper/60">
          판 독 기 시 스 템 알 림
        </div>
        <div className="mt-[7px] font-display text-[12.5px] font-semibold tracking-[0.17em] text-[#b9b3a2]">
          SYSTEM STATUS — 판독 불능
        </div>
        <div className="mt-2.5 text-[9.5px] tracking-[0.06em] text-paper/60">
          기록일시 {display} &nbsp;·&nbsp; 판독 미완료
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-3 text-ink">
        <div className="border-b border-dashed border-line pb-2.5 font-display text-[9.5px] font-semibold tracking-[0.2em] text-[#8a8266]">
          UNEXPECTED ERROR — 판독 중단
        </div>

        <div className="my-2.5 font-serif-kr text-[26px] leading-[1.35] font-black tracking-[-0.01em] text-[#4a4a46]">
          판독 불능
        </div>

        <div className="text-[11.5px] leading-[1.85] text-[#4a4636]">
          판독 도중 예기치 못한 오류가 발생했습니다.
          <br />
          다시 시도해주세요.
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-dashed border-line pt-2.5">
          <span className="font-display text-[9px] font-bold tracking-[0.16em] text-[#8a8266]">오류 코드</span>
          <span className="font-mono text-[11.5px] tracking-[0.04em] text-ink">{code}</span>
        </div>

        <div className="mt-4.5">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-[11px] bg-[#3b3e43] py-3.5 text-center font-display text-[13px] font-bold tracking-[0.03em] text-paper"
          >
            다시 판독하기
          </button>
        </div>

        <div className="mt-auto flex items-center gap-2.5 border-t border-dashed border-line pt-2.5">
          <div className="flex-1 text-[9px] leading-[1.65] text-[#9c9678]">이런 것까지는 예측하지 못했습니다.</div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-ink px-6.5 py-3 text-paper">
        <div className="font-display text-[11.5px] font-bold tracking-[0.06em] text-paper/92">
          승요 판독기<span className="text-[#77756c]">.</span>
        </div>
        <div className="text-[9.5px] text-paper/55">#판독불능 #시스템오류</div>
      </div>
    </div>
  );
}
