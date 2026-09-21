import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  tone?: 'error' | 'warning';
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra actions, such as "Add food manually" */
  action?: ReactNode;
  className?: string;
}

export default function ErrorMessage({ title, message, tone = 'error', onRetry, retryLabel = 'Try again', action, className }: ErrorMessageProps) {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-xl border p-4',
        isError ? 'border-protein/25 bg-protein-soft' : 'border-carbs/30 bg-carbs-soft',
        className,
      )}
    >
      <AlertTriangle className={cn('mt-0.5 h-5 w-5 shrink-0', isError ? 'text-protein' : 'text-carbs')} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        <p className={cn('text-sm text-ink-soft', title && 'mt-0.5')}>{message}</p>
        {(onRetry || action) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
                {retryLabel}
              </Button>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
