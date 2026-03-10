import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Only allow alphanumeric + hyphens
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(username) && !/^[a-z0-9]{3}$/.test(username)) {
    return NextResponse.json({ error: "invalid username" }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        username: users.username,
        displayName: users.displayName,
        builderBioData: profiles.builderBioData,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.username, username), eq(profiles.isPublic, 1)))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const result = results[0];
    const bioData = result.builderBioData as { D: Record<string, unknown>; E: Record<string, unknown> } | null;

    if (!bioData || !bioData.D || !bioData.E) {
      // Fall back to simple profile page if no BuilderBio data
      return NextResponse.json(
        { error: "BuilderBio data not available" },
        { status: 404 }
      );
    }

    // Read the template
    const templatePath = join(process.cwd(), "public", "skills", "builderbio", "assets", "template.html");
    let template = await readFile(templatePath, "utf-8");

    // Apply YC orange theme overrides
    template = template.replace(
      /--ac:#818cf8;--acd:#6366f1;--acb:rgba\(99,102,241,\.08\)/,
      "--ac:#FF6B35;--acd:#E55A2B;--acb:rgba(255,107,53,.08)"
    );
    // Fix hero glow
    template = template.replace(
      /rgba\(99,102,241,\.06\)0%/g,
      "rgba(255,107,53,.06)0%"
    );
    // Fix badge border
    template = template.replace(
      /rgba\(99,102,241,\.15\)/g,
      "rgba(255,107,53,.15)"
    );
    // Fix avatar shadow
    template = template.replace(
      /rgba\(99,102,241,\.15\)/g,
      "rgba(255,107,53,.15)"
    );
    // Fix CTA gradient
    template = template.replace(
      /rgba\(99,102,241,\.06\),rgba\(52,211,153,\.04\)/,
      "rgba(255,107,53,.06),rgba(52,211,153,.04)"
    );

    // Replace footer to match site-wide footer
    template = template.replace(
      '<div class="footer" id="footer-text"></div>',
      `<div class="footer" style="padding:24px 0;text-align:center;font-size:12px;color:var(--tm)">
  <p style="margin:0 0 8px">The bio link for builders who ship with AI</p>
  <div style="display:flex;align-items:center;justify-content:center;gap:16px">
    <a href="https://x.com/builderbio_dev" target="_blank" rel="noopener noreferrer" style="color:var(--tm);transition:color .2s" title="X (Twitter)">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    </a>
    <a href="https://www.linkedin.com/company/builderbio" target="_blank" rel="noopener noreferrer" style="color:var(--tm);transition:color .2s" title="LinkedIn">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    </a>
  </div>
</div>`
    );

    // Update the footer JS to not overwrite the static footer
    template = template.replace(
      `document.getElementById('footer-text').innerHTML=t('footer')+' · '+new Date().toLocaleString('en-US');`,
      `// footer rendered in HTML`
    );

    // Inject SEO meta tags
    const profileD = bioData.D as Record<string, Record<string, unknown>>;
    const displayName = (profileD.profile?.display_name as string) || username;
    const totalSessions = profileD.profile?.total_sessions || 0;
    const totalTurns = profileD.profile?.total_turns || 0;
    const activeDays = profileD.profile?.active_days || 0;
    const agents = profileD.profile?.agents_used
      ? Object.keys(profileD.profile.agents_used as Record<string, unknown>).join(" and ")
      : "AI coding agents";
    const pageTitle = `${displayName}'s BuilderBio — What I Built with AI`;
    const pageDesc = `${totalSessions} sessions, ${totalTurns.toLocaleString()} turns, ${activeDays} active days of building with ${agents}. See what ${displayName} shipped with AI coding agents.`;
    const profileUrl = `https://${username}.builderbio.dev`;

    const seoMeta = `<title>${pageTitle}</title>
<meta name="description" content="${pageDesc}">
<link rel="canonical" href="${profileUrl}">
<meta property="og:title" content="${pageTitle}">
<meta property="og:description" content="${pageDesc}">
<meta property="og:url" content="${profileUrl}">
<meta property="og:site_name" content="builderbio">
<meta property="og:type" content="profile">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${pageTitle}">
<meta name="twitter:description" content="${pageDesc}">
<meta name="twitter:site" content="@gavin0922">
<script type="application/ld+json">
${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: { "@type": "Person", name: displayName, url: profileUrl },
      description: pageDesc,
    })}
</script>`;

    // Replace the generic <title> with full SEO head
    template = template.replace("<title>BuilderBio</title>", seoMeta);

    // Inject data
    template = template.replace(
      "__PROFILE_DATA_PLACEHOLDER__",
      JSON.stringify(bioData.D)
    );
    template = template.replace(
      "__EXTRA_DATA_PLACEHOLDER__",
      JSON.stringify(bioData.E)
    );

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
