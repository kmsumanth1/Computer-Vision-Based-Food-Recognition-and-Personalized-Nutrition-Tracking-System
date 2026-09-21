import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, ScanBarcode, type LucideIcon } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { buttonClasses } from '../components/common/Button';
import CameraScanner from '../components/food/CameraScanner';
import ImageUploader from '../components/food/ImageUploader';
import BarcodeScanner from '../components/food/BarcodeScanner';
import FoodResult from '../components/food/FoodResult';
import ManualFoodModal from '../components/meals/ManualFoodModal';
import { MEAL_META } from '../constants/meals';
import { useToast } from '../context/ToastContext';
import { formatNumber } from '../utils/format';
import type { FoodInputMode, FoodItem } from '../types/food';
import type { MealEntry } from '../types/meal';

interface ModeOption {
  mode: FoodInputMode;
  title: string;
  description: string;
  icon: LucideIcon;
}

const MODES: ModeOption[] = [
  { mode: 'camera', title: 'Live Camera Scan', description: 'Point your camera at the food and capture it.', icon: Camera },
  { mode: 'upload', title: 'Upload Image', description: 'Drop in a photo from your device.', icon: ImagePlus },
  { mode: 'barcode', title: 'Barcode Scanner', description: 'Scan a packaged product to get its nutrition.', icon: ScanBarcode },
];

function parseMode(value: string | null): FoodInputMode | null {
  return value === 'camera' || value === 'upload' || value === 'barcode' ? value : null;
}

export default function FoodAnalysis() {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const mode = parseMode(params.get('mode'));

  const [food, setFood] = useState<FoodItem | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [added, setAdded] = useState<MealEntry | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  function chooseMode(next: FoodInputMode | null) {
    setFood(null);
    setAdded(null);
    setParams(next ? { mode: next } : {}, { replace: false });
  }

  function handleResult(item: FoodItem) {
    setFood(item);
    setResultKey((k) => k + 1);
  }

  function reset() {
    setFood(null);
    setAdded(null);
  }

  const active = MODES.find((m) => m.mode === mode);

  return (
    <PageContainer
      title="Food Analysis"
      description={active && !food && !added ? active.description : 'Choose how you want to add your food.'}
      actions={
        active ? (
          <button
            type="button"
            onClick={() => chooseMode(null)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-pine-700 hover:bg-pine-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All options
          </button>
        ) : undefined
      }
    >
      {/* Step 1: three ways to add food */}
      {!active && !added && (
        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map(({ mode: value, title, description, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => chooseMode(value)}
              className="card group flex flex-col items-start p-6 text-left transition-colors hover:border-pine-300 hover:bg-pine-50/50"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-900 text-volt transition-transform group-hover:-rotate-3">
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <span className="mt-6 text-xl font-semibold text-ink">{title}</span>
              <span className="mt-1 text-ink-mute">{description}</span>
            </button>
          ))}
          <p className="md:col-span-3">
            <button type="button" onClick={() => setManualOpen(true)} className="text-sm font-semibold text-pine-700 hover:underline">
              Prefer to type it in? Add food manually
            </button>
          </p>
        </div>
      )}

      {/* Step 2: capture, upload or scan */}
      {active && !food && !added && (
        <div className="mx-auto max-w-2xl">
          {mode === 'camera' && <CameraScanner onResult={handleResult} onAddManually={() => setManualOpen(true)} onSwitchToUpload={() => chooseMode('upload')} />}
          {mode === 'upload' && <ImageUploader onResult={handleResult} onAddManually={() => setManualOpen(true)} />}
          {mode === 'barcode' && <BarcodeScanner onResult={handleResult} onAddManually={() => setManualOpen(true)} />}
        </div>
      )}

      {/* Step 3: result with editable weight */}
      {active && food && !added && mode && (
        <FoodResult
          key={resultKey}
          food={food}
          source={mode}
          onAdded={(entry) => {
            setAdded(entry);
            showToast(`Added to ${MEAL_META[entry.meal_type].label}`);
          }}
          onStartOver={reset}
          onAddManually={() => setManualOpen(true)}
        />
      )}

      {/* Step 4: saved */}
      {added && (
        <div className="card mx-auto flex max-w-lg flex-col items-center p-8 text-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine-50 text-pine-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-ink">Added to {MEAL_META[added.meal_type].label}</h2>
          <p className="mt-1 text-ink-mute">
            {added.food_name}, {formatNumber(added.weight_g, 1)} g · {formatNumber(added.nutrition.calories)} kcal
          </p>
          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/meals" className={buttonClasses('primary', 'lg')}>
              View meals
            </Link>
            <button type="button" onClick={reset} className={buttonClasses('secondary', 'lg')}>
              Analyze another food
            </button>
          </div>
        </div>
      )}

      <ManualFoodModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onAdded={(entry) => {
          setManualOpen(false);
          setFood(null);
          setAdded(entry);
          showToast(`Added to ${MEAL_META[entry.meal_type].label}`);
        }}
      />
    </PageContainer>
  );
}
