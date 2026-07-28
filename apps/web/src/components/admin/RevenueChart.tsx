"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "../../lib/formatCurrency";

interface RevenuePoint {
  day: string;
  revenue: number;
  orders: number;
}

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 24, left: 12 };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plot = useMemo(() => {
    if (data.length === 0) return null;

    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

    const points = data.map((d, i) => {
      const x = PADDING.left + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth);
      const y = PADDING.top + innerHeight - (d.revenue / maxRevenue) * innerHeight;
      return { x, y, ...d };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${PADDING.top + innerHeight} L ${points[0].x.toFixed(1)} ${PADDING.top + innerHeight} Z`;

    const gridLines = Array.from({ length: 4 }, (_, i) => {
      const y = PADDING.top + (innerHeight / 3) * i;
      const value = maxRevenue * (1 - i / 3);
      return { y, value };
    });

    return { points, linePath, areaPath, gridLines };
  }, [data]);

  if (!plot) {
    return <p className="py-16 text-center text-sm text-slate-500">No revenue in this window yet.</p>;
  }

  const hovered = hoverIndex !== null ? plot.points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Revenue over the last 14 days"
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH;
          let nearest = 0;
          let nearestDist = Infinity;
          plot.points.forEach((p, i) => {
            const dist = Math.abs(p.x - relativeX);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearest = i;
            }
          });
          setHoverIndex(nearest);
        }}
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4763f5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4763f5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {plot.gridLines.map((line) => (
          <g key={line.y}>
            <line x1={PADDING.left} y1={line.y} x2={WIDTH - PADDING.right} y2={line.y} stroke="#e1e0d9" strokeWidth={1} />
            <text x={PADDING.left} y={line.y - 4} fontSize={10} fill="#898781">
              {formatCurrency(line.value).replace(".00", "")}
            </text>
          </g>
        ))}

        <path d={plot.areaPath} fill="url(#revenue-fill)" />
        <path d={plot.linePath} fill="none" stroke="#4763f5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <line x1={hovered.x} y1={PADDING.top} x2={hovered.x} y2={HEIGHT - PADDING.bottom} stroke="#c3c2b7" strokeWidth={1} />
        )}
        {plot.points.map((p, i) => (
          <circle
            key={p.day}
            cx={p.x}
            cy={p.y}
            r={i === hoverIndex ? 4 : 2.5}
            fill="#4763f5"
            stroke="#fff"
            strokeWidth={i === hoverIndex ? 1.5 : 0}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="font-semibold text-slate-900">{new Date(hovered.day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
          <p className="text-slate-600">{formatCurrency(hovered.revenue)}</p>
          <p className="text-slate-400">{hovered.orders} order{hovered.orders === 1 ? "" : "s"}</p>
        </div>
      )}
    </div>
  );
}
