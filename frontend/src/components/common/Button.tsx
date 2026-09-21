import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'volt';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-pine-600 text-white hover:bg-pine-700 active:bg-pine-800',
  secondary: 'border border-line bg-white text-ink hover:border-pine-300 hover:bg-pine-50',
  ghost: 'text-ink-soft hover:bg-pine-50 hover:text-ink',
  danger: 'bg-[#D6353B] text-white hover:bg-[#B92B31]',
  volt: 'bg-volt text-pine-900 hover:brightness-95',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/** Class string so links (<Link>) can look like buttons. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', fullWidth = false): string {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText, leftIcon, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size, fullWidth), className)}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
});

export default Button;
