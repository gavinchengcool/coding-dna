import type { Metadata } from "next";
import Titlebar from "@/components/Titlebar";

export const metadata: Metadata = {
  title: "Taste Board — Discover Builders Who Ship with AI",
  description:
    "Browse developer profiles built with AI coding agents. Find builders by tech stack, coding style, and what they shipped. A directory of developers who build with Claude Code, Codex, and Cursor.",
  alternates: {
    canonical: "https://builderbio.dev/taste-board",
  },
  openGraph: {
    title: "Taste Board — Discover Builders Who Ship with AI",
    description:
      "Browse developer profiles built with AI coding agents. Find builders by tech stack, coding style, and what they shipped.",
    url: "https://builderbio.dev/taste-board",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taste Board — Discover Builders Who Ship with AI",
    description:
      "Browse developer profiles built with AI coding agents. Find builders by tech stack, coding style, and what they shipped.",
  },
};

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Titlebar useInternalRootLinks />
      <div className="pt-12">{children}</div>
    </>
  );
}
