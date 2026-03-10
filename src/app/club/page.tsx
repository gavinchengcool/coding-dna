"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";

interface ProfileCard {
  username: string;
  displayName: string | null;
  avatarColor: string | null;
  summary: string | null;
  portrait: Record<string, unknown> | null;
  frameworkSentences: string[] | null;
}

export default function ClubPage() {
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
          {results.map((profile) => (
            <a
              key={profile.username}
              href={`/u/${profile.username}`}
              className="terminal-block hover:border-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-bg-primary"
                  style={{
                    backgroundColor: profile.avatarColor || "#00D084",
                  }}
                >
                  {(profile.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                    {profile.displayName || profile.username}
                  </p>
                  <p className="text-xs text-text-muted">
                    @{profile.username}
                  </p>
                </div>
              </div>

              {profile.summary && (
                <p className="text-xs text-text-secondary line-clamp-2 mb-2">
                  {profile.summary}
                </p>
              )}

              {profile.frameworkSentences &&
                profile.frameworkSentences.length > 0 && (
                  <p className="text-xs text-text-muted italic line-clamp-1">
                    &quot;{(profile.frameworkSentences as string[])[0]}&quot;
                  </p>
                )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
