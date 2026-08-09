import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "승요 판독기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const pretendardBlack = await readFile(join(process.cwd(), "src/fonts/Pretendard-Black.ttf"));

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "radial-gradient(130% 130% at 25% 15%, #46545F 0%, #313D48 45%, #1E2830 100%)",
          color: "#F6F1E4",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#D9B84A", fontWeight: 900 }}>
          SEUNGYO DETECTOR · KBO 2026
        </div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 900, marginTop: 20 }}>승요 판독기</div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            marginTop: 28,
            color: "rgba(246,241,228,0.8)",
            maxWidth: 880,
          }}
        >
          직관간 날짜를 넣으면 억지로라도 승요를 찾아드립니다.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: pretendardBlack, weight: 900, style: "normal" }],
    }
  );
}
