import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
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
        url: "https://builderbio.dev/og-image.png",
        width: 1200,
        height: 630,
        alt: "BuilderBio — {B}",
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
    images: ["https://builderbio.dev/og-image.png"],
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

function Footer() {
  return (
    <footer className="py-6 text-center text-xs text-text-muted">
      <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-3">
        <p>
          The bio link for builders who ship with AI
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://x.com/gavin0922"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
            title="X (Twitter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/gavin-c-b271a492/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
            title="LinkedIn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

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
        <Footer />
      </body>
    </html>
  );
}
