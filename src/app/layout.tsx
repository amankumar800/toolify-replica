import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap", // Performance Engineer Mandate (FOIT prevention)
});

export const metadata: Metadata = {
  title: {
    template: "%s | AI Tools Book",
    default: "AI Tools Book - Best AI Tools Directory",
  },
  description: "Discover the best AI tools for your workflow.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

import { AuthProviderContext } from "@/components/providers/AuthProviderContext";

// ... (Metadata remains same)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning: Required because browser extensions and dev tools 
  // (e.g., Antigravity) may inject classes into html/body before React hydrates.
  // This is safe because it only affects these two elements, not their children.
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable}`} suppressHydrationWarning>
        <AuthProviderContext>
          {children}
        </AuthProviderContext>
        <SpeedInsights />
      </body>
    </html>
  );
}
