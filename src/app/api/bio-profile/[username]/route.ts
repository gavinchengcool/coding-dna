import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { normalizeBuilderBioData } from "@/lib/builderbio";
import { eq, and } from "drizzle-orm";
import { sha256 } from "@/lib/auth";
import { readFile } from "fs/promises";
import { join } from "path";

// Theme CSS variable overrides
const THEMES: Record<
  string,
  {
    vars: string;
    glow: string;
    badgeBorder: string;
    ctaGradient: string;
    bodyOverrides?: string;
  }
> = {
  default: {
    vars: "--ac:#818cf8;--acd:#6366f1;--acb:rgba(99,102,241,.08)",
    glow: "rgba(99,102,241,.06)",
    badgeBorder: "rgba(99,102,241,.15)",
    ctaGradient: "rgba(99,102,241,.06),rgba(52,211,153,.04)",
  },
  "yc-orange": {
    vars: "--ac:#FF6B35;--acd:#E55A2B;--acb:rgba(255,107,53,.08)",
    glow: "rgba(255,107,53,.06)",
    badgeBorder: "rgba(255,107,53,.15)",
    ctaGradient: "rgba(255,107,53,.06),rgba(52,211,153,.04)",
  },
  "terminal-green": {
    vars: "--ac:#00FF41;--acd:#00CC33;--acb:rgba(0,255,65,.08)",
    glow: "rgba(0,255,65,.06)",
    badgeBorder: "rgba(0,255,65,.15)",
    ctaGradient: "rgba(0,255,65,.06),rgba(0,204,51,.04)",
    bodyOverrides:
      "font-family:'SF Mono','Fira Code','JetBrains Mono','Cascadia Code',monospace",
  },
  "minimal-light": {
    vars: "--ac:#111111;--acd:#333333;--acb:rgba(0,0,0,.05)",
    glow: "rgba(0,0,0,.03)",
    badgeBorder: "rgba(0,0,0,.1)",
    ctaGradient: "rgba(0,0,0,.03),rgba(0,0,0,.01)",
  },
  cyberpunk: {
    vars: "--ac:#f472b6;--acd:#ec4899;--acb:rgba(244,114,182,.08)",
    glow: "rgba(244,114,182,.06)",
    badgeBorder: "rgba(244,114,182,.15)",
    ctaGradient: "rgba(244,114,182,.06),rgba(96,165,250,.04)",
  },
};

// Minimal Light needs full background/text color overrides
const MINIMAL_LIGHT_CSS = `
:root{--bg:#fafafa;--s1:#ffffff;--s2:#f5f5f5;--s3:#eeeeee;--bd:#e0e0e0;--bd2:#d0d0d0;--t:#111111;--t2:#444444;--tm:#888888;--ac:#111111;--acd:#333333;--acb:rgba(0,0,0,.05);--g:#059669;--gd:rgba(5,150,105,.1);--y:#d97706;--yd:rgba(217,119,6,.1);--b:#2563eb;--bd3:rgba(37,99,235,.1);--p:#7c3aed;--pd:rgba(124,58,237,.1);--o:#ea580c;--od:rgba(234,88,12,.1);--pk:#db2777;--r:#dc2626}
.hm-0{background:#eeeeee}.hm-1{background:rgba(5,150,105,.18)}.hm-2{background:rgba(5,150,105,.38)}.hm-3{background:rgba(5,150,105,.6)}.hm-4{background:rgba(5,150,105,.88)}
`;

/**
 * Compute the verification hash from BuilderBio D data.
 * Must match the client-side computation in SKILL.md.
 */
async function computeVerificationHash(
  D: Record<string, unknown>
): Promise<string> {
  const profile = D.profile as Record<string, unknown> | undefined;
  const projects = D.projects as unknown[] | undefined;
  const key = [
    profile?.total_sessions ?? 0,
    profile?.total_turns ?? 0,
    profile?.total_tokens ?? 0,
    profile?.active_days ?? 0,
    projects?.length ?? 0,
  ].join("|");
  return sha256(key);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Allow alphanumeric + hyphens (usernames) and 8-char short codes
  if (
    !/^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(username) &&
    !/^[a-z0-9]{1,8}$/.test(username)
  ) {
    return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        username: users.username,
        displayName: users.displayName,
        builderBioData: profiles.builderBioData,
        dataHash: profiles.dataHash,
        styleTheme: profiles.styleTheme,
        updatedAt: profiles.updatedAt,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.username, username), eq(profiles.isPublic, 1)))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const result = results[0];
    const rawBioData = result.builderBioData as {
      D: Record<string, unknown>;
      E: Record<string, unknown>;
    } | null;

    if (!rawBioData || !rawBioData.D || !rawBioData.E) {
      return NextResponse.json(
        { error: "BuilderBio data not available" },
        { status: 404 }
      );
    }

    const bioData = normalizeBuilderBioData(rawBioData);

    // Verify Unfiltered status
    let isUnfiltered = false;
    if (result.dataHash) {
      const expectedHash = await computeVerificationHash(bioData.D);
      isUnfiltered = result.dataHash === expectedHash;
    }

    // Determine theme
    const themeName = result.styleTheme || "default";
    const theme = THEMES[themeName] || THEMES["default"];

    // Generate time
    const genTime = result.updatedAt
      ? result.updatedAt.toISOString().split("T")[0]
      : "";

    // Read the template
    const templatePath = join(
      process.cwd(),
      "public",
      "skills",
      "builderbio",
      "assets",
      "template.html"
    );
    let template = await readFile(templatePath, "utf-8");

    // Apply theme CSS variables
    template = template.replace(
      /--ac:#818cf8;--acd:#6366f1;--acb:rgba\(99,102,241,\.08\)/,
      theme.vars
    );
    template = template.replace(
      /rgba\(99,102,241,\.06\)0%/g,
      `${theme.glow}0%`
    );
    template = template.replace(
      /rgba\(99,102,241,\.15\)/g,
      theme.badgeBorder
    );
    template = template.replace(
      /rgba\(99,102,241,\.06\),rgba\(52,211,153,\.04\)/,
      theme.ctaGradient
    );

    // Apply body font override for terminal-green
    if (theme.bodyOverrides) {
      template = template.replace(
        "body{font-family:-apple-system,BlinkMacSystemFont,",
        `body{${theme.bodyOverrides};font-family:-apple-system,BlinkMacSystemFont,`
      );
      // Actually replace the whole font-family for terminal
      template = template.replace(
        /body\{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif;/,
        `body{${theme.bodyOverrides};`
      );
    }

    // Inject full CSS override for Minimal Light theme
    if (themeName === "minimal-light") {
      template = template.replace("</style>", `${MINIMAL_LIGHT_CSS}</style>`);
    }

    // Cyberpunk: add neon glow effects
    if (themeName === "cyberpunk") {
      const cyberpunkCSS = `
.hero h1{text-shadow:0 0 20px rgba(244,114,182,.3),0 0 40px rgba(244,114,182,.1)}
.stat .num{text-shadow:0 0 12px rgba(244,114,182,.2)}
.style-label{background:linear-gradient(135deg,#f472b6,#60a5fa)!important;-webkit-background-clip:text;background-clip:text}
`;
      template = template.replace("</style>", `${cyberpunkCSS}</style>`);
    }

    // Replace footer to match site-wide footer
    template = template.replace(
      /<div class="footer" id="footer-text"[^>]*>[\s\S]*?<\/div>/,
      `<div class="footer" style="padding:24px 0;text-align:center;font-size:12px;color:var(--tm)">
  <p style="margin:0 0 8px">The bio link for builders who ship with AI</p>
  <div style="display:flex;align-items:center;justify-content:center;gap:16px">
    <a href="https://x.com/gavin0922" target="_blank" rel="noopener noreferrer" style="color:var(--tm);transition:color .2s" title="X (Twitter)">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </a>
    <a href="https://www.linkedin.com/in/gavin-c-b271a492/" target="_blank" rel="noopener noreferrer" style="color:var(--tm);transition:color .2s" title="LinkedIn">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </a>
  </div>
</div>`
    );

    // Update the footer JS to not overwrite
    template = template.replace(
      /^document\.getElementById\('footer-text'\)\.innerHTML=.*$/m,
      `// footer rendered in HTML`
    );

    // Inject SEO meta tags
    const profileD = bioData.D as Record<string, Record<string, unknown>>;
    const displayName =
      (profileD.profile?.display_name as string) || username;
    const totalSessions = profileD.profile?.total_sessions || 0;
    const totalTurns = profileD.profile?.total_turns || 0;
    const activeDays = profileD.profile?.active_days || 0;
    const agents = profileD.profile?.agents_used
      ? Object.keys(
          profileD.profile.agents_used as Record<string, unknown>
        ).join(" and ")
      : "AI coding agents";
    const pageTitle = `${displayName}'s BuilderBio — What I Built with AI`;
    const pageDesc = `${totalSessions} sessions, ${totalTurns.toLocaleString()} turns, ${activeDays} active days of building with ${agents}. See what ${displayName} shipped with AI coding agents.`;
    const profileUrl = `https://${username}.builderbio.dev`;

    const ogImageUrl = "https://builderbio.dev/og-image.jpg?v=3";

    const seoMeta = `<title>${pageTitle}</title>
<meta name="description" content="${pageDesc}">
<link rel="canonical" href="${profileUrl}">
<link rel="icon" href="https://builderbio.dev/favicon.ico" sizes="32x32">
<link rel="icon" href="https://builderbio.dev/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="https://builderbio.dev/apple-icon.png">
<link rel="manifest" href="https://builderbio.dev/manifest.json">
<meta property="og:title" content="${pageTitle}">
<meta property="og:description" content="${pageDesc}">
<meta property="og:url" content="${profileUrl}">
<meta property="og:site_name" content="builderbio">
<meta property="og:type" content="profile">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="${ogImageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${pageTitle}">
<meta name="twitter:description" content="${pageDesc}">
<meta name="twitter:image" content="${ogImageUrl}">
<meta name="twitter:site" content="@gavin0922">
<script type="application/ld+json">
${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: displayName,
        url: profileUrl,
      },
      description: pageDesc,
    })}
</script>`;

    template = template.replace("<title>BuilderBio</title>", seoMeta);
    template = template.replace("__PROFILE_URL__", profileUrl);

    // Inject data
    template = template.replace(
      "__PROFILE_DATA_PLACEHOLDER__",
      JSON.stringify(bioData.D)
    );
    template = template.replace(
      "__EXTRA_DATA_PLACEHOLDER__",
      JSON.stringify(bioData.E)
    );
    template = template.replace("__UNFILTERED__", String(isUnfiltered));
    template = template.replace("__GEN_TIME__", genTime);

    return new NextResponse(template, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Bio profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
