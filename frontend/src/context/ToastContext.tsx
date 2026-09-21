import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

type ToastTone = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl bg-pine-900 py-3 pl-4 pr-3 text-sm font-medium text-white shadow-pop animate-modal-in"
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-volt" aria-hidden />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-[#FF8A8E]" aria-hidden />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
