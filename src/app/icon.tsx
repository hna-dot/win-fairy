import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const notoSerifKrBlack = await readFile(join(process.cwd(), "src/fonts/og/NotoSerifKR-Black.ttf"));

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 7,
          overflow: "hidden",
          background: "radial-gradient(130% 100% at 50% 0%, #46545F 0%, #313D48 45%, #1E2830 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: "#C9A227", display: "flex" }}
        />
        <svg viewBox="0 0 200 200" width="23" height="23" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#C9A227">
            <circle cx="100" cy="100" r="88" strokeWidth="7" />
            <circle cx="100" cy="100" r="76" strokeWidth="2" />
          </g>
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
            fontSize: 10,
            color: "#C9A227",
          }}
        >
          승
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Noto Serif KR", data: notoSerifKrBlack, weight: 900, style: "normal" }] }
  );
}
