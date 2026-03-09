"use client";

interface CognitiveStyle {
  explorer_vs_optimizer: number;
  big_picture_vs_detail: number;
  intuitive_vs_analytical: number;
  solo_vs_collaborative: number;
  move_fast_vs_careful: number;
  generalist_vs_specialist: number;
}

interface CognitiveRadarProps {
  data: CognitiveStyle;
  size?: number;
}

const LABELS = [
  { key: "explorer_vs_optimizer", label: "Explorer", opposite: "Optimizer" },
  { key: "big_picture_vs_detail", label: "Big Picture", opposite: "Detail" },
  { key: "intuitive_vs_analytical", label: "Intuitive", opposite: "Analytical" },
  { key: "solo_vs_collaborative", label: "Collaborative", opposite: "Solo" },
  { key: "move_fast_vs_careful", label: "Move Fast", opposite: "Careful" },
  { key: "generalist_vs_specialist", label: "Generalist", opposite: "Specialist" },
];

export default function CognitiveRadar({ data, size = 300 }: CognitiveRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35;
  const levels = 5;

  function polarToCartesian(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const angleStep = 360 / 6;

  // Grid lines
  const gridPaths = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1);
    const points = Array.from({ length: 6 }, (_, j) => {
      const p = polarToCartesian(j * angleStep, r);
      return `${p.x},${p.y}`;
    });
    return `M${points.join("L")}Z`;
  });

  // Data polygon
  const values = LABELS.map((l) => (data as unknown as Record<string, number>)[l.key] || 0.5);
  const dataPoints = values.map((v, i) => {
    const r = v * maxR;
    return polarToCartesian(i * angleStep, r);
  });
  const dataPath = `M${dataPoints.map((p) => `${p.x},${p.y}`).join("L")}Z`;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {/* Grid */}
        {gridPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--border)"
            strokeWidth={i === levels - 1 ? 1.5 : 0.5}
            opacity={0.5}
          />
        ))}

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const p = polarToCartesian(i * angleStep, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.3}
            />
          );
        })}

        {/* Data area */}
        <path
          d={dataPath}
          fill="var(--accent)"
          fillOpacity={0.15}
          stroke="var(--accent)"
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="var(--accent)"
          />
        ))}

        {/* Labels */}
        {LABELS.map((l, i) => {
          const p = polarToCartesian(i * angleStep, maxR + 24);
          const value = values[i];
          return (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-secondary)"
              fontSize={9}
              fontFamily="var(--font-mono)"
            >
              {value >= 0.5 ? l.label : l.opposite}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
