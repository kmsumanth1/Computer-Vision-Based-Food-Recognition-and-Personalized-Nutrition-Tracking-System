import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from '../common/Logo';
import NavLinks from './NavLinks';
import LogoutButton from './LogoutButton';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/** Slide-in drawer used below the tablet breakpoint. */
export default function MobileNav({ open, onClose, onLogout }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Close whenever the route changes.
  useEffect(() => {
    onCloseRef.current();
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 animate-fade-in bg-pine-900/55" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] animate-slide-in-left flex-col bg-pine-900 px-4 py-5 outline-none"
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <Logo tone="dark" />
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks onNavigate={onClose} />
        </div>
        <div className="mt-4 border-t border-white/10 pt-4">
          <LogoutButton onLogout={onLogout} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
