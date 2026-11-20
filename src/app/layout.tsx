import type { Metadata, Viewport } from "next";
import { Geist_Mono, Host_Grotesk, Inter } from "next/font/google";
import Script from "next/script";
import { ClickSound } from "@/components/ClickSound";
import { EdgeFades } from "@/components/EdgeFades";
import { GiantHeader } from "@/components/Header";
import { Mascot } from "@/components/Mascot";
import { OwnerHeartbeat } from "@/components/OwnerHeartbeat";
import { PullCord } from "@/components/PullCord";
import { profile } from "@/data/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Only the big-word tabs and the segmented control use this (after things.bharadwhat.com).
const grotesk = Host_Grotesk({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-grotesk",
  display: "swap",
});

// The blog's labels, tree and share links (after claude.dev).
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// J, the footballer mascot, is switched off for now. His code stays in components/Mascot.tsx; set this back to
// true to bring him back.
const SHOW_MASCOT = false;

export const metadata: Metadata = {
  title: {
    default: `${profile.name} – Portfolio`,
    template: `%s – ${profile.name}`,
  },
  description: profile.summary,
  authors: [{ name: profile.name }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Applies the theme before first paint so there is no light/dark flash. A choice made with the pull cord always
// wins; without one, the site is dark from 6pm to 6am India time (IST, UTC+5:30), and follows the device otherwise.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var n=new Date();var h=((n.getUTCHours()*60+n.getUTCMinutes()+330)%1440)/60;var night=h>=18||h<6;var d=t?t==='dark':(night||matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* next/script places this in the server HTML only, so React never tries to render a script tag itself. */}
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ClickSound />
        <OwnerHeartbeat />
        <EdgeFades />
        <PullCord />
        {/* Everything a project view pushes back when it opens. */}
        <div id="site" className="bg-background">
          <GiantHeader />
          {children}
        </div>
        {SHOW_MASCOT && <Mascot />}
      </body>
    </html>
  );
}
