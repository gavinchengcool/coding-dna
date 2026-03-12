"use client";

import { useState, useEffect, type CSSProperties } from "react";
import InstallCommandBox from "@/components/InstallCommandBox";
import { useI18n } from "@/hooks/useI18n";

interface ProfileCard {
  username: string;
  displayName: string | null;
  avatarColor: string | null;
  avatarUrl: string | null;
  summary: string | null;
  portrait: Record<string, unknown> | null;
  frameworkSentences: string[] | null;
  sessionsAnalyzed: number | null;
  totalTokens: number | null;
  tags: string[];
  subtitle: string | null;
}

const DEFAULT_AVATAR_COLOR = "#00D084";
const BRAND_FALLBACK_AVATAR = {
  backgroundColor: "rgba(255, 107, 53, 0.14)",
  border: "1px solid rgba(255, 107, 53, 0.35)",
  color: "#FF6B35",
};

function getCardSummary(profile: ProfileCard): string | null {
  const summary = profile.summary?.trim();
  if (summary) return summary;

  const firstFrameworkSentence = profile.frameworkSentences?.[0]?.trim();
  if (firstFrameworkSentence) return firstFrameworkSentence;

  return null;
}

function getFallbackAvatarStyle(avatarColor: string | null): CSSProperties {
  if (!avatarColor || avatarColor.toUpperCase() === DEFAULT_AVATAR_COLOR) {
    return BRAND_FALLBACK_AVATAR;
  }

  return {
    backgroundColor: avatarColor,
    color: "#111111",
  };
}

export default function TasteBoardPage() {
  const { t } = useI18n();
  const [results, setResults] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/search/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "" }),
        });
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-bold text-accent mb-8">
        <span className="text-text-muted">$</span> {t("club.title")}
      </h1>

      <div className="terminal-block border-accent/30 mb-8 sm:mb-10">
        <div className="space-y-4">
          <div className="max-w-2xl">
            <p className="text-sm sm:text-base font-bold text-text-primary">
              Like what you see?
            </p>
          </div>

          <InstallCommandBox eyebrow={t("hero.install")} align="left" />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-text-secondary text-center py-10">
          {t("common.loading")}
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-10">
          {t("club.noResults")}
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((profile) => {
            const cardSummary = getCardSummary(profile);
            const subtitle = profile.subtitle?.trim();
            return (
              <a
                key={profile.username}
                href={`https://${profile.username}.builderbio.dev`}
                className="terminal-block border-accent/30 hover:border-accent/60 transition-colors group"
              >
                {/* Window chrome */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                  <span className="text-xs text-text-muted ml-2">
                    {profile.username}.builderbio.dev
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.avatarUrl || `/avatar-${profile.username}.jpg`}
                      alt={profile.displayName || profile.username}
                      className="w-10 h-10 rounded-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (
                          profile.avatarUrl &&
                          target.src !== `${window.location.origin}/avatar-${profile.username}.jpg`
                        ) {
                          target.src = `/avatar-${profile.username}.jpg`;
                          return;
                        }

                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="hidden h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                      style={getFallbackAvatarStyle(profile.avatarColor)}
                    >
                      {(profile.username || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                        {profile.displayName || profile.username}
                      </p>
                      {subtitle && (
                        <p className="text-xs text-text-muted line-clamp-1">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  {cardSummary && (
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 min-h-[3.75rem]">
                      {cardSummary}
                    </p>
                  )}

                  {/* Stats */}
                  {profile.sessionsAnalyzed && profile.sessionsAnalyzed > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-accent">
                          {profile.sessionsAnalyzed}
                        </p>
                        <p className="text-[10px] text-text-muted">sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-accent">
                          {profile.totalTokens
                            ? profile.totalTokens >= 1e9
                              ? `${(profile.totalTokens / 1e9).toFixed(2)}B`
                              : profile.totalTokens >= 1e6
                                ? `${(profile.totalTokens / 1e6).toFixed(1)}M`
                                : profile.totalTokens >= 1e3
                                  ? `${(profile.totalTokens / 1e3).toFixed(1)}K`
                                  : profile.totalTokens
                            : "—"}
                        </p>
                        <p className="text-[10px] text-text-muted">tokens</p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {profile.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {profile.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-border text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
