import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ScanLine, Utensils } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button, { buttonClasses } from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import MealCard from '../components/meals/MealCard';
import EditMealModal from '../components/meals/EditMealModal';
import ManualFoodModal from '../components/meals/ManualFoodModal';
import { MEAL_META, MEAL_TYPES } from '../constants/meals';
import { useToast } from '../context/ToastContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { mealService } from '../services/meals';
import { parseApiError } from '../utils/apiError';
import { formatDay, formatNumber, todayISO } from '../utils/format';
import { groupByMeal, sumEntries } from '../utils/nutrition';
import type { MealEntry, MealType } from '../types/meal';

function Total({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: string }) {
  return (
    <div className={`rounded-xl p-3.5 ${tone}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="font-display text-2xl font-semibold tabular-nums text-ink">
        {formatNumber(value, unit === 'g' ? 1 : 0)} <span className="text-sm font-medium text-ink-mute">{unit}</span>
      </p>
    </div>
  );
}

export default function Meals() {
  const { showToast } = useToast();
  const today = todayISO();
  const { data, loading, error, reload } = useAsyncData(() => mealService.list(today), [today]);

  const [adding, setAdding] = useState<{ open: boolean; meal?: MealType }>({ open: false });
  const [editing, setEditing] = useState<MealEntry | null>(null);
  const [deleting, setDeleting] = useState<MealEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await mealService.remove(deleting.id);
      showToast(`${deleting.food_name} removed`);
      setDeleting(null);
      await reload({ silent: true });
    } catch (e) {
      showToast(parseApiError(e, 'We couldn’t delete this food. Try again.').message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  }

  const entries = data?.entries ?? [];
  const totals = sumEntries(entries);
  const groups = groupByMeal(entries);

  return (
    <PageContainer
      title="Meals"
      description={formatDay(today, 'long')}
      actions={
        <>
          <Link to="/food-analysis" className={buttonClasses('secondary', 'md')}>
            <ScanLine className="h-4 w-4" aria-hidden />
            Analyze food
          </Link>
          <Button onClick={() => setAdding({ open: true })} leftIcon={<Plus className="h-4 w-4" />}>
            Add food
          </Button>
        </>
      }
    >
      {loading && !data ? (
        <Loading message="Loading your meals…" />
      ) : error && !data ? (
        <ErrorMessage title="Couldn’t load your meals" message={error.message} onRetry={() => void reload()} />
      ) : data ? (
        <div className="space-y-5">
          <section className="card p-5 sm:p-6" aria-label="Today’s totals">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr] lg:items-center">
              <div>
                <p className="text-sm text-ink-mute">Today’s total calories</p>
                <p className="font-display text-5xl font-semibold tabular-nums text-ink">
                  {formatNumber(totals.calories)} <span className="text-xl font-medium text-ink-mute">kcal</span>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Total label="Protein" value={totals.protein_g} unit="g" tone="bg-protein-soft" />
                <Total label="Carbs" value={totals.carbs_g} unit="g" tone="bg-carbs-soft" />
                <Total label="Fat" value={totals.fat_g} unit="g" tone="bg-fat-soft" />
              </div>
            </div>
          </section>

          {entries.length === 0 && (
            <div className="card">
              <EmptyState
                icon={Utensils}
                title="No meals logged today"
                description="Analyze a photo or barcode, or add a food by hand. It shows up here by meal."
                action={
                  <Button onClick={() => setAdding({ open: true })} leftIcon={<Plus className="h-4 w-4" />}>
                    Add food
                  </Button>
                }
              />
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {MEAL_TYPES.map((type) => (
              <MealCard
                key={type}
                type={type}
                entries={groups[type]}
                onAdd={(meal) => setAdding({ open: true, meal })}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
        </div>
      ) : null}

      <ManualFoodModal
        open={adding.open}
        defaultMeal={adding.meal}
        onClose={() => setAdding({ open: false })}
        onAdded={(entry) => {
          setAdding({ open: false });
          showToast(`Added to ${MEAL_META[entry.meal_type].label}`);
          void reload({ silent: true });
        }}
      />

      <EditMealModal
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          showToast('Changes saved');
          void reload({ silent: true });
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this food?"
        message={deleting ? `${deleting.food_name} will be removed from ${MEAL_META[deleting.meal_type].label.toLowerCase()}.` : ''}
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        danger
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </PageContainer>
  );
}
