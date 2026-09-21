import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { CameraOff } from 'lucide-react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import Loading, { Spinner } from '../common/Loading';
import TextField from '../common/TextField';
import { foodService } from '../../services/food';
import { parseApiError } from '../../utils/apiError';
import { describeCameraError, isCameraSupported } from '../../utils/camera';
import type { ApiErrorInfo } from '../../types/api';
import type { FoodItem } from '../../types/food';

interface BarcodeScannerProps {
  onResult: (food: FoodItem) => void;
  onAddManually: () => void;
}

const HINTS = new Map<DecodeHintType, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ],
  ],
]);

/** Scans a barcode with ZXing, then asks the backend for the product. */
export default function BarcodeScanner({ onResult, onAddManually }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(true);
  const [starting, setStarting] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookupCode, setLookupCode] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<ApiErrorInfo | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [typed, setTyped] = useState('');
  const [typedError, setTypedError] = useState<string | null>(null);
  // Keep the latest callback in a ref so a parent re-render never restarts the camera.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const lookup = useCallback(
    async (code: string) => {
      setScanning(false);
      setLookupCode(code);
      setLookupError(null);
      try {
        const food = await foodService.lookupBarcode(code);
        onResultRef.current(food);
      } catch (e) {
        setLookupError(parseApiError(e, 'We couldn’t look up this barcode. Please try again.'));
      }
    },
    [],
  );

  // Camera + ZXing decoding loop, active only while `scanning`.
  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    let stop: (() => void) | null = null;
    let handled = false;

    setStarting(true);
    setCameraError(null);

    if (!isCameraSupported()) {
      setCameraError(describeCameraError(null));
      setStarting(false);
      return;
    }

    const reader = new BrowserMultiFormatReader(HINTS);
    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, videoRef.current ?? undefined, (result, _error, controls) => {
        if (!result || handled || cancelled) return;
        handled = true;
        controls.stop();
        void lookup(result.getText());
      })
      .then((controls) => {
        if (cancelled) controls.stop();
        else {
          stop = () => controls.stop();
          setStarting(false);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setCameraError(describeCameraError(error));
        setStarting(false);
      });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [scanning, attempt, lookup]);

  function scanAgain() {
    setLookupCode(null);
    setLookupError(null);
    setAttempt((n) => n + 1);
    setScanning(true);
  }

  function submitTyped(event: FormEvent) {
    event.preventDefault();
    const code = typed.replace(/\s+/g, '');
    if (!/^\d{6,14}$/.test(code)) {
      setTypedError('Enter the 6 to 14 digits printed under the barcode.');
      return;
    }
    setTypedError(null);
    void lookup(code);
  }

  const manualEntry = (
    <form onSubmit={submitTyped} noValidate className="mt-6 rounded-2xl border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">Can’t scan it?</p>
      <div className="mt-2 flex items-start gap-2">
        <TextField
          label="Barcode number"
          className="flex-1 [&>label]:sr-only"
          inputMode="numeric"
          placeholder="Type the barcode number"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          error={typedError}
          disabled={lookupCode !== null && !lookupError}
        />
        <Button type="submit" variant="secondary" disabled={lookupCode !== null && !lookupError}>
          Look up
        </Button>
      </div>
    </form>
  );

  // Looking the product up
  if (lookupCode && !lookupError) {
    return (
      <div className="rounded-2xl border border-line bg-white">
        <Loading message="Looking up this product…" detail={`Barcode ${lookupCode}`} />
      </div>
    );
  }

  // Lookup failed
  if (lookupCode && lookupError) {
    const notFound = lookupError.code === 'BARCODE_NOT_FOUND';
    return (
      <div>
        <ErrorMessage
          tone={notFound ? 'warning' : 'error'}
          title={notFound ? 'Barcode not recognized' : 'Lookup failed'}
          message={lookupError.message}
          onRetry={notFound ? undefined : () => void lookup(lookupCode)}
          action={
            <>
              <Button size="sm" variant="secondary" onClick={scanAgain}>
                Scan again
              </Button>
              <Button size="sm" variant="secondary" onClick={onAddManually}>
                Add food manually
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (cameraError) {
    return (
      <div>
        <ErrorMessage
          title="Camera unavailable"
          message={cameraError}
          onRetry={isCameraSupported() ? () => setAttempt((n) => n + 1) : undefined}
        />
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-pine-50 text-pine-300">
          <CameraOff className="h-12 w-12" aria-hidden />
        </div>
        {manualEntry}
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-pine-900 sm:aspect-video">
        <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" aria-label="Live camera preview for barcode scanning" />
        {starting ? (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Spinner className="h-7 w-7 text-volt" />
            <p className="text-sm">Starting camera…</p>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-x-[10%] inset-y-[28%] overflow-hidden rounded-2xl border-2 border-volt/80" aria-hidden>
            <div className="h-1/4 animate-scan-sweep border-b-2 border-volt bg-gradient-to-b from-transparent to-volt/30" />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-mute" aria-live="polite">
        Hold the barcode inside the frame. It scans on its own.
      </p>
      {manualEntry}
      <button type="button" onClick={onAddManually} className="mt-4 text-sm font-semibold text-pine-700 hover:underline">
        Product has no barcode? Add food manually
      </button>
    </div>
  );
}
