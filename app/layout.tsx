import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { PageViewTracker } from "@/components/page-view-tracker";
import { DailyLoginTracker } from "@/components/daily-login-tracker";
import { RankGateToast } from "@/components/rank-gate-toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://animewarboard.com"),
  title: { default: "AnimeWarBoard", template: "%s | AnimeWarBoard" },
  description: "Make your case. Settle the debate. Predict anime battles and see how the community stacks up.",
  keywords: ["anime", "battles", "power scaling", "predictions", "who would win"],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: { siteName: "AnimeWarBoard", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased dark`} suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text-base)]">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('awb-theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}` }} />
        <ThemeProvider>
          <Nav />
          <main className="flex-1 pt-14">
            {children}
          </main>
          <Footer />
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
          <DailyLoginTracker />
          <RankGateToast />
        </ThemeProvider>
      </body>
    </html>
  );
}
