import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';
import ImageAnalyzePanel from './ImageAnalyzePanel';
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '../../constants/config';
import { validateImageFile } from '../../utils/image';
import { cn } from '../../utils/cn';
import type { FoodItem } from '../../types/food';

interface ImageUploaderProps {
  onResult: (food: FoodItem) => void;
  onAddManually: () => void;
}

/** Drag and drop or browse for a JPG, JPEG, PNG or WEBP image. */
export default function ImageUploader({ onResult, onAddManually }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    const problem = validateImageFile(candidate);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(candidate);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  if (file) {
    return (
      <ImageAnalyzePanel
        file={file}
        discardLabel="Choose another image"
        onDiscard={() => setFile(null)}
        onResult={onResult}
        onAddManually={onAddManually}
      />
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-label="Upload a food image. Drag and drop or press Enter to browse."
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors',
          dragging ? 'border-pine-500 bg-pine-50' : 'border-pine-200 bg-white hover:border-pine-400 hover:bg-pine-50/60',
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-50 text-pine-600">
          <ImagePlus className="h-7 w-7" aria-hidden />
        </span>
        <p className="mt-4 text-lg font-semibold text-ink">Drop a food photo here</p>
        <p className="mt-1 text-ink-mute">
          or <span className="font-semibold text-pine-700 underline underline-offset-2">browse your files</span>
        </p>
        <p className="mt-3 text-sm text-ink-mute">
          {ACCEPTED_IMAGE_EXTENSIONS} · up to {MAX_IMAGE_SIZE_MB} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {error && <ErrorMessage className="mt-4" title="Invalid image" message={error} />}
      <button type="button" onClick={onAddManually} className="mt-4 text-sm font-semibold text-pine-700 hover:underline">
        No photo? Add food manually
      </button>
    </div>
  );
}
