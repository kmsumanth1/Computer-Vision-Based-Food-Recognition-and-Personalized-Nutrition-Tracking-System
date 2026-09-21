import { useEffect, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import { Spinner } from '../common/Loading';
import { foodService } from '../../services/food';
import { parseApiError } from '../../utils/apiError';
import type { ApiErrorInfo } from '../../types/api';
import type { FoodItem } from '../../types/food';

interface ImageAnalyzePanelProps {
  file: File;
  /** Label of the button that discards the image */
  discardLabel: string;
  onDiscard: () => void;
  onResult: (food: FoodItem) => void;
  onAddManually: () => void;
}

/** Image preview + "Analyze Food". Shared by the camera and upload options. */
export default function ImageAnalyzePanel({ file, discardLabel, onDiscard, onResult, onAddManually }: ImageAnalyzePanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const food = await foodService.analyzeImage(file);
      onResult(food);
    } catch (e) {
      setError(parseApiError(e, 'We couldn’t analyze this image. Please try again.'));
      setAnalyzing(false);
    }
  }

  const notRecognised = error?.code === 'FOOD_NOT_RECOGNIZED' || error?.code === 'INVALID_IMAGE';

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-pine-900">
        {previewUrl && <img src={previewUrl} alt="Food to analyze" className="mx-auto max-h-[60vh] w-full object-contain" />}

        {analyzing && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-pine-900/75 px-6 text-center text-white backdrop-blur-[2px]">
            <div className="absolute inset-x-0 top-0 h-full overflow-hidden" aria-hidden>
              <div className="h-1/3 animate-scan-sweep bg-gradient-to-b from-transparent via-volt/25 to-volt/60 border-b-2 border-volt" />
            </div>
            <Spinner className="relative h-8 w-8 text-volt" />
            <div className="relative">
              <p className="text-lg font-semibold">Analyzing your food…</p>
              <p className="text-sm text-white/70">AI is analyzing your food. This takes a few seconds.</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <ErrorMessage
          className="mt-4"
          tone={notRecognised ? 'warning' : 'error'}
          title={notRecognised ? 'Food not recognized' : 'Analysis failed'}
          message={error.message}
          onRetry={notRecognised ? undefined : analyze}
          action={
            <>
              <Button size="sm" variant="secondary" onClick={onDiscard}>
                {discardLabel}
              </Button>
              {notRecognised && (
                <Button size="sm" variant="secondary" onClick={onAddManually}>
                  Add food manually
                </Button>
              )}
            </>
          }
        />
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={analyze} loading={analyzing} loadingText="Analyzing…" leftIcon={<Sparkles className="h-5 w-5" />} className="sm:flex-1">
          Analyze Food
        </Button>
        <Button size="lg" variant="secondary" onClick={onDiscard} disabled={analyzing} leftIcon={<RotateCcw className="h-4 w-4" />}>
          {discardLabel}
        </Button>
      </div>
    </div>
  );
}
