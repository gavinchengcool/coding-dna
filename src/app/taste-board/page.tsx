"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";

interface SearchProfile {
  skills?: string[];
  languages?: string[];
  frameworks?: string[];
  domains?: string[];
}

interface ProfileCard {
  username: string;
  displayName: string | null;
  avatarColor: string | null;
  summary: string | null;
  portrait: Record<string, unknown> | null;
  frameworkSentences: string[] | null;
  searchProfile: SearchProfile | null;
  sessionsAnalyzed: number | null;
  totalTokens: number | null;
}

function getCardSummary(profile: ProfileCard): string | null {
  const summary = profile.summary?.trim();
  if (summary) return summary;

  const firstFrameworkSentence = profile.frameworkSentences?.[0]?.trim();
  if (firstFrameworkSentence) return firstFrameworkSentence;

  return null;
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

  // Collect tags from searchProfile
  function getTags(profile: ProfileCard): string[] {
    const sp = profile.searchProfile;
    if (!sp) return [];
    const all = [
      ...(sp.skills || []),
      ...(sp.frameworks || []),
      ...(sp.languages || []),
      ...(sp.domains || []),
    ];
    return all.slice(0, 5);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-bold text-accent mb-8">
        <span className="text-text-muted">$</span> {t("club.title")}
      </h1>

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
            const tags = getTags(profile);
            const cardSummary = getCardSummary(profile);
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
                      src={`/avatar-${profile.username}.jpg`}
                      alt={profile.displayName || profile.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback to colored initial
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div
                      className="w-10 h-10 rounded-full items-center justify-center text-sm font-bold text-bg-primary hidden"
                      style={{ backgroundColor: profile.avatarColor || "#00D084" }}
                    >
                      {(profile.username || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                        {profile.displayName || profile.username}
                      </p>
                      <p className="text-xs text-text-muted">
                        builder of things
                      </p>
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
                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {tags.map((tag) => (
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
