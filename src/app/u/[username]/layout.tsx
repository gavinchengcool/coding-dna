import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `@${username}`,
    description: `Developer profile for @${username} on coding-dna`,
    openGraph: {
      title: `@${username} — coding-dna`,
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
