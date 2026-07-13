import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans_KR, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getAuthUser, signOut } from "./auth-actions";
import { getOrCreateProfile } from "@/lib/auth-helpers";
import AppChrome from "@/components/AppChrome";
import SupportChat from "@/components/SupportChat";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// MatchDa UI 폰트 (IBM Plex Sans KR / IBM Plex Mono)
const plexKr = IBM_Plex_Sans_KR({
  variable: "--font-plex-kr",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const SITE_URL = "https://matchda.com";
const DEFAULT_DESCRIPTION =
  "한국어 이력서를 전문가 수준 영어로 번역하고, 해외 채용 공고에 맞춰 AI가 자동으로 맞춤 이력서·커버레터를 만들어주는 글로벌 커리어 플랫폼.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MatchDa — 한국 인재를 위한 글로벌 커리어 플랫폼",
    template: "%s — MatchDa",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ["해외취업", "영문 이력서", "이력서 번역", "커버레터", "해외 채용", "AI 이력서", "잡 매칭"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "MatchDa",
    url: SITE_URL,
    title: "MatchDa — 한국 인재를 위한 글로벌 커리어 플랫폼",
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchDa — 한국 인재를 위한 글로벌 커리어 플랫폼",
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  // 네이버 서치어드바이저 소유 확인 — Vercel 환경변수 NAVER_SITE_VERIFICATION 설정 시에만 노출
  ...(process.env.NAVER_SITE_VERIFICATION && {
    verification: { other: { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION } },
  }),
};

// 구글 리치 결과·네이버 지식 패널용 구조화 데이터(JSON-LD).
// SearchAction은 넣지 않음 — 사이트 전역 검색 기능이 없어 실제로 지원하지 않는 기능을 약속하면 안 됨.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MatchDa",
  alternateName: "매치다",
  url: SITE_URL,
  logo: `${SITE_URL}/matchda-mark.png`,
  description: DEFAULT_DESCRIPTION,
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MatchDa",
  url: SITE_URL,
  inLanguage: "ko-KR",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  const profile = user?.email ? await getOrCreateProfile(user.email) : null
  const showOnboardingBanner = !!user && !profile?.onboarding_completed

  return (
    <html lang="ko" className={`${geist.variable} ${plexKr.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-[#101828]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        <AppChrome
          userEmail={user?.email ?? null}
          showOnboardingBanner={showOnboardingBanner}
          signOutAction={signOut}
        >
          {children}
        </AppChrome>
        <SupportChat />
      </body>
    </html>
  );
}
