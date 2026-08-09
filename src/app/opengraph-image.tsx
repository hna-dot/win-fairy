import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "승요 판독기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const notoSerifKrBlack = await readFile(join(process.cwd(), "src/fonts/og/NotoSerifKR-Black.ttf"));
const chakraPetchBold = await readFile(join(process.cwd(), "src/fonts/og/ChakraPetch-Bold.ttf"));
const chakraPetchSemiBold = await readFile(join(process.cwd(), "src/fonts/og/ChakraPetch-SemiBold.ttf"));
const ibmPlexMono = await readFile(join(process.cwd(), "src/fonts/og/IBMPlexMono-Regular.ttf"));

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#F6F1E4" }}>
        <div
          style={{
            padding: "48px 88px 36px",
            background: "radial-gradient(130% 100% at 50% 0%, #46545F 0%, #313D48 45%, #1E2830 100%)",
            color: "#F6F1E4",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontFamily: "'Noto Serif KR'", fontWeight: 900, fontSize: 52, letterSpacing: "-0.01em" }}>
            승요 판독기
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "'Chakra Petch'",
              fontSize: 22,
              letterSpacing: "0.22em",
              color: "rgba(246,241,228,0.6)",
              fontWeight: 600,
            }}
          >
            당신도 승요가 될 수 있다.
          </div>
        </div>
        <div style={{ height: 10, background: "#C9A227", display: "flex" }} />
        <div style={{ height: 2, marginTop: 4, background: "rgba(201,162,39,0.55)", display: "flex" }} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 88px", color: "#0B1220" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "'Chakra Petch'",
                fontSize: 22,
                letterSpacing: "0.2em",
                color: "#8A8266",
                fontWeight: 700,
              }}
            >
              FORCED VERDICT
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontFamily: "'Noto Serif KR'",
                fontWeight: 900,
                fontSize: 108,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              완전승요
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontFamily: "'IBM Plex Mono'",
                fontSize: 26,
                color: "#4A4636",
                letterSpacing: "0.04em",
              }}
            >
              직관 12경기 · 12승
            </div>
          </div>
          <div style={{ display: "flex", transform: "rotate(-8deg)", mixBlendMode: "multiply" }}>
            <div
              style={{
                position: "relative",
                width: 264,
                height: 264,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 200 200" width="264" height="264" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="88" fill="none" stroke="#C9A227" strokeWidth="7" />
                <circle cx="100" cy="100" r="76" fill="none" stroke="#C9A227" strokeWidth="2" />
                <g fill="none" stroke="#C9A227" strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
                  <path d="M52,50 Q34,100 52,150" />
                  <path d="M148,50 Q166,100 148,150" />
                  <g strokeWidth="6">
                    <path d="M45,64 L54,64" />
                    <path d="M40,84 L49,84" />
                    <path d="M39,104 L48,104" />
                    <path d="M42,124 L51,124" />
                    <path d="M155,64 L146,64" />
                    <path d="M160,84 L151,84" />
                    <path d="M161,104 L152,104" />
                    <path d="M158,124 L149,124" />
                  </g>
                </g>
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Noto Serif KR'",
                  fontWeight: 900,
                  fontSize: 113,
                  color: "#C9A227",
                }}
              >
                승
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "26px 88px",
            background: "#0B1220",
            color: "rgba(246,241,228,0.85)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", fontFamily: "'Chakra Petch'", fontWeight: 700, letterSpacing: "0.06em" }}>
            <div style={{ display: "flex" }}>승요 판독기</div>
            <div style={{ display: "flex", color: "#C9A227" }}>.</div>
          </div>
          <div style={{ display: "flex", color: "rgba(246,241,228,0.5)" }}>#승요 #직관기록</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Serif KR", data: notoSerifKrBlack, weight: 900, style: "normal" },
        { name: "Chakra Petch", data: chakraPetchBold, weight: 700, style: "normal" },
        { name: "Chakra Petch", data: chakraPetchSemiBold, weight: 600, style: "normal" },
        { name: "IBM Plex Mono", data: ibmPlexMono, weight: 400, style: "normal" },
      ],
    }
  );
}
