import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Resolutie - Goal Setting & Habit Tracker",
  description: "Transform your dreams into achievable goals with SMART objectives, daily habits, and progress tracking. Built with Neo-brutalism design.",
  keywords: ["goal setting", "habit tracker", "SMART goals", "OKR", "productivity"],
  authors: [{ name: "Resolutie" }],
  openGraph: {
    title: "Resolutie - Goal Setting & Habit Tracker",
    description: "Transform your dreams into achievable goals with SMART objectives and daily habits.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
