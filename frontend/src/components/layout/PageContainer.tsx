import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PageContainerProps {
  title: string;
  description?: string;
  /** Buttons or filters shown beside the title */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Page heading plus a width-limited content area. */
export default function PageContainer({ title, description, actions, children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8', className)}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-semibold leading-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-ink-mute">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
