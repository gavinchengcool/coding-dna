"use client";

import Link from "next/link";

type TopNavProps = {
  activeHome?: boolean;
  activeTasteBoard?: boolean;
  activeBuiltBy?: boolean;
  fixed?: boolean;
  className?: string;
  useInternalRootLinks?: boolean;
};

export default function TopNav({
  activeHome = false,
  activeTasteBoard = false,
  activeBuiltBy = false,
  fixed = false,
  className = "",
  useInternalRootLinks = false,
}: TopNavProps) {
  const wrapperClassName = fixed
    ? "fixed top-0 left-0 right-0 z-50"
    : "relative z-10";

  const homeClassName = `inline-flex items-center font-bold text-sm tracking-wide ${
    activeHome ? "text-accent" : "text-text-secondary hover:text-accent"
  }`;
  const tasteBoardClassName = `inline-flex items-center justify-center ${
    activeTasteBoard ? "text-accent" : "hover:text-accent"
  }`;
  const builtByClassName = `inline-flex items-center justify-center ${
    activeBuiltBy ? "text-accent" : "hover:text-accent"
  }`;

  return (
    <header className={`${wrapperClassName} ${className}`.trim()}>
      <div
        className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4"
        style={{ fontFamily: "var(--font-builderbio-recap)" }}
      >
        <div className="inline-flex h-6 items-center">
          {useInternalRootLinks ? (
            <Link href="/" className={homeClassName}>
              ~/builderbio
            </Link>
          ) : (
            <a href="https://builderbio.dev" className={homeClassName}>
              ~/builderbio
            </a>
          )}
        </div>
        <nav className="flex items-center gap-2 text-xs text-text-secondary">
          <div className="flex h-6 min-w-[7.5rem] items-center justify-center">
            {useInternalRootLinks ? (
              <Link href="/taste-board" className={tasteBoardClassName}>
                /taste-board
              </Link>
            ) : (
              <a href="https://builderbio.dev/taste-board" className={tasteBoardClassName}>
                /taste-board
              </a>
            )}
          </div>
          <span className="text-text-muted">·</span>
          <div className="flex h-6 min-w-[6.5rem] items-center justify-center">
            <a href="https://gavin.builderbio.dev" className={builtByClassName}>
              /built-by
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
