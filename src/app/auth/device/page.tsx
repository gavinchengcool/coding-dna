"use client";

import { useState } from "react";

type Step = "input" | "signup" | "success";

export default function DeviceAuthPage() {
  const [step, setStep] = useState<Step>("input");
  const [userCode, setUserCode] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/device/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: userCode.toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      if (data.needs_signup) {
        setStep("signup");
      } else {
        setStep("success");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/device/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_code: userCode.toUpperCase(),
          username: username.toLowerCase(),
          email: email || undefined,
          display_name: displayName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-accent mb-2">
          <span className="text-text-muted">$</span> device auth
        </h1>
        <p className="text-sm text-text-secondary">
          Enter the code shown in your terminal
        </p>
      </div>

      {step === "input" && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div className="terminal-block">
            <label className="block text-xs text-text-secondary mb-2">
              user_code:
            </label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value.toUpperCase())}
              placeholder="ABC-DEF"
              maxLength={7}
              className="w-full bg-transparent text-2xl text-center text-accent font-bold tracking-[0.3em] outline-none placeholder:text-text-muted"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || userCode.length < 7}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-bg-primary hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "verifying..." : "verify code"}
          </button>
        </form>
      )}

      {step === "signup" && (
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="terminal-block space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                username <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.replace(/[^a-z0-9_-]/g, ""))
                }
                placeholder="dev_name"
                maxLength={40}
                className="w-full bg-bg-tertiary rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                display_name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                maxLength={100}
                className="w-full bg-bg-tertiary rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@example.com"
                className="w-full bg-bg-tertiary rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-bg-primary hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "creating account..." : "create account & authorize"}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="terminal-block text-center space-y-3">
          <div className="text-3xl text-accent">✓</div>
          <p className="text-sm text-text-primary">
            Device authorized successfully
          </p>
          <p className="text-xs text-text-secondary">
            You can close this tab and return to your terminal.
          </p>
        </div>
      )}
    </div>
  );
}
