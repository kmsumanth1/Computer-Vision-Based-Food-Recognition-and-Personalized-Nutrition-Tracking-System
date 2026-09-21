import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string | null;
  hint?: string;
  leftIcon?: ReactNode;
  /** Text or control shown inside the right edge, e.g. a unit or a show/hide button */
  suffix?: ReactNode;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, leftIcon, suffix, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-mute">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-xl border bg-white text-[15px] text-ink outline-none transition-colors',
            'placeholder:text-ink-mute/70 focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20',
            'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-mute',
            leftIcon ? 'pl-10' : 'pl-3.5',
            suffix ? 'pr-14' : 'pr-3.5',
            error ? 'border-protein focus:border-protein focus:ring-protein/20' : 'border-line',
          )}
          {...rest}
        />
        {suffix && <span className="absolute inset-y-0 right-2 flex items-center text-sm text-ink-mute">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-protein">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-ink-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default TextField;
