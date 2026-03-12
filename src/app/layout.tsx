import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/lib/site-footer";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "builderbio — The Bio Link for Builders Who Ship with AI",
    template: "%s | builderbio",
  },
  description:
    "How you build with AI is who you are. One command scans your coding agent sessions and generates a shareable developer profile. Show what you shipped, your tech stack, building style, and activity — drop it in your bio.",
  keywords: [
    "developer profile",
    "AI coding agent",
    "Claude Code",
    "Codex",
    "Cursor",
    "developer portfolio",
    "bio link",
    "builder profile",
    "coding DNA",
    "AI pair programming",
    "developer showcase",
    "tech stack",
    "open source profile",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://builderbio.dev"
  ),
  alternates: {
    canonical: "https://builderbio.dev",
  },
  openGraph: {
    title: "builderbio — The Bio Link for Builders Who Ship with AI",
    description:
      "One command scans your coding agent sessions and generates a shareable developer profile. Show what you shipped, your tech stack, and building style.",
    type: "website",
    siteName: "builderbio",
    url: "https://builderbio.dev",
    locale: "en_US",
    images: [
      {
        url: "https://builderbio.dev/og-image.png?v=4",
        width: 1200,
        height: 630,
        alt: "builderbio — The bio link for builders who ship with AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@gavin0922",
    creator: "@gavin0922",
    title: "builderbio — The Bio Link for Builders Who Ship with AI",
    description:
      "One command scans your coding agent sessions and generates a shareable developer profile. Show what you shipped, your tech stack, and building style.",
    images: ["https://builderbio.dev/og-image.png?v=4"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "builderbio",
    url: "https://builderbio.dev",
    description:
      "The bio link for builders who ship with AI. One command scans your coding agent sessions and generates a shareable developer profile.",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Linux",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: "Gavin",
      url: "https://gavin.builderbio.dev",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
