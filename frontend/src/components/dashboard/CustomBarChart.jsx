import React, { useState } from 'react';

export default function CustomBarChart({
  data = [],
  height = 180,
  accentColor = '#0d9488',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const counts = data.map((d) => d.count || 0);
  const maxCount = Math.max(...counts, 0);
  const hasData = counts.some((c) => c > 0);
  const yMax = maxCount > 0 ? maxCount : 5;

  const chartWidth = 500;
  const chartHeight = height;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 25;
  const paddingBottom = 28;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const barWidth = Math.max(8, Math.min(22, (plotWidth / data.length) * 0.55));

  const items = data.map((d, index) => {
    const slotWidth = plotWidth / data.length;
    const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
    const barHeight = hasData && d.count > 0 ? (d.count / yMax) * plotHeight : 3; // minimal pill height if 0
    const y = paddingTop + plotHeight - barHeight;
    const isPeak = hasData && d.count === maxCount && maxCount > 0;
    return {
      ...d,
      x,
      y,
      barHeight,
      isPeak,
      originalIndex: index,
    };
  });

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={`${accentColor}cc`} />
          </linearGradient>
          <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        {/* Baseline line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + plotHeight}
          x2={chartWidth - paddingRight}
          y2={paddingTop + plotHeight}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="1"
        />

        {/* Bars */}
        {items.map((bar, idx) => {
          const isHovered = hoveredIndex === idx;
          const fill = bar.isPeak
            ? 'url(#barGradientPeak)'
            : bar.count > 0
            ? 'url(#barGradientPrimary)'
            : 'currentColor';

          return (
            <g key={idx}>
              {/* Background hover bar column */}
              <rect
                x={bar.x - 4}
                y={paddingTop}
                width={barWidth + 8}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Visible rounded bar */}
              <rect
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={Math.max(3, bar.barHeight)}
                rx="4"
                ry="4"
                fill={fill}
                className={`transition-all duration-200 pointer-events-none ${
                  bar.count === 0
                    ? 'text-slate-200 dark:text-slate-800/80'
                    : isHovered
                    ? 'opacity-90 filter brightness-110'
                    : 'opacity-100'
                }`}
              />

              {/* Peak indicator dot above bar */}
              {bar.isPeak && (
                <circle
                  cx={bar.x + barWidth / 2}
                  cy={bar.y - 7}
                  r="2.5"
                  className="fill-sky-500 animate-pulse"
                />
              )}

              {/* X Axis Label */}
              <text
                x={bar.x + barWidth / 2}
                y={paddingTop + plotHeight + 16}
                textAnchor="middle"
                className={`text-[9px] font-sans pointer-events-none ${
                  isHovered || bar.isPeak
                    ? 'fill-slate-700 dark:fill-slate-200 font-semibold'
                    : 'fill-slate-400'
                }`}
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && items[hoveredIndex] && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${((items[hoveredIndex].x + barWidth / 2) / chartWidth) * 100}%`,
            top: `${(items[hoveredIndex].y / chartHeight) * 100}%`,
          }}
        >
          <div className="bg-[#0B192C] text-white px-2.5 py-1 rounded-lg shadow-xl shadow-black/30 border border-slate-700/60 text-center whitespace-nowrap text-xs">
            <span className="text-[10px] text-slate-400 block">{items[hoveredIndex].label}</span>
            <span className="font-bold text-teal-400">
              {items[hoveredIndex].count} {items[hoveredIndex].count === 1 ? 'patient' : 'patients'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
