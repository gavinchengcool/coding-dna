import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username}`,
    description: `Developer profile for @${username} on builderbio`,
    openGraph: {
      title: `@${username} — builderbio`,
      description: `Developer profile for @${username}`,
      type: "profile",
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
