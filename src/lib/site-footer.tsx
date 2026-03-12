const SITE_FOOTER_TEXT = "The bio link for builders who ship with AI";

const SITE_FOOTER_LINKS = [
  {
    href: "https://x.com/gavin0922",
    title: "X (Twitter)",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    href: "https://www.linkedin.com/in/gavin-c-b271a492/",
    title: "LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="py-6 text-center text-xs text-text-muted">
      <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-3">
        <p>{SITE_FOOTER_TEXT}</p>
        <div className="flex items-center gap-4">
          {SITE_FOOTER_LINKS.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
              title={link.title}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d={link.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function getStandaloneFooterHtml(): string {
  const links = SITE_FOOTER_LINKS.map(
    (link) =>
      `<a href="${link.href}" target="_blank" rel="noopener noreferrer" style="color:var(--tm);transition:color .2s" onmouseover="this.style.color='var(--t2)'" onmouseout="this.style.color='var(--tm)'" title="${link.title}"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="${link.path}"/></svg></a>`
  ).join("");

  return `<div class="footer" style="padding:24px 0;text-align:center;font-size:12px;color:var(--tm)"><p style="margin:0 0 8px">${SITE_FOOTER_TEXT}</p><div style="display:flex;align-items:center;justify-content:center;gap:16px">${links}</div></div>`;
}

export function replaceStandaloneFooterHtml(html: string): string {
  const start = html.indexOf('<div class="footer"');
  if (start === -1) return html;

  let cursor = start;
  let depth = 0;

  while (cursor < html.length) {
    const nextOpen = html.indexOf("<div", cursor);
    const nextClose = html.indexOf("</div>", cursor);

    if (nextClose === -1) return html;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      cursor = nextOpen + 4;
      continue;
    }

    depth -= 1;
    cursor = nextClose + 6;

    if (depth === 0) {
      return `${html.slice(0, start)}${getStandaloneFooterHtml()}${html.slice(
        cursor
      )}`;
    }
  }

  return html;
}
