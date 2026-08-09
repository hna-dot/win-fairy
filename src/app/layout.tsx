import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono, Noto_Serif_KR } from "next/font/google";
import Script from "next/script";
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

const SITE_URL = "https://win-fairy.vercel.app";
const SITE_TITLE = "승요 판독기";
const SITE_DESCRIPTION = "당신은 승요가 맞습니다. 우리가 그렇게 만들 거니까요. 직관간 날짜만 입력하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: ["KBO", "승요", "직관", "프로야구", "야구", "승요 판독기", "직관 기록", "승리요정"],
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e2830",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${chakraPetch.variable} ${notoSerifKr.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen">
        {children}
        <Analytics />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4056187987785109"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
