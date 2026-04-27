import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getAuthUser, signOut } from "./auth-actions";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobRadar",
  description: "AI 잡 매칭 & 커버레터 자동화",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  return (
    <html lang="ko" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight">
              📡 JobRadar
            </Link>
            {user ? (
              <div className="flex items-center gap-5 text-sm font-medium text-zinc-600">
                <Link href="/" className="hover:text-zinc-900">Jobs</Link>
                <Link href="/profile" className="hover:text-zinc-900">Profile</Link>
                <span className="text-zinc-400 text-xs hidden sm:block">{user.email}</span>
                <form action={signOut}>
                  <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                로그인
              </Link>
            )}
          </nav>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
