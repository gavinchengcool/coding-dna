"use client";

import { useCallback } from "react";

const translations: Record<string, string> = {
  // Landing
  "hero.title": "Your bio link as a builder",
  "hero.subtitle":
    "How you build with AI is who you are. One command turns your daily coding sessions into a shareable profile. Drop it in your bio.",
  "hero.tagline": "",
  "hero.install": "PASTE AND SEND THIS TO YOUR CODING AGENT",
  "hero.howItWorks": "How it works",

  // Steps
  "step.1.title": "Install",
  "step.1.desc":
    "Copy the command above, paste it into your coding agent. It learns the skill and takes it from there.",
  "step.2.title": "Generate",
  "step.2.desc":
    "AI reads your local sessions and distills your builder identity — all data stays on your device.",
  "step.3.title": "Share",
  "step.3.desc":
    "Get a builderbio page. Drop it in your LinkedIn, Twitter, GitHub — or share with anyone.",

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
