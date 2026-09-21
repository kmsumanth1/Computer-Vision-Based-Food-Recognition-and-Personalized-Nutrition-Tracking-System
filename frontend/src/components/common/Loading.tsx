import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { LogoMark } from './Logo';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-pine-600', className)} aria-hidden />;
}

interface LoadingProps {
  message?: string;
  detail?: string;
  variant?: 'inline' | 'panel' | 'screen';
  className?: string;
}

export default function Loading({ message = 'Loading…', detail, variant = 'panel', className }: LoadingProps) {
  if (variant === 'inline') {
    return (
      <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-ink-mute', className)}>
        <Spinner className="h-4 w-4" />
        {message}
      </span>
    );
  }

  const body = (
    <div role="status" className="flex flex-col items-center gap-3 text-center">
      {variant === 'screen' ? <LogoMark className="h-12 w-12" /> : null}
      <Spinner className="h-6 w-6" />
      <div>
        <p className="font-medium text-ink">{message}</p>
        {detail && <p className="mt-0.5 text-sm text-ink-mute">{detail}</p>}
      </div>
    </div>
  );

  if (variant === 'screen') {
    return <div className={cn('flex min-h-screen items-center justify-center bg-canvas p-6', className)}>{body}</div>;
  }
  return <div className={cn('flex items-center justify-center px-4 py-16', className)}>{body}</div>;
}
