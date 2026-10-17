import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClickSound } from "@/components/ClickSound";
import { EdgeFades } from "@/components/EdgeFades";
import { OwnerHeartbeat } from "@/components/OwnerHeartbeat";
import { PullCord } from "@/components/PullCord";
import { profile } from "@/data/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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

// Applies the saved theme before first paint so there is no light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ClickSound />
        <OwnerHeartbeat />
        <EdgeFades />
        <PullCord />
        {children}
      </body>
    </html>
  );
}
