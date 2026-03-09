import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "coding-dna — Developer Skill Profile",
    template: "%s | coding-dna",
  },
  description:
    "Analyze your AI coding conversations. Discover your developer DNA. Connect with the community.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://coding-dna.vercel.app"
  ),
  openGraph: {
    title: "coding-dna",
    description:
      "Analyze your AI coding conversations. Discover your developer DNA.",
    type: "website",
    siteName: "coding-dna",
  },
  twitter: {
    card: "summary_large_image",
    title: "coding-dna",
    description:
      "Analyze your AI coding conversations. Discover your developer DNA.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0D1117",
};

function Titlebar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-accent font-bold text-sm tracking-wide">
          <span className="text-text-muted">~/</span>coding-dna
        </Link>
        <nav className="flex items-center gap-4 text-xs text-text-secondary">
          <Link href="/club" className="hover:text-accent transition-colors">
            /club
          </Link>
          <Link href="/me" className="hover:text-accent transition-colors">
            /me
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary/50 py-6 text-center text-xs text-text-muted">
      <div className="mx-auto max-w-6xl px-4">
        <p>
          <span className="text-accent">$</span> coding-dna v0.1.0 — built for
          developers who code with AI
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}>
        <Titlebar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
