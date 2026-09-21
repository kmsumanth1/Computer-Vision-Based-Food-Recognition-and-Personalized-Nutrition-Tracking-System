import { cn } from '../../utils/cn';

/** Small meter dial in a rounded square. */
export function LogoMark({ className }: { className?: string }) {
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angle = ((150 + (240 * i) / 8) * Math.PI) / 180;
    const long = i % 4 === 0;
    const r1 = 21;
    const r2 = long ? 15 : 17.5;
    return {
      x1: 32 + r1 * Math.cos(angle),
      y1: 34 + r1 * Math.sin(angle),
      x2: 32 + r2 * Math.cos(angle),
      y2: 34 + r2 * Math.sin(angle),
    };
  });
  return (
    <svg viewBox="0 0 64 64" className={cn('h-9 w-9 shrink-0', className)} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0F6B53" />
      <g stroke="#CDF564" strokeWidth="3" strokeLinecap="round">
        {ticks.map((t, i) => (
          <line key={i} {...t} />
        ))}
        <line x1="32" y1="34" x2="40" y2="24" strokeWidth="3.4" />
      </g>
      <circle cx="32" cy="34" r="3.6" fill="#CDF564" />
    </svg>
  );
}

export default function Logo({ className, showText = true, tone = 'light' }: { className?: string; showText?: boolean; tone?: 'light' | 'dark' }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {showText && (
        <span className={cn('font-display text-[17px] font-semibold leading-[1.1]', tone === 'dark' ? 'text-white' : 'text-ink')}>
          AI Food
          <br />
          Calories Meter
        </span>
      )}
    </div>
  );
}
