import * as React from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
  fillClassName?: string;
  strokeClassName?: string;
}

export function Sparkline({
  data,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  className,
  fillClassName = 'fill-brand-100',
  strokeClassName = 'stroke-brand-500',
}: SparklineProps) {
  if (!data.length) {
    return <div className={cn('h-7 w-24', className)} />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - strokeWidth * 2) - strokeWidth;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${(points[points.length - 1].x).toFixed(2)} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('overflow-visible', className)}
      role="img"
      aria-hidden="true"
    >
      <path d={areaPath} className={fillClassName} opacity={0.35} />
      <path
        d={linePath}
        fill="none"
        className={strokeClassName}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
