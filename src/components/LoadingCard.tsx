const HEADER_GRADIENT = "radial-gradient(130% 100% at 50% 0%, #46545F 0%, #313D48 45%, #1E2830 100%)";

export default function LoadingCard() {
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

      <div className="px-[22px] pt-[26px] pb-5 text-paper" style={{ background: HEADER_GRADIENT }}>
        <div className="font-serif-kr text-[21px] font-black tracking-[-0.01em]">승요 판독기</div>
        <div className="mt-1.5 max-w-[250px] text-[11px] leading-[1.55] text-paper/[0.78]">
          직관 기록을 대조하는 중입니다.
          <br />
          잠시만 기다려주세요.
        </div>
      </div>
      <div className="h-1 bg-gold" />
      <div className="mt-0.5 h-px bg-gold/55" />

      <div className="flex flex-1 flex-col items-center justify-center gap-6.5 px-6.5 pt-6 text-ink">
        <div className="relative flex h-[132px] w-[132px] items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-gold/75"
            style={{ animation: "sy-spin 7s linear infinite" }}
          />
          <div className="absolute inset-[13px] rounded-full border border-ink/[0.14]" />
          <div className="absolute inset-[13px] overflow-hidden rounded-full">
            <div
              className="h-0.5"
              style={{
                background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
                animation: "sy-scan 1.9s ease-in-out infinite alternate",
              }}
            />
          </div>
          <div className="text-center font-serif-kr text-[17px] font-black leading-[1.35] tracking-[-0.01em]">
            판독 중<span style={{ animation: "sy-caret 1s step-end infinite" }}>…</span>
            <div className="mt-1 font-display text-[9px] font-bold tracking-[0.18em] text-[#8a8266]">ANALYZING</div>
          </div>
        </div>

        <div className="w-full">
          <div className="h-[5px] overflow-hidden rounded-[3px] bg-[#e3dcc5]">
            <div className="h-full bg-gold" style={{ animation: "sy-bar 3.6s ease-out infinite" }} />
          </div>
          <div className="mt-2.5 flex justify-between font-display text-[9px] font-bold tracking-[0.14em] text-[#8a8266]">
            <span>KBO 2026 RECORD MATCHING</span>
            <span>진행 중</span>
          </div>
        </div>

        <div className="w-full rounded-[10px] border border-line bg-white px-3.5 py-3.5 text-[10px] leading-[2] text-[#4a4636]">
          <div className="flex justify-between">
            <span className="text-[#8a8266]">직관 날짜 대조</span>
            <span className="text-ink">완료</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8a8266]">경기 결과 수집</span>
            <span className="text-ink">완료</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8a8266]">승요 조건 산출</span>
            <span className="text-gold" style={{ animation: "sy-pulse 1.4s ease-in-out infinite" }}>
              처리 중
            </span>
          </div>
        </div>
      </div>

      <div className="px-6.5 pt-4.5 pb-6.5 text-center text-[9.5px] leading-[1.7] text-[#9c9678]">
        평균 소요 시간 3초. 화면을 벗어나면 판독이 취소됩니다.
      </div>
    </div>
  );
}
