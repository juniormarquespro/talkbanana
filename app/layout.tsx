import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CookieBanner } from "@/components/CookieBanner";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TalkBanana",
    template: "%s | TalkBanana",
  },
  description: "Tradução de voz em tempo real. Fale — o app traduz instantaneamente com IA.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "TalkBanana",
    title: "TalkBanana — Tradução de voz em tempo real",
    description: "Fale em qualquer idioma. TalkBanana traduz instantaneamente com Whisper + Claude.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TalkBanana",
    description: "Tradução de voz em tempo real com IA.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1,
  themeColor: "#0a0800",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <div style={{
          position: "fixed", inset: 0, zIndex: -1,
          background: "linear-gradient(135deg, #0a0800 0%, #1a1400 50%, #0a0800 100%)",
        }} />
        <Providers initialIdioma="pt-BR">
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
