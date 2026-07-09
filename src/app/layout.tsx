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
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  const profile = user?.email ? await getOrCreateProfile(user.email) : null
  const showOnboardingBanner = !!user && !profile?.onboarding_completed

  return (
    <html lang="ko" className={`${geist.variable} ${plexKr.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-[#101828]">
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
