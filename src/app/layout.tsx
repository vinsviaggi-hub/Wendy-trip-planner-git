import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  title: {
    default: "Wendenzo — Trip Planner",
    template: "%s • Wendenzo",
  },
  description:
    "Wendenzo è una piattaforma per creare itinerari giorno per giorno: planner, mappe, note, budget e template. Non è un sito di prenotazioni.",
  applicationName: "Wendenzo",
  metadataBase: new URL(siteUrl),
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ✅ COFFEE (non dark)
  themeColor: "#f5ece0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-screen antialiased text-[rgb(var(--ink))] bg-[rgb(var(--bg))]">
        {children}
      </body>
    </html>
  );
}
