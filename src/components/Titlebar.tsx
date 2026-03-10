import Link from "next/link";

export default function Titlebar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-secondary/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-accent font-bold text-sm tracking-wide">
          <span className="text-text-muted">~/</span>builderbio
        </Link>
        <nav className="flex items-center gap-4 text-xs text-text-secondary">
          <Link href="/club" className="hover:text-accent transition-colors">
            /taste-board
          </Link>
          <span className="text-text-muted">·</span>
          <Link href="/me" className="hover:text-accent transition-colors">
            /built-by
          </Link>
        </nav>
      </div>
    </header>
  );
}
