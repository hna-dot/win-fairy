import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, Noto_Serif_KR } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const pretendardBlack = localFont({
  src: "../fonts/Pretendard-Black.woff2",
  variable: "--font-pretendard-black",
  weight: "900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "승요 판독기",
  description: "직관간 날짜를 넣으면 억지로라도 승요를 찾아드립니다.",
};

export const viewport: Viewport = {
  themeColor: "#1e2830",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${chakraPetch.variable} ${notoSerifKr.variable} ${ibmPlexMono.variable} ${pretendardBlack.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
