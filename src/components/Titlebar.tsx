"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function Titlebar({
  forceBuiltByActive = false,
  forceTasteBoardActive = false,
  forceHomeInactive = false,
}: {
  forceBuiltByActive?: boolean;
  forceTasteBoardActive?: boolean;
  forceHomeInactive?: boolean;
}) {
  const pathname = usePathname();
  const isTasteBoard = forceTasteBoardActive || pathname.startsWith("/taste-board");
  const isHome = !forceHomeInactive && pathname === "/";
  const isBuiltBy = forceBuiltByActive;

  return (
    <TopNav
      fixed
      activeHome={isHome}
      activeTasteBoard={isTasteBoard}
      activeBuiltBy={isBuiltBy}
    />
  );
}
