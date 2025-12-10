import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap", // Performance Engineer Mandate (FOIT prevention)
});

export const metadata: Metadata = {
  title: {
    template: "%s | Toolify.ai Replica",
    default: "Toolify.ai Replica - Best AI Tools Directory",
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
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable}`}>
        <AuthProviderContext>
          {children}
        </AuthProviderContext>
      </body>
    </html>
  );
}
