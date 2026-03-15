import type { Metadata } from "next";
import Titlebar from "@/components/Titlebar";

export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your builderbio developer profile.",
};

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Titlebar useInternalRootLinks />
      <div className="pt-12">{children}</div>
    </>
  );
}
