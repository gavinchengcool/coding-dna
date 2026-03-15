"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function RootSiteNav({
  initialHost = "",
}: {
  initialHost?: string;
}) {
  const pathname = usePathname();
  const host =
    initialHost || (typeof window === "undefined" ? "" : window.location.host.split(":")[0] || "");

  const isRootHost =
    host === "builderbio.dev" ||
    host === "www.builderbio.dev" ||
    host === "localhost" ||
    host === "127.0.0.1";

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
