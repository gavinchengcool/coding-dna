import type { Metadata } from "next";
import Titlebar from "@/components/Titlebar";

export const metadata: Metadata = {
  title: "Developer Club",
  description: "Discover developers in the builderbio community. Search by skills, technologies, and expertise.",
};

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Titlebar />
      {children}
    </>
  );
}
