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

export const metadata: Metadata = {
  title: {
    default: "Wendenzo — Trip Planner",
    template: "%s • Wendenzo",
  },
  description:
    "Wendenzo è una piattaforma per creare itinerari giorno per giorno: planner, mappe, note, budget e template. Non è un sito di prenotazioni.",
  applicationName: "Wendenzo",
  keywords: [
    "trip planner",
    "itinerario",
    "pianificazione viaggio",
    "travel planner",
    "template itinerari",
    "budget viaggio",
  ],
  authors: [{ name: "Wendenzo" }],
  creator: "Wendenzo",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Wendenzo — Trip Planner",
    description:
      "Crea itinerari giorno per giorno con planner, mappe, note e budget. Template pronti e pianificazione su misura.",
    type: "website",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wendenzo — Trip Planner",
    description:
      "Planner viaggi: itinerari giorno per giorno, mappe, note, budget e template.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5B5AF7", // coerente con accent
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}