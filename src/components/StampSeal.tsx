// 결과 카드 도장. 화면에서는 실시간 SVG 필터(잉크 번짐 feTurbulence)로 그린다 — 이게 원래
// 디자인이고 화면에서는 전혀 문제없다. 문제는 html-to-image로 이미지 저장/공유할 때: 필터
// 결과물이 표시 크기 그대로 래스터화된 뒤 저장용으로 확대되며 흐려진다. 그래서 캡처
// 순간에만(exportMode) 미리 구워둔 고해상도 PNG(public/stamps/*.png)로 바꿔치기한다.

type StampAccent = "gold" | "red" | "stockblue" | "grey";

interface StampConfig {
  filterId: string;
  topPathId: string;
  botPathId: string;
  color: string;
  rotate: number;
  seed1: number;
  seed2: number;
  baseFrequency1: number;
  baseFrequency2: number;
  scale: number;
  colorMatrixOffset: number;
  topText: string;
  botText: string;
  centerText: string;
  subText: string;
}

const STAMPS: Record<StampAccent, StampConfig> = {
  gold: {
    filterId: "sy-gr-1",
    topPathId: "sy-top-1",
    botPathId: "sy-bot-1",
    color: "#C9A227",
    rotate: -7,
    seed1: 11,
    seed2: 4,
    baseFrequency1: 0.75,
    baseFrequency2: 0.055,
    scale: 3.4,
    colorMatrixOffset: -0.42,
    topText: "승 요 공 식 인 증",
    botText: "· CERTIFIED SEUNGYO ·",
    centerText: "완전승요",
    subText: "PERFECT",
  },
  red: {
    filterId: "sy-gr-2",
    topPathId: "sy-top-2",
    botPathId: "sy-bot-2",
    color: "#B3261E",
    rotate: 6,
    seed1: 27,
    seed2: 19,
    baseFrequency1: 0.8,
    baseFrequency2: 0.06,
    scale: 3.2,
    colorMatrixOffset: -0.44,
    topText: "승 요 공 식 인 증",
    botText: "· CONDITIONAL PASS ·",
    centerText: "조건승요",
    subText: "PARTIAL",
  },
  stockblue: {
    filterId: "sy-gr-3",
    topPathId: "sy-top-3",
    botPathId: "sy-bot-3",
    color: "#1A56C4",
    rotate: -11,
    seed1: 41,
    seed2: 33,
    baseFrequency1: 0.7,
    baseFrequency2: 0.05,
    scale: 3.6,
    colorMatrixOffset: -0.4,
    topText: "승 요 공 식 인 증",
    botText: "· AVOIDANCE ALERT ·",
    centerText: "회피경보",
    subText: "AVOID",
  },
  grey: {
    filterId: "sy-gr-4",
    topPathId: "sy-top-4",
    botPathId: "sy-bot-4",
    color: "#5B6472",
    rotate: 4,
    seed1: 58,
    seed2: 51,
    baseFrequency1: 0.85,
    baseFrequency2: 0.065,
    scale: 3,
    colorMatrixOffset: -0.46,
    topText: "승 요 판 독 보 류",
    botText: "· ON HOLD ·",
    centerText: "승요예정",
    subText: "PENDING",
  },
};

const STAMP_SRC: Record<StampAccent, string> = {
  gold: "/stamps/gold.png",
  red: "/stamps/red.png",
  stockblue: "/stamps/stockblue.png",
  grey: "/stamps/grey.png",
};

interface Props {
  accent: StampAccent;
  size?: number;
  /** true면 미리 구운 고해상도 PNG(캡처용)를, false(기본)면 화면용 실시간 SVG 필터를 그린다. */
  exportMode?: boolean;
}

export default function StampSeal({ accent, size = 62, exportMode = false }: Props) {
  if (exportMode) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 고정 로컬 도장 이미지, next/image 최적화 불필요
      <img
        src={STAMP_SRC[accent]}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, mixBlendMode: "multiply" }}
      />
    );
  }

  const c = STAMPS[accent];
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} xmlns="http://www.w3.org/2000/svg" style={{ mixBlendMode: "multiply" }}>
      <defs>
        <filter id={c.filterId} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency={c.baseFrequency1} numOctaves={4} seed={c.seed1} result="n1" />
          <feDisplacementMap in="SourceGraphic" in2="n1" scale={c.scale} xChannelSelector="R" yChannelSelector="G" result="dsp" />
          <feTurbulence type="fractalNoise" baseFrequency={c.baseFrequency2} numOctaves={5} seed={c.seed2} result="n2" />
          <feColorMatrix in="n2" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 ${c.colorMatrixOffset}`} result="spek" />
          <feComposite in="dsp" in2="spek" operator="out" />
        </filter>
        <path id={c.topPathId} d="M33,100 A67,67 0 0,1 167,100" fill="none" />
        <path id={c.botPathId} d="M27,100 A66,66 0 0,0 173,100" fill="none" />
      </defs>
      <g filter={`url(#${c.filterId})`} fill={c.color} stroke={c.color} transform={`rotate(${c.rotate} 100 100)`}>
        <circle cx="100" cy="100" r="93" fill="none" strokeWidth="5" />
        <circle cx="100" cy="100" r="83" fill="none" strokeWidth="1.6" />
        <circle cx="100" cy="100" r="57" fill="none" strokeWidth="2.6" />
        <text fontFamily="'Chakra Petch',sans-serif" fontSize="12.5" fontWeight="700" letterSpacing="3.2" stroke="none">
          <textPath href={`#${c.topPathId}`} startOffset="50%" textAnchor="middle">
            {c.topText}
          </textPath>
        </text>
        <text fontFamily="'Chakra Petch',sans-serif" fontSize="9.5" fontWeight="700" letterSpacing="2.6" stroke="none">
          <textPath href={`#${c.botPathId}`} startOffset="50%" textAnchor="middle">
            {c.botText}
          </textPath>
        </text>
        <g stroke="none" transform="translate(100 68)">
          <path d="M-13,0 l1.4,4.3 4.5,0 -3.6,2.7 1.4,4.3 -3.7,-2.7 -3.7,2.7 1.4,-4.3 -3.6,-2.7 4.5,0z" />
          <path d="M0,0 l1.4,4.3 4.5,0 -3.6,2.7 1.4,4.3 -3.7,-2.7 -3.7,2.7 1.4,-4.3 -3.6,-2.7 4.5,0z" />
          <path d="M13,0 l1.4,4.3 4.5,0 -3.6,2.7 1.4,4.3 -3.7,-2.7 -3.7,2.7 1.4,-4.3 -3.6,-2.7 4.5,0z" />
        </g>
        <text x="100" y="107" textAnchor="middle" stroke="none" fontFamily="'Noto Serif KR',serif" fontWeight="900" fontSize="25" letterSpacing="-1">
          {c.centerText}
        </text>
        <text x="100" y="127" textAnchor="middle" stroke="none" fontFamily="'Chakra Petch',sans-serif" fontWeight="700" fontSize="8.5" letterSpacing="2.4">
          {c.subText}
        </text>
      </g>
    </svg>
  );
}
