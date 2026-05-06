import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ResumeForge — AI Career Intelligence Platform",
    template: "%s | ResumeForge",
  },
  description:
    "Optimize your resume with AI-powered ATS scoring, skill gap analysis, and mock interviews. Land your dream job faster.",
  keywords: ["resume", "ATS", "AI", "career", "job search", "interview prep"],
  authors: [{ name: "ResumeForge" }],
  openGraph: {
    title: "ResumeForge — AI Career Intelligence Platform",
    description: "Optimize your resume with AI-powered tools",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-surface text-zinc-50 antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            expand={false}
            duration={4000}
          />
        </Providers>
      </body>
    </html>
  );
}
