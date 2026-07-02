import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans_KR, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getAuthUser, signOut } from "./auth-actions";
import { getOrCreateProfile } from "@/lib/auth-helpers";
import AppChrome from "@/components/AppChrome";

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

export const metadata: Metadata = {
  title: "MatchDa",
  description: "AI 잡 매칭 & 커버레터 자동화",
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
      </body>
    </html>
  );
}
