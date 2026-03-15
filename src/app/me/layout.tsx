import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your builderbio developer profile.",
};

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="pt-12">{children}</div>;
}
