import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import CalorieCard from '../components/dashboard/CalorieCard';
import WaterCard from '../components/dashboard/WaterCard';
import MacroCard from '../components/dashboard/MacroCard';
import MealSummary from '../components/dashboard/MealSummary';
import QuickActions from '../components/dashboard/QuickActions';
import ManualFoodModal from '../components/meals/ManualFoodModal';
import { MEAL_META } from '../constants/meals';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { nutritionService } from '../services/nutrition';
import { firstNameOf, formatDay, todayISO } from '../utils/format';
import { sumEntries } from '../utils/nutrition';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const today = todayISO();
  const { data, loading, error, reload, setData } = useAsyncData(() => nutritionService.getDashboard(today), [today]);
  const [manualOpen, setManualOpen] = useState(false);

  const title = `${greeting()}${user?.name ? `, ${firstNameOf(user.name)}` : ''}`;

  return (
    <PageContainer title={title} description={formatDay(today, 'long')}>
      {loading && !data ? (
        <Loading message="Loading your dashboard…" />
      ) : error && !data ? (
        <ErrorMessage title="Couldn’t load your dashboard" message={error.message} onRetry={() => void reload()} />
      ) : data ? (
        <div className="space-y-5">
          <QuickActions onAddManually={() => setManualOpen(true)} />

          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <CalorieCard consumed={sumEntries(data.entries).calories} target={data.plan.daily_calories} goal={data.plan.goal} />
            <WaterCard water={data.water} onChange={(water) => setData((prev) => ({ ...prev, water }))} />
          </div>

          <MacroCard totals={sumEntries(data.entries)} targets={data.plan.macro_targets} />

          <MealSummary entries={data.entries} />
        </div>
      ) : null}

      <ManualFoodModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onAdded={(entry) => {
          setManualOpen(false);
          showToast(`Added to ${MEAL_META[entry.meal_type].label}`);
          void reload({ silent: true });
        }}
      />
    </PageContainer>
  );
}
