import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "Builder";
  const sessions = searchParams.get("sessions") || "0";
  const turns = searchParams.get("turns") || "0";
  const days = searchParams.get("days") || "0";
  const agents = searchParams.get("agents") || "AI Agents";
  const summary = searchParams.get("summary") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #111111 0%, #1A1A1A 50%, #111111 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Top bar with logo */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "60px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#555",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        >
          <span style={{ color: "#555" }}>~/</span>
          <span style={{ color: "#999" }}>builderbio</span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          {/* Name */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#EBEBEB",
              letterSpacing: "-2px",
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>

          {/* Summary */}
          {summary && (
            <div
              style={{
                fontSize: "22px",
                color: "#999",
                maxWidth: "800px",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              {summary}
            </div>
          )}

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "60px",
              marginTop: "32px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: 800, color: "#FF6B35", lineHeight: 1 }}>
                {sessions}
              </div>
              <div style={{ fontSize: "13px", color: "#555", textTransform: "uppercase" as const, letterSpacing: "2px", fontWeight: 600, marginTop: "8px" }}>
                Sessions
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: 800, color: "#34d399", lineHeight: 1 }}>
                {turns}
              </div>
              <div style={{ fontSize: "13px", color: "#555", textTransform: "uppercase" as const, letterSpacing: "2px", fontWeight: 600, marginTop: "8px" }}>
                Turns
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: 800, color: "#fbbf24", lineHeight: 1 }}>
                {days}
              </div>
              <div style={{ fontSize: "13px", color: "#555", textTransform: "uppercase" as const, letterSpacing: "2px", fontWeight: 600, marginTop: "8px" }}>
                Active Days
              </div>
            </div>
          </div>

          {/* Agent badges */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            {agents.split(",").map((agent, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  borderRadius: "100px",
                  background: "#1A1A1A",
                  border: "1px solid #333",
                  fontSize: "15px",
                  color: "#999",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: i === 0 ? "#818cf8" : i === 1 ? "#34d399" : "#fbbf24",
                  }}
                />
                {agent.trim()}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, transparent, #FF6B35, transparent)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
