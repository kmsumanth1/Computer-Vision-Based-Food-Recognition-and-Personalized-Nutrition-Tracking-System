import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-10 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-50 text-pine-600">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-mute">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
