import { useMemo, useState, type FormEvent } from 'react';
import { Save, Undo2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import BodyFields from '../components/profile/BodyFields';
import ActivityPicker from '../components/profile/ActivityPicker';
import GoalPicker from '../components/profile/GoalPicker';
import TargetCards from '../components/profile/TargetCards';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { nutritionService } from '../services/nutrition';
import { profileService } from '../services/profile';
import { parseApiError } from '../utils/apiError';
import { formatNumber } from '../utils/format';
import {
  formToProfile,
  profileToForm,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '../utils/profileForm';
import type { NutritionPlan } from '../types/nutrition';
import type { UserProfile } from '../types/user';

interface ProfileData {
  profile: UserProfile;
  plan: NutritionPlan;
}

async function loadProfile(): Promise<ProfileData> {
  const { profile, plan } = await profileService.get();
  // If the backend hasn't calculated targets yet, ask it to.
  return { profile, plan: plan ?? (await nutritionService.calculate()) };
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-mute">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { data, loading, error, reload } = useAsyncData(loadProfile, []);

  return (
    <PageContainer title="Profile" description="Your details and daily calorie targets.">
      {loading && !data ? (
        <Loading message="Loading your profile…" />
      ) : error && !data ? (
        <ErrorMessage title="Couldn’t load your profile" message={error.message} onRetry={() => void reload()} />
      ) : data ? (
        // Re-mount the form whenever fresh data arrives so it resets cleanly.
        <ProfileForm key={JSON.stringify(data.profile)} initial={data} />
      ) : null}
    </PageContainer>
  );
}

function ProfileForm({ initial }: { initial: ProfileData }) {
  const { updateUserName } = useAuth();
  const { showToast } = useToast();
  const [saved, setSaved] = useState<ProfileData>(initial);
  const [values, setValues] = useState<ProfileFormValues>(() => profileToForm(initial.profile));
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const baseline = useMemo(() => profileToForm(saved.profile), [saved.profile]);
  const dirty = (Object.keys(baseline) as Array<keyof ProfileFormValues>).some((k) => baseline[k] !== values[k]);

  function setField<K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function discard() {
    setValues(baseline);
    setErrors({});
    setSubmitError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateProfileForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const body = formToProfile(values);
      const response = await profileService.update(body);
      // The backend recalculates targets when the body values or goal change.
      const plan = response.plan ?? (await nutritionService.calculate());
      setSaved({ profile: response.profile, plan });
      setValues(profileToForm(response.profile));
      updateUserName(response.profile.name);
      showToast('Profile updated. Your targets were recalculated.');
    } catch (e) {
      setSubmitError(parseApiError(e, 'We couldn’t save your profile. Please try again.').message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-5">
        <Section title="Your details">
          <BodyFields values={values} errors={errors} onChange={setField} disabled={saving} />
        </Section>
        <Section title="Daily steps" description="Your usual activity level.">
          <ActivityPicker value={values.activity_level} onChange={(v) => setField('activity_level', v)} error={errors.activity_level} disabled={saving} />
        </Section>
        <Section title="Fitness goal">
          <GoalPicker value={values.goal} onChange={(v) => setField('goal', v)} error={errors.goal} disabled={saving} />
        </Section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24">
        <section className="card p-5 sm:p-6" aria-labelledby="targets-heading">
          <h2 id="targets-heading" className="text-lg font-semibold text-ink">
            Calorie targets
          </h2>
          <p className="mb-4 mt-0.5 text-sm text-ink-mute">Per day, for each goal.</p>
          <TargetCards targets={saved.plan.calorie_targets} goal={saved.profile.goal} layout="stack" />
          <p className="mt-4 text-sm text-ink-mute">
            You’re following {formatNumber(saved.plan.daily_calories)} kcal a day. Change your weight, height, body fat, activity or goal and the targets are recalculated when you save.
          </p>
        </section>

        {submitError && <ErrorMessage title="Couldn’t save" message={submitError} />}

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button type="submit" size="lg" loading={saving} loadingText="Saving and recalculating…" disabled={!dirty} leftIcon={<Save className="h-5 w-5" />} className="sm:flex-1">
            Save changes
          </Button>
          <Button size="lg" variant="secondary" onClick={discard} disabled={!dirty || saving} leftIcon={<Undo2 className="h-4 w-4" />}>
            Discard
          </Button>
        </div>
      </aside>
    </form>
  );
}
