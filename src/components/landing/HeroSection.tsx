"use client";

import { useState } from "react";

interface HeroSectionProps {
  t: (key: string) => string;
  locale: string;
  onToggleLocale: () => void;
}

export default function HeroSection({ t, locale, onToggleLocale }: HeroSectionProps) {
  const [copied, setCopied] = useState(false);
  const installCmd = "curl -sfL https://coding-dna.vercel.app/install.sh | bash";

  function handleCopy() {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-3xl text-center">
        {/* Language toggle */}
        <button
          onClick={onToggleLocale}
          className="mb-8 text-xs text-text-muted hover:text-accent transition-colors border border-border rounded px-2 py-1"
        >
          {locale === "en" ? "中文" : "EN"}
        </button>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          <span className="text-text-muted">~/</span>
          <span className="text-accent">coding-dna</span>
        </h1>
        <p className="text-lg md:text-xl text-text-secondary mb-2">
          {t("hero.title")}
        </p>
        <p className="text-sm text-text-muted max-w-xl mx-auto mb-10">
          {t("hero.subtitle")}
        </p>

        {/* Install command */}
        <div className="mb-12">
          <p className="text-xs text-text-muted mb-3">{t("hero.install")}</p>
          <div
            className="terminal-block inline-flex items-center gap-3 cursor-pointer hover:border-accent/50 transition-colors max-w-full"
            onClick={handleCopy}
          >
            <span className="text-accent shrink-0">$</span>
            <code className="text-xs sm:text-sm text-text-primary break-all sm:break-normal">{installCmd}</code>
            <span className="text-xs text-text-muted ml-2 shrink-0 hidden sm:inline">
              {copied ? "copied!" : "click to copy"}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-2 sm:hidden">
            {copied ? "copied!" : "tap to copy"}
          </p>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="text-sm text-text-muted mb-8 tracking-wider uppercase">
            {t("hero.howItWorks")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="terminal-block text-left space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold text-lg">
                    {String(step).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    {t(`step.${step}.title`)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t(`step.${step}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample profile preview */}
        <div className="mt-20">
          <div className="terminal-block max-w-md mx-auto text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-danger"></span>
              <span className="w-3 h-3 rounded-full bg-warning"></span>
              <span className="w-3 h-3 rounded-full bg-accent"></span>
              <span className="text-xs text-text-muted ml-2">profile.json</span>
            </div>
            <pre className="text-xs text-text-secondary leading-relaxed">
{`{
  "cognitive_style": {
    "explorer_vs_optimizer": `}<span className="text-accent">0.72</span>{`,
    "move_fast_vs_careful": `}<span className="text-accent">0.65</span>{`
  },
  "framework_sentences": [
    "`}<span className="text-info">The kind of developer who</span>{`
     `}<span className="text-info">refactors before adding features</span>{`"
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
