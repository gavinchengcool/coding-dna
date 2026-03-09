import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000
): NextResponse | null {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      }
    );
  }

  return null;
}

export function rateLimitByIp(
  ip: string | null,
  route: string,
  limit: number = 60,
  windowMs: number = 60_000
): NextResponse | null {
  const key = `${ip || "unknown"}:${route}`;
  return rateLimit(key, limit, windowMs);
}
