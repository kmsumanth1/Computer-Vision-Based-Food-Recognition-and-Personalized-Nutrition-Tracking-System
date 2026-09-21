import { useId } from 'react';
import { Minus, Plus, RefreshCw } from 'lucide-react';
import { Spinner } from '../common/Loading';
import Button from '../common/Button';
import { WEIGHT_LIMITS, WEIGHT_STEP_G } from '../../constants/config';
import { clamp, formatNumber } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { ApiErrorInfo } from '../../types/api';

interface WeightInputProps {
  weightInput: string;
  weightG: number | null;
  onChange: (value: string) => void;
  /** Weight the AI or barcode lookup used */
  referenceWeightG: number;
  calculating: boolean;
  validationError: string | null;
  error: ApiErrorInfo | null;
  onRetry: () => void;
  disabled?: boolean;
  /** Helper text under the label */
  description?: string;
}

/**
 * The AI can name a food but can't know how much of it there is,
 * so the weight is always editable. The parent asks the backend to recalculate.
 */
export default function WeightInput({
  weightInput,
  weightG,
  onChange,
  referenceWeightG,
  calculating,
  validationError,
  error,
  onRetry,
  disabled,
  description = 'Enter the weight you ate and the nutrition updates.',
}: WeightInputProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(validationError || error);

  function step(direction: 1 | -1) {
    const base = weightG ?? referenceWeightG;
    const next = clamp(Math.round(base / WEIGHT_STEP_G) * WEIGHT_STEP_G + direction * WEIGHT_STEP_G, WEIGHT_LIMITS.min, WEIGHT_LIMITS.max);
    onChange(String(next));
  }

  const stepper =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-soft transition-colors hover:border-pine-300 hover:bg-pine-50 disabled:opacity-50';

  return (
    <div>
      <label htmlFor={id} className="block text-base font-semibold text-ink">
        Food weight
      </label>
      <p className="mt-0.5 text-sm text-ink-mute">{description}</p>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" className={stepper} onClick={() => step(-1)} disabled={disabled} aria-label={`Decrease weight by ${WEIGHT_STEP_G} grams`}>
          <Minus className="h-4 w-4" />
        </button>

        <div className="relative w-full max-w-[200px]">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={WEIGHT_LIMITS.min}
            max={WEIGHT_LIMITS.max}
            step="any"
            value={weightInput}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            className={cn(
              'h-11 w-full rounded-xl border bg-white pl-4 pr-16 text-center font-display text-xl font-semibold tabular-nums text-ink outline-none transition-colors focus:ring-2',
              validationError ? 'border-protein focus:border-protein focus:ring-protein/20' : 'border-line focus:border-pine-500 focus:ring-pine-500/20',
            )}
          />
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-ink-mute">grams</span>
        </div>

        <button type="button" className={stepper} onClick={() => step(1)} disabled={disabled} aria-label={`Increase weight by ${WEIGHT_STEP_G} grams`}>
          <Plus className="h-4 w-4" />
        </button>

        <span className="h-5 w-5" aria-live="polite">
          {calculating && (
            <span role="status" className="flex">
              <Spinner className="h-5 w-5" />
              <span className="sr-only">Recalculating nutrition</span>
            </span>
          )}
        </span>
      </div>

      <div id={messageId} className="mt-2 text-sm">
        {validationError ? (
          <p className="text-protein">{validationError}</p>
        ) : error ? (
          <p className="flex flex-wrap items-center gap-2 text-protein">
            {error.message}
            <Button size="sm" variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Retry
            </Button>
          </p>
        ) : (
          <p className="text-ink-mute">
            Reference serving: {formatNumber(referenceWeightG, 1)} g
            {weightG !== null && weightG !== referenceWeightG && (
              <>
                {' '}
                ·{' '}
                <button type="button" onClick={() => onChange(String(referenceWeightG))} className="font-semibold text-pine-700 hover:underline">
                  Reset
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
