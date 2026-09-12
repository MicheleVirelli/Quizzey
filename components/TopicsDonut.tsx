export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** A small donut chart of games played per topic, with a legend. */
export function TopicsDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No games yet — play a few rounds to see your topics here.
      </p>
    );
  }

  const r = 60;
  const cx = 80;
  const cy = 80;
  const stroke = 26;
  const C = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const len = (seg.value / total) * C;
    const arc = {
      color: seg.color,
      dash: `${len} ${C - len}`,
      dashoffset: -offset,
    };
    offset += len;
    return arc;
  });

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
        <g transform="rotate(-90 80 80)">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="stroke-neutral-200 dark:stroke-neutral-800"
            strokeWidth={stroke}
          />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={a.dash}
              strokeDashoffset={a.dashoffset}
            />
          ))}
        </g>
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-neutral-900 text-2xl font-extrabold dark:fill-neutral-50"
        >
          {total}
        </text>
        <text
          x="80"
          y="94"
          textAnchor="middle"
          className="fill-neutral-400 text-[10px] uppercase tracking-wide"
        >
          games
        </text>
      </svg>

      <ul className="flex flex-1 flex-col gap-1.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="flex-1 truncate">{seg.label}</span>
            <span className="font-semibold text-neutral-500">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
