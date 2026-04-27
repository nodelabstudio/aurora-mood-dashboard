import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import "@/styles/glass.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const TITLE = "Aurora: a glass weather dashboard with literary AI narration";
const DESCRIPTION =
  "Aurora is a glass weather dashboard. It picks a cinematic sky photo for your conditions and has an AI write a literary paragraph about what's outside.";

// Resolves to the custom domain in production (set SITE_URL on Vercel),
// falls back to the Vercel auto-URL on previews, or localhost in dev.
const SITE_URL =
  process.env.SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/scenes/og.png",
        width: 1200,
        height: 1200,
        alt: "Aurora — a glass weather dashboard composed over a Malick-grade dusk sky.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/scenes/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
