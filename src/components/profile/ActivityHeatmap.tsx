"use client";

interface ActivityHeatmapProps {
  data: Record<string, Record<string, number>>; // date -> hour -> count
  weeks?: number;
}

export default function ActivityHeatmap({
  data,
  weeks = 20,
}: ActivityHeatmapProps) {
  const cellSize = 12;
  const cellGap = 2;
  const labelWidth = 28;
  const headerHeight = 16;

  // Generate dates for the last N weeks
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Collect day-level activity
  const dayData: { date: string; count: number; dayOfWeek: number; weekIndex: number }[] = [];
  const current = new Date(startDate);
  // Align to Sunday
  current.setDate(current.getDate() - current.getDay());

  let weekIdx = 0;
  while (current <= today) {
    const dateStr = current.toISOString().slice(0, 10);
    const hourData = data[dateStr] || {};
    const totalCount = Object.values(hourData).reduce((s, v) => s + v, 0);

    dayData.push({
      date: dateStr,
      count: totalCount,
      dayOfWeek: current.getDay(),
      weekIndex: weekIdx,
    });

    current.setDate(current.getDate() + 1);
    if (current.getDay() === 0) weekIdx++;
  }

  const maxCount = Math.max(...dayData.map((d) => d.count), 1);
  const totalWeeks = weekIdx + 1;

  const svgWidth = labelWidth + totalWeeks * (cellSize + cellGap);
  const svgHeight = headerHeight + 7 * (cellSize + cellGap);

  function getColor(count: number): string {
    if (count === 0) return "var(--bg-tertiary)";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return "#0e4429";
    if (intensity < 0.5) return "#006d32";
    if (intensity < 0.75) return "#26a641";
    return "#39d353";
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width={svgWidth}
        height={svgHeight}
      >
        {/* Day labels */}
        {dayLabels.map(
          (label, i) =>
            label && (
              <text
                key={i}
                x={labelWidth - 4}
                y={headerHeight + i * (cellSize + cellGap) + cellSize / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-muted)"
                fontSize={8}
                fontFamily="var(--font-mono)"
              >
                {label}
              </text>
            )
        )}

        {/* Cells */}
        {dayData.map((d, i) => (
          <rect
            key={i}
            x={labelWidth + d.weekIndex * (cellSize + cellGap)}
            y={headerHeight + d.dayOfWeek * (cellSize + cellGap)}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={getColor(d.count)}
            opacity={0.9}
          >
            <title>
              {d.date}: {d.count} interactions
            </title>
          </rect>
        ))}
      </svg>

      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-text-muted">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
          <span
            key={i}
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(level * maxCount) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
