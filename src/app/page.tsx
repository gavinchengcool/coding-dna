"use client";

import HeroSection from "@/components/landing/HeroSection";
import { useI18n } from "@/hooks/useI18n";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <HeroSection t={t} />
  );
}
