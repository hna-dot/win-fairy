import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const pretendardBlack = await readFile(join(process.cwd(), "src/fonts/Pretendard-Black.ttf"));

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1220",
          color: "#C9A227",
          fontSize: 22,
          fontWeight: 900,
        }}
      >
        승
      </div>
    ),
    { ...size, fonts: [{ name: "Pretendard", data: pretendardBlack, weight: 900, style: "normal" }] }
  );
}
