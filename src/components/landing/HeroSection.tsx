"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface HeroSectionProps {
  t: (key: string) => string;
}

export default function HeroSection({ t }: HeroSectionProps) {
  const [copied, setCopied] = useState(false);
  const installCmd = "curl -sfL https://builderbio.dev/install.sh | bash";
  const sectionRef = useRef<HTMLElement>(null);

  function handleCopy() {
    navigator.clipboard.writeText(installCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const targets = section.querySelectorAll(".fade-in-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="pb-12 sm:pb-24 px-4 hero-glow">
      {/* Nav */}
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 text-accent font-bold text-xs sm:text-sm tracking-wide">
          <span className="text-text-muted">~/</span>builderbio
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4 text-xs text-text-secondary">
          <Link href="/club" className="hover:text-accent transition-colors">
            /taste-board
          </Link>
          <span className="text-text-muted">·</span>
          <Link href="/me" className="hover:text-accent transition-colors">
            /built-by
          </Link>
        </nav>
      </div>

      <div className="mx-auto max-w-5xl text-center relative z-10 pt-12 sm:pt-24">
        {/* Slogan */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tight text-accent leading-[0.95]" style={{ wordSpacing: '-0.15em' }}>
          Show the world<br />your taste
        </h1>
        <p className="text-xs sm:text-sm md:text-lg font-normal text-text-secondary italic mt-6 sm:mt-10 mb-16 sm:mb-28">
          Because how you build with AI is who you are
        </p>

        {/* Install command */}
        <div className="mb-16 sm:mb-28 fade-in-up">
          <p className="text-[10px] sm:text-xs text-accent mb-3 font-bold tracking-wider leading-relaxed">
            {t("hero.install")}
          </p>
          <div className="terminal-block flex items-center gap-2 sm:gap-3 w-full sm:inline-flex sm:w-auto glow-breathe">
            <span className="text-accent shrink-0">$</span>
            <code className="text-[10px] sm:text-sm text-text-primary break-all sm:break-normal min-w-0">{installCmd}</code>
            <button
              onClick={handleCopy}
              className="shrink-0 ml-auto sm:ml-2 p-1.5 rounded hover:bg-bg-tertiary transition-colors text-text-muted hover:text-accent"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-16 sm:mb-20 fade-in-up">
          <h2 className="text-xs text-text-muted mb-6 sm:mb-8 tracking-wider uppercase">
            {t("hero.howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Built by — creator section */}
        <div className="mb-8 fade-in-up">
          <h2 className="text-xs text-text-muted mb-6 sm:mb-8 tracking-wider uppercase">
            Built by
          </h2>
          <div className="terminal-block max-w-md mx-auto text-left border-accent/30">
            {/* Window chrome */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-danger"></span>
              <span className="w-3 h-3 rounded-full bg-warning"></span>
              <span className="w-3 h-3 rounded-full bg-accent"></span>
              <span className="text-xs text-text-muted ml-2">builderbio.dev/u/gavin</span>
            </div>
            {/* Profile */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/avatar-gavin.jpg"
                  alt="Gavin"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-text-primary">Gavin</p>
                  <p className="text-xs text-text-muted">builder of builderbio</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary italic leading-relaxed">
                &quot;The kind of builder who ships the product before writing the pitch.&quot;
              </p>
              <div className="flex gap-2 flex-wrap">
                {["Next.js", "TypeScript", "AI-native", "Ship fast"].map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full border border-border text-text-secondary">
                    {s}
                  </span>
                ))}
              </div>
              {/* Social links */}
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <a
                  href="https://builderbio.dev/u/gavin"
                  className="text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  /u/gavin
                </a>
                <a
                  href="https://x.com/gavin0922"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted hover:text-text-secondary transition-colors"
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
                  className="text-text-muted hover:text-text-secondary transition-colors"
                  title="LinkedIn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
