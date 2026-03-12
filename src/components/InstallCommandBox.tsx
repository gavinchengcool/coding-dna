"use client";

import { useState } from "react";

interface InstallCommandBoxProps {
  eyebrow: string;
  align?: "left" | "center";
  glow?: boolean;
}

const INSTALL_CMD = "curl -sfL https://builderbio.dev/install.sh | bash";
const AGENT_BADGES = ["OpenClaw", "Codex", "Claude Code", "Cursor"];

export default function InstallCommandBox({
  eyebrow,
  align = "center",
  glow = false,
}: InstallCommandBoxProps) {
  const [copied, setCopied] = useState(false);
  const isCentered = align === "center";

  function handleCopy() {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={isCentered ? "text-center" : "text-left"}>
      <p className="text-[10px] sm:text-xs text-accent mb-3 font-bold tracking-wider leading-relaxed">
        {eyebrow}
      </p>

      <div
        className={`flex items-center gap-2 mb-4 flex-wrap ${
          isCentered ? "justify-center" : "justify-start"
        }`}
      >
        {AGENT_BADGES.map((name) => (
          <span
            key={name}
            className="text-[10px] h-5 px-2 rounded-full border border-border text-text-secondary inline-flex items-center justify-center"
          >
            {name}
          </span>
        ))}
        <span
          className="text-[10px] h-5 px-2 rounded-full border border-border text-text-secondary inline-flex items-center justify-center"
          style={{ paddingBottom: "3px" }}
        >
          ...
        </span>
      </div>

      <div
        className={`terminal-block relative w-full pr-14 sm:pr-16 ${
          isCentered ? "sm:inline-flex sm:w-auto" : ""
        } ${glow ? "glow-breathe" : ""}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-accent shrink-0">$</span>
          <code className="text-[10px] sm:text-sm text-text-primary break-all sm:break-normal min-w-0">
            {INSTALL_CMD}
          </code>
        </div>
        <button
          onClick={handleCopy}
          className="absolute inset-y-0 right-0 w-12 sm:w-14 flex items-center justify-center border-l border-border transition-colors text-text-muted hover:text-accent rounded-r-[7px]"
          title="Copy to clipboard"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
