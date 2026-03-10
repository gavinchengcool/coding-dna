import { NextRequest, NextResponse } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "builderbio.dev";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const hostname = host.split(":")[0]; // strip port

  // Skip if it's the bare domain, www, or localhost
  if (
    hostname === BASE_DOMAIN ||
    hostname === `www.${BASE_DOMAIN}` ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return NextResponse.next();
  }

  // Check if hostname is a subdomain of BASE_DOMAIN
  if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, "");

    // Skip multi-level subdomains
    if (subdomain.includes(".")) {
      return NextResponse.next();
    }

    // Static HTML profiles: rewrite to the static file on the main domain
    const staticProfiles = ["gavin"];
    if (req.nextUrl.pathname === "/" && staticProfiles.includes(subdomain)) {
      return NextResponse.rewrite(
        new URL(`https://${BASE_DOMAIN}/${subdomain}.html`)
      );
    }

    // Rewrite subdomain to /u/[username]
    const url = req.nextUrl.clone();
    url.pathname = `/u/${subdomain}${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|skills/|install\\.sh|api/).*)",
  ],
};
