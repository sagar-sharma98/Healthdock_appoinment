import React, { useState } from 'react';

export default function CustomAreaChart({
  data = [],
  height = 240,
  accentColor = '#0d9488', // HealthDock teal
  emptyText = 'No bookings recorded in this period',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Compute boundaries
  const counts = data.map((d) => d.count || 0);
  const maxCount = Math.max(...counts, 0);
  const hasData = counts.some((c) => c > 0);

  // Y-axis upper limit (at least 4 for scale if empty or small)
  const yMax = maxCount > 0 ? Math.ceil(maxCount * 1.25) : 4;

  const paddingLeft = 32;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartWidth = 700; // SVG coordinate width
  const chartHeight = height;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const x =
      data.length > 1
        ? paddingLeft + (index / (data.length - 1)) * plotWidth
        : paddingLeft + plotWidth / 2;
    const y = paddingTop + plotHeight - ((d.count || 0) / yMax) * plotHeight;
    return { x, y, ...d, originalIndex: index };
  });

  // Generate smooth cubic bezier SVG curve
  function getSvgCurvePath(pts) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }

  const linePath = getSvgCurvePath(points);
  const baselineY = paddingTop + plotHeight;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : '';

  // 4 Y-axis ticks
  const yTicks = [
    { value: yMax, y: paddingTop },
    { value: Math.round(yMax * 0.66), y: paddingTop + plotHeight * 0.33 },
    { value: Math.round(yMax * 0.33), y: paddingTop + plotHeight * 0.66 },
    { value: 0, y: baselineY },
  ];

  // Pick ~5 x labels to avoid overcrowding
  const xLabelInterval = Math.max(1, Math.floor(data.length / 5));

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="areaGradientTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
            <stop offset="80%" stopColor={accentColor} stopOpacity="0.04" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <text
              x={paddingLeft - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="text-[10px] fill-slate-400 font-mono select-none"
            >
              {tick.value}
            </text>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={chartWidth - paddingRight}
              y2={tick.y}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800/80 stroke-dasharray-[3_3]"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Gradient Area Fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#areaGradientTeal)"
            className="transition-all duration-300"
          />
        )}

        {/* Main Smooth Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}

        {/* Interactive Hover Guides & Data Points */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <g key={idx}>
              {/* Invisible touch/hover target */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="14"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Visible Point on line */}
              {(hasData || isHovered) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '5' : pt.count > 0 ? '3.5' : '0'}
                  fill="#ffffff"
                  stroke={accentColor}
                  strokeWidth={isHovered ? '3' : '2'}
                  className="transition-all duration-150 pointer-events-none drop-shadow-sm"
                />
              )}

              {/* Vertical line indicator on hover */}
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={baselineY}
                  stroke={accentColor}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />
              )}
            </g>
          );
        })}

        {/* X Axis Labels */}
        {points.map((pt, idx) => {
          if (idx % xLabelInterval === 0 || idx === points.length - 1) {
            return (
              <text
                key={idx}
                x={pt.x}
                y={baselineY + 18}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-sans select-none"
              >
                {pt.label}
              </text>
            );
          }
          return null;
        })}
      </svg>

      {/* Empty State Banner (Shown softly when all counts are 0) */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-400 shadow-xs backdrop-blur-xs">
            {emptyText}
          </div>
        </div>
      )}

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
            top: `${(points[hoveredIndex].y / chartHeight) * 100}%`,
          }}
        >
          <div className="bg-[#0B192C] text-white px-3 py-1.5 rounded-xl shadow-xl shadow-black/30 border border-slate-700/60 text-center whitespace-nowrap text-xs">
            <p className="text-[10px] text-slate-400 font-medium">{points[hoveredIndex].label}</p>
            <p className="font-bold text-teal-400 font-serif">
              {points[hoveredIndex].count} {points[hoveredIndex].count === 1 ? 'Booking' : 'Bookings'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
