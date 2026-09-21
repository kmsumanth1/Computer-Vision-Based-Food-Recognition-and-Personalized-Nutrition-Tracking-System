import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import { Spinner } from '../common/Loading';
import ImageAnalyzePanel from './ImageAnalyzePanel';
import { describeCameraError, isCameraSupported } from '../../utils/camera';
import type { FoodItem } from '../../types/food';

interface CameraScannerProps {
  onResult: (food: FoodItem) => void;
  onAddManually: () => void;
  onSwitchToUpload: () => void;
}

const MAX_CAPTURE_EDGE = 1600;

/** Live camera preview -> Capture Food -> preview -> Analyze Food. */
export default function CameraScanner({ onResult, onAddManually, onSwitchToUpload }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [starting, setStarting] = useState(true);
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<File | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Start the camera whenever there is no captured photo. Stop it when leaving.
  useEffect(() => {
    if (captured) return;
    let cancelled = false;
    setStarting(true);
    setReady(false);
    setCameraError(null);

    (async () => {
      if (!isCameraSupported()) {
        setCameraError(describeCameraError(null));
        setStarting(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        setReady(true);
      } catch (error) {
        if (!cancelled) setCameraError(describeCameraError(error));
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [captured, attempt, stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('We couldn’t capture the photo. Please try again.');
          return;
        }
        stopStream();
        setCaptured(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  }

  if (captured) {
    return (
      <ImageAnalyzePanel
        file={captured}
        discardLabel="Retake photo"
        onDiscard={() => setCaptured(null)}
        onResult={onResult}
        onAddManually={onAddManually}
      />
    );
  }

  if (cameraError) {
    return (
      <div>
        <ErrorMessage
          title="Camera unavailable"
          message={cameraError}
          onRetry={isCameraSupported() ? () => setAttempt((n) => n + 1) : undefined}
          action={
            <Button size="sm" variant="secondary" onClick={onSwitchToUpload}>
              Upload an image instead
            </Button>
          }
        />
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-pine-50 text-pine-300">
          <CameraOff className="h-12 w-12" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-pine-900 sm:aspect-video">
        <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" aria-label="Live camera preview" />
        {starting && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Spinner className="h-7 w-7 text-volt" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}
        {ready && (
          <div className="pointer-events-none absolute inset-6 rounded-3xl border-2 border-white/40" aria-hidden>
            <span className="absolute -left-0.5 -top-0.5 h-8 w-8 rounded-tl-3xl border-l-4 border-t-4 border-volt" />
            <span className="absolute -right-0.5 -top-0.5 h-8 w-8 rounded-tr-3xl border-r-4 border-t-4 border-volt" />
            <span className="absolute -bottom-0.5 -left-0.5 h-8 w-8 rounded-bl-3xl border-b-4 border-l-4 border-volt" />
            <span className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-br-3xl border-b-4 border-r-4 border-volt" />
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-ink-mute">Center the food in the frame, in good light, then capture.</p>
      <Button size="lg" fullWidth className="mt-3" onClick={capture} disabled={!ready} leftIcon={<Camera className="h-5 w-5" />}>
        Capture Food
      </Button>
    </div>
  );
}
