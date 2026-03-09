"use client";

import { useState, useEffect, useCallback } from "react";

interface UserProfile {
  username: string;
  displayName: string | null;
  avatarColor: string | null;
  email: string | null;
  summary: string | null;
  portrait: Record<string, unknown> | null;
  frameworkSentences: string[] | null;
  activityMap: Record<string, Record<string, number>> | null;
  behavioralFingerprint: Record<string, unknown> | null;
  searchProfile: Record<string, unknown> | null;
  sessionsAnalyzed: number | null;
  totalTokens: number | null;
  isPublic: number | null;
  status: string | null;
  updatedAt: string | null;
}

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("coding-dna-token")
      : null;

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("coding-dna-token");
        }
        setError("Failed to load profile");
        return;
      }

      const data = await res.json();
      setProfile(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    if (!token) return;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      localStorage.removeItem("coding-dna-token");
      setProfile(null);
    }
  }, [token]);

  return {
    profile,
    loading,
    error,
    isAuthenticated: !!token && !!profile,
    token,
    logout,
    refetch: fetchProfile,
  };
}
