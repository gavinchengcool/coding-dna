"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function RootSiteNav() {
  const pathname = usePathname();
  const host =
    typeof window === "undefined" ? "" : window.location.host.split(":")[0] || "";

  const isRootHost =
    !host || host === "builderbio.dev" || host === "www.builderbio.dev" || host === "localhost";

  const shouldRender =
    isRootHost && (pathname === "/" || pathname.startsWith("/taste-board") || pathname.startsWith("/me"));

  if (!shouldRender) return null;

  return (
    <TopNav
      fixed
      activeHome={pathname === "/"}
      activeTasteBoard={pathname.startsWith("/taste-board")}
      useInternalRootLinks
    />
  );
}
