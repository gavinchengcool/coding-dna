"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AdminStats {
  kpi: {
    totalUsers: number;
    totalProfiles: number;
    publicProfiles: number;
    totalConnections: number;
  };
  charts: {
    signups: { date: string; count: number }[];
    syncs: { date: string; count: number }[];
  };
  recentUsers: {
    id: string;
    username: string;
    displayName: string | null;
    role: string;
    createdAt: string;
  }[];
}

export default function AdminPage() {
  const { token, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError(res.status === 403 ? "Access denied" : "Failed to load");
          return;
        }
        setStats(await res.json());
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const kpiItems = [
    { label: "Total Users", value: stats.kpi.totalUsers },
    { label: "Profiles", value: stats.kpi.totalProfiles },
    { label: "Public", value: stats.kpi.publicProfiles },
    { label: "Connections", value: stats.kpi.totalConnections },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-xl font-bold text-accent mb-8">
        <span className="text-text-muted">$</span> admin
      </h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpiItems.map((item) => (
          <div key={item.label} className="terminal-block text-center">
            <p className="text-2xl font-bold text-accent">{item.value}</p>
            <p className="text-xs text-text-muted mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="terminal-block">
          <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
            Signups (30d)
          </h2>
          <MiniBarChart data={stats.charts.signups} />
        </div>
        <div className="terminal-block">
          <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
            Syncs (30d)
          </h2>
          <MiniBarChart data={stats.charts.syncs} />
        </div>
      </div>

      {/* Recent Users */}
      <div className="terminal-block">
        <h2 className="text-xs text-text-muted mb-4 uppercase tracking-wider">
          Recent Users
        </h2>
        <div className="space-y-2">
          {stats.recentUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0"
            >
              <div>
                <span className="text-text-primary font-bold">
                  @{user.username}
                </span>
                {user.displayName && (
                  <span className="text-text-secondary ml-2">
                    {user.displayName}
                  </span>
                )}
                {user.role === "admin" && (
                  <span className="text-xs text-warning ml-2">[admin]</span>
                )}
              </div>
              <span className="text-xs text-text-muted">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-text-muted">No data</p>;
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barWidth = Math.max(4, Math.floor(300 / data.length) - 2);

  return (
    <svg viewBox={`0 0 ${data.length * (barWidth + 2)} 60`} width="100%" height={60}>
      {data.map((d, i) => {
        const height = (d.count / maxVal) * 50;
        return (
          <rect
            key={i}
            x={i * (barWidth + 2)}
            y={55 - height}
            width={barWidth}
            height={height}
            rx={1}
            fill="var(--accent)"
            opacity={0.7}
          >
            <title>
              {d.date}: {d.count}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
