"use client";

import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import CognitiveRadar from "@/components/profile/CognitiveRadar";
import CapabilityRings from "@/components/profile/CapabilityRings";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import FrameworkSentences from "@/components/profile/FrameworkSentences";
import { useState } from "react";

export default function DashboardPage() {
  const { profile, loading, isAuthenticated, token, logout } = useAuth();
  const { t } = useI18n();
  const [publishing, setPublishing] = useState(false);

  async function togglePublish() {
    if (!token || !profile) return;
    setPublishing(true);

    const isPublic = profile.isPublic === 1;
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_public: !isPublic,
          status: !isPublic ? "published" : "draft",
        }),
      });
      window.location.reload();
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-secondary">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-accent mb-4">
          <span className="text-text-muted">$</span> {t("dashboard.title")}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          Sign in via your terminal to view your profile.
        </p>
        <div className="terminal-block inline-block text-left">
          <p className="text-xs text-text-muted mb-1"># Run in Claude Code:</p>
          <p className="text-sm">
            <span className="text-accent">$</span> /coding-dna-summarize
          </p>
        </div>
      </div>
    );
  }

  const portrait = profile?.portrait as Record<string, unknown> | null;
  const cognitiveStyle = portrait?.cognitive_style as Record<string, number> | null;
  const decisionStyle = portrait?.decision_style as string | null;

  // Extract capabilities from search_profile
  const searchProfile = profile?.searchProfile as Record<string, unknown> | null;
  const capabilities = extractCapabilities(searchProfile, portrait);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-bg-primary"
            style={{ backgroundColor: profile?.avatarColor || "#00D084" }}
          >
            {(profile?.username || "?")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              {profile?.displayName || profile?.username}
            </h1>
            <p className="text-xs text-text-muted">@{profile?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePublish}
            disabled={publishing}
            className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
              profile?.isPublic === 1
                ? "bg-bg-tertiary text-text-secondary hover:bg-danger/20 hover:text-danger"
                : "bg-accent text-bg-primary hover:bg-accent-hover"
            }`}
          >
            {profile?.isPublic === 1 ? t("dashboard.unpublish") : t("dashboard.publish")}
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 rounded text-xs text-text-muted hover:text-danger transition-colors"
          >
            logout
          </button>
        </div>
      </div>

      {!profile?.summary ? (
        <div className="terminal-block text-center py-10">
          <p className="text-sm text-text-secondary">
            {t("dashboard.noProfile")}
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="terminal-block mb-6">
            <p className="text-sm text-text-primary leading-relaxed">
              {profile.summary}
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 mb-6 text-xs text-text-muted">
            <span>
              <span className="text-accent font-bold">
                {profile.sessionsAnalyzed || 0}
              </span>{" "}
              {t("common.sessions")}
            </span>
            <span>
              <span className="text-accent font-bold">
                {((profile.totalTokens || 0) / 1000).toFixed(0)}k
              </span>{" "}
              {t("common.tokens")}
            </span>
            {profile.isPublic === 1 && (
              <a
                href={`/u/${profile.username}`}
                className="text-info hover:underline ml-auto"
              >
                /u/{profile.username}
              </a>
            )}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cognitive Style */}
            {cognitiveStyle && (
              <div className="terminal-block">
                <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
                  {t("dashboard.cognitiveStyle")}
                </h2>
                <CognitiveRadar
                  data={{
                    explorer_vs_optimizer: cognitiveStyle.explorer_vs_optimizer || 0.5,
                    big_picture_vs_detail: cognitiveStyle.big_picture_vs_detail || 0.5,
                    intuitive_vs_analytical: cognitiveStyle.intuitive_vs_analytical || 0.5,
                    solo_vs_collaborative: cognitiveStyle.solo_vs_collaborative || 0.5,
                    move_fast_vs_careful: cognitiveStyle.move_fast_vs_careful || 0.5,
                    generalist_vs_specialist: cognitiveStyle.generalist_vs_specialist || 0.5,
                  }}
                  size={280}
                />
                {decisionStyle && (
                  <p className="text-xs text-text-secondary mt-4 italic">
                    {decisionStyle}
                  </p>
                )}
              </div>
            )}

            {/* Capabilities */}
            {capabilities.length > 0 && (
              <div className="terminal-block">
                <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
                  {t("dashboard.capabilities")}
                </h2>
                <CapabilityRings capabilities={capabilities} size={260} />
              </div>
            )}

            {/* Activity Heatmap */}
            {profile.activityMap && (
              <div className="terminal-block md:col-span-2">
                <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
                  {t("dashboard.activity")}
                </h2>
                <ActivityHeatmap data={profile.activityMap} />
              </div>
            )}

            {/* Framework Sentences */}
            {profile.frameworkSentences && profile.frameworkSentences.length > 0 && (
              <div className="terminal-block md:col-span-2">
                <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
                  {t("dashboard.frameworkSentences")}
                </h2>
                <FrameworkSentences sentences={profile.frameworkSentences} />
              </div>
            )}

            {/* Behavioral Fingerprint */}
            {profile.behavioralFingerprint && (
              <div className="terminal-block md:col-span-2">
                <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
                  {t("dashboard.fingerprint")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(profile.behavioralFingerprint).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-lg font-bold text-accent">
                        {typeof value === "number"
                          ? value > 1
                            ? value.toLocaleString()
                            : (value * 100).toFixed(0) + "%"
                          : String(value)}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {key.replace(/_/g, " ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function extractCapabilities(
  searchProfile: Record<string, unknown> | null,
  portrait: Record<string, unknown> | null
): { name: string; level: number }[] {
  // Try to extract from portrait.capability_rings first
  if (portrait?.capability_rings) {
    const rings = portrait.capability_rings as Record<string, number>;
    return Object.entries(rings).map(([name, level]) => ({ name, level }));
  }

  // Fall back to search_profile skills
  if (searchProfile?.skills) {
    const skills = searchProfile.skills as string[];
    return skills.slice(0, 8).map((skill, i) => ({
      name: skill,
      level: Math.max(30, 90 - i * 10),
    }));
  }

  return [];
}
