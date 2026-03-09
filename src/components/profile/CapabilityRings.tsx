"use client";

interface Capability {
  name: string;
  level: number; // 0-100
  color?: string;
}

interface CapabilityRingsProps {
  capabilities: Capability[];
  size?: number;
}

const RING_COLORS = [
  "#00D084",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FF6B6B",
  "#98D8C8",
];

export default function CapabilityRings({
  capabilities,
  size = 280,
}: CapabilityRingsProps) {
  const cx = size / 2;
  const cy = size / 2;
  const ringWidth = 8;
  const ringGap = 4;
  const maxRings = Math.min(capabilities.length, 8);
  const innerR = size * 0.15;

  function describeArc(r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M${start.x},${start.y} A${r},${r} 0 ${largeArc} 1 ${end.x},${end.y}`;
  }

  function polarToCartesian(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {capabilities.slice(0, maxRings).map((cap, i) => {
          const r = innerR + i * (ringWidth + ringGap);
          const angle = (cap.level / 100) * 360;
          const color = cap.color || RING_COLORS[i % RING_COLORS.length];

          return (
            <g key={i}>
              {/* Background ring */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="var(--border)"
                strokeWidth={ringWidth}
                opacity={0.2}
              />

              {/* Progress arc */}
              {angle > 0 && (
                <path
                  d={describeArc(r, 0, Math.min(angle, 359.9))}
                  fill="none"
                  stroke={color}
                  strokeWidth={ringWidth}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              )}
            </g>
          );
        })}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize={14}
          fontFamily="var(--font-mono)"
          fontWeight="bold"
        >
          {capabilities.length}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize={8}
          fontFamily="var(--font-mono)"
        >
          skills
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {capabilities.slice(0, maxRings).map((cap, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  cap.color || RING_COLORS[i % RING_COLORS.length],
              }}
            />
            <span className="text-text-secondary">{cap.name}</span>
            <span className="text-text-muted ml-auto">{cap.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
