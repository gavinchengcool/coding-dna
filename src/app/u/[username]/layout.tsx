import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://builderbio.dev";

  let summary = `Builder profile for @${username} on builderbio`;
  let displayName = username;

  try {
    const res = await fetch(`${baseUrl}/api/profile/${username}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.summary) summary = data.summary;
      if (data.displayName) displayName = data.displayName;
    }
  } catch {
    // Use defaults
  }

  const title = `${displayName}'s BuilderBio`;
  const profileUrl = `https://${username}.builderbio.dev`;

  return {
    title,
    description: summary,
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title: `${title} — builderbio`,
      description: summary,
      type: "profile",
      url: profileUrl,
      siteName: "builderbio",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — builderbio`,
      description: summary,
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
