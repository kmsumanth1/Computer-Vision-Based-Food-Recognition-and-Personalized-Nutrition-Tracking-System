import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import Logo from '../components/common/Logo';
import MeterDial from '../components/common/MeterDial';
import TargetCards from '../components/profile/TargetCards';
import { nutritionService } from '../services/nutrition';
import { parseApiError } from '../utils/apiError';
import type { ApiErrorInfo } from '../types/api';
import type { NutritionPlan } from '../types/nutrition';

const PROGRESS_LINES = [
  'Estimating how much energy you use each day',
  'Adjusting for your daily steps',
  'Applying your goal',
  'Balancing protein, carbs and fat',
];

const REDIRECT_DELAY_MS = 4500;

export default function CalorieCalculation() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  // Ask the backend for Cut / Maintain / Bulk targets.
  useEffect(() => {
    let cancelled = false;
    setPlan(null);
    setError(null);
    nutritionService
      .calculate()
      .then((result) => !cancelled && setPlan(result))
      .catch((e) => !cancelled && setError(parseApiError(e, 'We couldn’t calculate your plan.')));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Rotate the helper line while waiting.
  useEffect(() => {
    if (plan || error) return;
    const timer = window.setInterval(() => setLineIndex((i) => (i + 1) % PROGRESS_LINES.length), 1500);
    return () => window.clearInterval(timer);
  }, [plan, error]);

  // Move on to the dashboard shortly after the plan is ready.
  useEffect(() => {
    if (!plan) return;
    const timer = window.setTimeout(() => navigate('/dashboard', { replace: true }), REDIRECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [plan, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="px-4 py-5 sm:px-8">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg text-center">
          {error ? (
            <div className="text-left">
              <ErrorMessage
                title="We couldn’t calculate your plan"
                message={error.message}
                onRetry={() => setAttempt((n) => n + 1)}
                action={
                  <Button variant="ghost" size="sm" onClick={() => navigate('/setup')}>
                    Edit my details
                  </Button>
                }
              />
            </div>
          ) : plan ? (
            <div aria-live="polite">
              <MeterDial progress={1} className="mx-auto w-52" label="Plan ready">
                <Flame className="h-7 w-7 text-pine-600" aria-hidden />
                <span className="mt-1 font-display text-lg font-semibold text-ink">Plan ready</span>
              </MeterDial>
              <h1 className="mt-4 text-2xl font-semibold text-ink">Your daily calorie targets</h1>
              <p className="mt-1 text-ink-mute">Based on your details. Your goal is highlighted.</p>
              <TargetCards targets={plan.calorie_targets} goal={plan.goal} className="mt-6 text-left" />
              <Button size="lg" className="mt-6" onClick={() => navigate('/dashboard', { replace: true })}>
                Go to dashboard
              </Button>
              <p className="mt-3 text-sm text-ink-mute">Opening your dashboard…</p>
            </div>
          ) : (
            <div role="status" aria-live="polite">
              <MeterDial progress={0} animate className="mx-auto w-56">
                <Flame className="h-8 w-8 text-pine-600" aria-hidden />
              </MeterDial>
              <h1 className="mt-6 text-2xl font-semibold text-ink">Creating your personalized nutrition plan…</h1>
              <p className="mt-2 h-6 text-ink-mute">{PROGRESS_LINES[lineIndex]}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
