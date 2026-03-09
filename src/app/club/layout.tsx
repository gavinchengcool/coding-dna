import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Club",
  description: "Discover developers in the coding-dna community. Search by skills, technologies, and expertise.",
};

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
