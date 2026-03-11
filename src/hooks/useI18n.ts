"use client";

import { useCallback } from "react";

const translations: Record<string, string> = {
  // Landing
  "hero.title": "Your bio link as a builder",
  "hero.subtitle":
    "How you build with AI is who you are. One command turns your daily coding sessions into a shareable profile. Drop it in your bio.",
  "hero.tagline": "",
  "hero.install": "PASTE INTO YOUR CODING AGENT",
  "hero.howItWorks": "How it works",

  // Steps
  "step.1.title": "Install",
  "step.1.desc":
    "Paste the command into your coding agent. It installs a skill file and parser script into ~/.builderbio/ — you can read every line before running.",
  "step.2.title": "Analyze",
  "step.2.desc":
    "Your agent reads local session logs and computes stats: session counts, tool usage, activity patterns. No code or conversation content leaves your machine.",
  "step.3.title": "Share",
  "step.3.desc":
    "You can ask your agent to tweak anything before sharing — make sure it says what you want. Drop the link in your LinkedIn, GitHub, or resume.",

  // Dashboard
  "dashboard.title": "My Profile",
  "dashboard.publish": "Go Live",
  "dashboard.unpublish": "Take Offline",
  "dashboard.noProfile":
    "Your builder card is empty. Run /builderbio-summarize to generate it.",
  "dashboard.cognitiveStyle": "How You Think",
  "dashboard.capabilities": "What You Build With",
  "dashboard.activity": "When You Build",
  "dashboard.frameworkSentences": "Who You Are",
  "dashboard.fingerprint": "How You Work",

  // Club
  "club.title": "Builder Directory",
  "club.search": "Find builders...",
  "club.noResults": "No builders found",

  // Common
  "common.loading": "Loading...",
  "common.sessions": "sessions",
  "common.tokens": "tokens",
};

export function useI18n() {
  const t = useCallback((key: string): string => {
    return translations[key] || key;
  }, []);

  return { t };
}
