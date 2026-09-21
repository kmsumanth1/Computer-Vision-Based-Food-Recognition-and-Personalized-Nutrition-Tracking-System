import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface MeterDialProps {
  /** 0 to 1 for progress; anything above 1 means the target was exceeded */
  progress: number;
  tone?: 'dark' | 'light';
  ticks?: number;
  /** Loading mode: ticks pulse in sequence instead of showing progress */
  animate?: boolean;
  label?: string;
  className?: string;
  children?: ReactNode;
}

const COLORS = {
  dark: { off: 'rgba(255,255,255,0.15)', on: '#CDF564', over: '#FF8A8E' },
  light: { off: '#DCE4DF', on: '#0F6B53', over: '#E5484D' },
} as const;

const START_ANGLE = 140;
const SWEEP = 260;

/** Tick-mark gauge. The signature visual of the product. */
export default function MeterDial({ progress, tone = 'light', ticks = 60, animate = false, label, className, children }: MeterDialProps) {
  const colors = COLORS[tone];
  const over = progress > 1;
  // Start empty, then fill on the next frame so the ticks light up in sequence on first paint.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const filled = ready ? Math.round(Math.min(Math.max(progress, 0), 1) * ticks) : 0;

  return (
    <div className={cn('relative aspect-square', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {Array.from({ length: ticks }, (_, i) => {
          const angle = ((START_ANGLE + (SWEEP * i) / (ticks - 1)) * Math.PI) / 180;
          const long = i % 5 === 0;
          const r1 = 94;
          const r2 = long ? 76 : 82;
          const isOn = animate || i < filled;
          return (
            <line
              key={i}
              x1={100 + r1 * Math.cos(angle)}
              y1={100 + r1 * Math.sin(angle)}
              x2={100 + r2 * Math.cos(angle)}
              y2={100 + r2 * Math.sin(angle)}
              stroke={isOn ? (over ? colors.over : colors.on) : colors.off}
              strokeWidth={long ? 3.4 : 2.4}
              strokeLinecap="round"
              className={animate ? 'animate-tick-pulse' : undefined}
              style={animate ? { animationDelay: `${i * 28}ms` } : { transition: 'stroke 300ms ease', transitionDelay: `${i * 8}ms` }}
            />
          );
        })}
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  );
}
