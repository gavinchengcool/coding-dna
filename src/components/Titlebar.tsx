"use client";

import { usePathname } from "next/navigation";

export default function Titlebar() {
  const pathname = usePathname();
  const isTasteBoard = pathname.startsWith("/taste-board");

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-sm" style={{position:'relative'}}>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg, transparent, var(--border), transparent)'}} />
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <a
          href="https://builderbio.dev"
          className="flex items-center gap-2 text-text-secondary font-bold text-sm tracking-wide hover:text-accent transition-colors"
        >
          <span className="text-text-muted">~/</span>builderbio
        </a>
        <nav className="flex items-center gap-4 text-xs text-text-secondary">
          <a
            href="https://builderbio.dev/taste-board"
            className={isTasteBoard ? "text-accent" : "hover:text-accent transition-colors"}
          >
            /taste-board
          </a>
          <span className="text-text-muted">·</span>
          <a href="https://gavin.builderbio.dev" className="hover:text-accent transition-colors">
            /built-by
          </a>
        </nav>
      </div>
    </header>
  );
}
