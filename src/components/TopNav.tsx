"use client";

type TopNavProps = {
  activeHome?: boolean;
  activeTasteBoard?: boolean;
  activeBuiltBy?: boolean;
  fixed?: boolean;
  className?: string;
};

export default function TopNav({
  activeHome = false,
  activeTasteBoard = false,
  activeBuiltBy = false,
  fixed = false,
  className = "",
}: TopNavProps) {
  const wrapperClassName = fixed
    ? "fixed top-0 left-0 right-0 z-50"
    : "relative z-10";

  return (
    <header className={`${wrapperClassName} ${className}`.trim()}>
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <a
          href="https://builderbio.dev"
          className={`inline-flex items-center font-bold text-sm tracking-wide transition-colors ${
            activeHome ? "text-accent" : "text-text-secondary hover:text-accent"
          }`}
        >
          ~/builderbio
        </a>
        <nav className="flex items-center gap-4 text-xs text-text-secondary">
          <a
            href="https://builderbio.dev/taste-board"
            className={`inline-flex items-center transition-colors ${
              activeTasteBoard ? "text-accent" : "hover:text-accent"
            }`}
          >
            /taste-board
          </a>
          <span className="text-text-muted">·</span>
          <a
            href="https://gavin.builderbio.dev"
            className={`inline-flex items-center transition-colors ${
              activeBuiltBy ? "text-accent" : "hover:text-accent"
            }`}
          >
            /built-by
          </a>
        </nav>
      </div>
    </header>
  );
}
