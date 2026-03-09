import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your coding-dna developer profile.",
};

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
