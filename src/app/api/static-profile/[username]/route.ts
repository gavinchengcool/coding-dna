import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { replaceStandaloneFooterHtml } from "@/lib/site-footer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Only allow alphanumeric + hyphens
  if (!/^[a-z0-9-]+$/.test(username)) {
    return NextResponse.json({ error: "invalid username" }, { status: 400 });
  }

  const filePath = join(process.cwd(), "public", `${username}.html`);

  try {
    const html = await readFile(filePath, "utf-8");
    return new NextResponse(replaceStandaloneFooterHtml(html), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
