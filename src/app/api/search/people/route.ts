import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/search";
import { rateLimitByIp } from "@/lib/rate-limit";
import { z } from "zod/v4";

const searchSchema = z.object({
  query: z.string().max(200).default(""),
});

export async function POST(req: NextRequest) {
  const limited = rateLimitByIp(
    req.headers.get("x-forwarded-for"),
    "search/people",
    30,
    60_000
  );
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const results = await searchPeople(parsed.data.query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search people error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
