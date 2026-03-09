"use client";

import { useState, useCallback } from "react";

type Locale = "en" | "zh";

const translations: Record<string, Record<Locale, string>> = {
  // Landing
  "hero.title": {
    en: "Discover your Developer DNA",
    zh: "发现你的开发者基因",
  },
  "hero.subtitle": {
    en: "Analyze your AI coding conversations. Build your skill profile. Connect with the community.",
    zh: "分析你的 AI 编程对话。构建技能画像。连接开发者社区。",
  },
  "hero.install": {
    en: "Install in one command",
    zh: "一条命令安装",
  },
  "hero.howItWorks": {
    en: "How it works",
    zh: "工作原理",
  },

  // Steps
  "step.1.title": { en: "Install", zh: "安装" },
  "step.1.desc": {
    en: "Run the install script to set up coding-dna skills in your AI tools",
    zh: "运行安装脚本，在 AI 工具中配置 coding-dna 技能",
  },
  "step.2.title": { en: "Analyze", zh: "分析" },
  "step.2.desc": {
    en: "Run /coding-dna-summarize to analyze your conversations locally",
    zh: "运行 /coding-dna-summarize 本地分析你的对话",
  },
  "step.3.title": { en: "Discover", zh: "发现" },
  "step.3.desc": {
    en: "View your profile, share it, and find other developers",
    zh: "查看画像、分享、发现其他开发者",
  },

  // Dashboard
  "dashboard.title": { en: "My Profile", zh: "我的画像" },
  "dashboard.publish": { en: "Publish", zh: "发布" },
  "dashboard.unpublish": { en: "Unpublish", zh: "取消发布" },
  "dashboard.noProfile": {
    en: "No profile yet. Run /coding-dna-summarize in your AI tool to generate one.",
    zh: "还没有画像。在 AI 工具中运行 /coding-dna-summarize 来生成。",
  },
  "dashboard.cognitiveStyle": { en: "Cognitive Style", zh: "认知风格" },
  "dashboard.capabilities": { en: "Capabilities", zh: "能力环" },
  "dashboard.activity": { en: "Activity", zh: "活动热力图" },
  "dashboard.frameworkSentences": { en: "Framework Sentences", zh: "框架句" },
  "dashboard.fingerprint": { en: "Behavioral Fingerprint", zh: "行为指纹" },

  // Club
  "club.title": { en: "Developer Club", zh: "开发者俱乐部" },
  "club.search": { en: "Search developers...", zh: "搜索开发者..." },
  "club.noResults": { en: "No developers found", zh: "未找到开发者" },

  // Common
  "common.loading": { en: "Loading...", zh: "加载中..." },
  "common.sessions": { en: "sessions", zh: "会话" },
  "common.tokens": { en: "tokens", zh: "tokens" },
};

export function useI18n() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("coding-dna-locale") as Locale;
      if (saved) return saved;
      return navigator.language.startsWith("zh") ? "zh" : "en";
    }
    return "en";
  });

  const t = useCallback(
    (key: string): string => {
      return translations[key]?.[locale] || key;
    },
    [locale]
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "en" ? "zh" : "en";
      localStorage.setItem("coding-dna-locale", next);
      return next;
    });
  }, []);

  return { t, locale, toggleLocale };
}
