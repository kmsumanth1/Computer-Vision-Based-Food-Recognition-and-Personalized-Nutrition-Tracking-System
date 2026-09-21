import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const openModals: number[] = [];
let modalCounter = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Set false while a request is running so the dialog can't be dismissed */
  dismissible?: boolean;
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export default function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [modalId] = useState(() => ++modalCounter);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    openModals.push(modalId);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (openModals[openModals.length - 1] !== modalId) return;
      if (event.key === 'Escape' && dismissibleRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openModals.splice(openModals.indexOf(modalId), 1);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, modalId]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-pine-900/45"
        onClick={() => dismissible && onClose()}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-modal-in flex-col rounded-t-3xl bg-white shadow-pop outline-none sm:rounded-2xl',
          SIZE[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-mute">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            className="-mr-2 rounded-lg p-2 text-ink-mute hover:bg-pine-50 hover:text-ink disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
