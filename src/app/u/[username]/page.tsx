"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CognitiveRadar from "@/components/profile/CognitiveRadar";
import CapabilityRings from "@/components/profile/CapabilityRings";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import FrameworkSentences from "@/components/profile/FrameworkSentences";

interface PublicProfile {
  username: string;
  displayName: string | null;
  avatarColor: string | null;
  summary: string | null;
  portrait: Record<string, unknown> | null;
  frameworkSentences: string[] | null;
  activityMap: Record<string, Record<string, number>> | null;
  behavioralFingerprint: Record<string, unknown> | null;
  searchProfile: Record<string, unknown> | null;
  sessionsAnalyzed: number | null;
  totalTokens: number | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/profile/${username}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setProfile(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-danger mb-2">404</h1>
        <p className="text-sm text-text-secondary">
          Profile not found or not public.
        </p>
      </div>
    );
  }

  const portrait = profile.portrait as Record<string, unknown> | null;
  const cognitiveStyle = portrait?.cognitive_style as Record<string, number> | null;
  const decisionStyle = portrait?.decision_style as string | null;

  const searchProfile = profile.searchProfile as Record<string, unknown> | null;
  const capabilities = extractCapabilities(searchProfile, portrait);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-bg-primary"
          style={{ backgroundColor: profile.avatarColor || "#00D084" }}
        >
          {(profile.username || "?")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-xs text-text-muted">@{profile.username}</p>
        </div>
      </div>

      {profile.summary && (
        <div className="terminal-block mb-6">
          <p className="text-sm text-text-primary leading-relaxed">
            {profile.summary}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-xs text-text-muted">
        <span>
          <span className="text-accent font-bold">
            {profile.sessionsAnalyzed || 0}
          </span>{" "}
          sessions
        </span>
        <span>
          <span className="text-accent font-bold">
            {((profile.totalTokens || 0) / 1000).toFixed(0)}k
          </span>{" "}
          tokens
        </span>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {cognitiveStyle && (
          <div className="terminal-block">
            <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
              Cognitive Style
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

        {capabilities.length > 0 && (
          <div className="terminal-block">
            <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
              Capabilities
            </h2>
            <CapabilityRings capabilities={capabilities} size={260} />
          </div>
        )}

        {profile.activityMap && (
          <div className="terminal-block md:col-span-2">
            <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
              Activity
            </h2>
            <ActivityHeatmap data={profile.activityMap} />
          </div>
        )}

        {profile.frameworkSentences && profile.frameworkSentences.length > 0 && (
          <div className="terminal-block md:col-span-2">
            <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
              Framework Sentences
            </h2>
            <FrameworkSentences sentences={profile.frameworkSentences} />
          </div>
        )}

        {profile.behavioralFingerprint && (
          <div className="terminal-block md:col-span-2">
            <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
              Behavioral Fingerprint
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
    </div>
  );
}

function extractCapabilities(
  searchProfile: Record<string, unknown> | null,
  portrait: Record<string, unknown> | null
): { name: string; level: number }[] {
  if (portrait?.capability_rings) {
    const rings = portrait.capability_rings as Record<string, number>;
    return Object.entries(rings).map(([name, level]) => ({ name, level }));
  }
  if (searchProfile?.skills) {
    const skills = searchProfile.skills as string[];
    return skills.slice(0, 8).map((skill, i) => ({
      name: skill,
      level: Math.max(30, 90 - i * 10),
    }));
  }
  return [];
}
