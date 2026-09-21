import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import BodyFields from '../components/profile/BodyFields';
import ActivityPicker from '../components/profile/ActivityPicker';
import GoalPicker from '../components/profile/GoalPicker';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import { parseApiError } from '../utils/apiError';
import {
  emptyProfileForm,
  formToProfile,
  validateProfileForm,
  type ProfileFormErrors,
  type ProfileFormValues,
} from '../utils/profileForm';

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mb-4 mt-0.5 text-sm text-ink-mute">{description}</p>
      {children}
    </section>
  );
}

export default function ProfileSetup() {
  const { user, markProfileCompleted } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<ProfileFormValues>(() => emptyProfileForm(user?.name ?? ''));
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateProfileForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Bring the first problem into view
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"], [role="radiogroup"]:has(+ p.text-protein)')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
      );
      return;
    }

    setSubmitting(true);
    try {
      const profile = formToProfile(values);
      await profileService.setup(profile);
      markProfileCompleted(profile.name);
      navigate('/calculating', { replace: true });
    } catch (error) {
      setSubmitError(parseApiError(error, 'We couldn’t save your details. Please try again.').message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="mx-auto flex max-w-3xl items-center px-4 py-5 sm:px-6">
        <Logo />
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h1 className="text-[1.75rem] font-semibold leading-tight text-ink sm:text-[2rem]">Set up your nutrition plan</h1>
        <p className="mt-2 max-w-xl text-ink-mute">
          We use these details to calculate how many calories you need each day. You can change them later in Profile.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <Section title="About you" description="Your body measurements.">
            <BodyFields values={values} errors={errors} onChange={setField} disabled={submitting} />
          </Section>

          <Section title="Daily steps" description="Pick the range that matches an average day.">
            <ActivityPicker
              value={values.activity_level}
              onChange={(v) => setField('activity_level', v)}
              error={errors.activity_level}
              disabled={submitting}
            />
          </Section>

          <Section title="Fitness goal" description="This decides which calorie target you follow.">
            <GoalPicker value={values.goal} onChange={(v) => setField('goal', v)} error={errors.goal} disabled={submitting} />
          </Section>

          {submitError && <ErrorMessage title="Couldn’t save your details" message={submitError} />}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            loadingText="Saving your details…"
            leftIcon={<Calculator className="h-5 w-5" />}
            className="sm:w-auto"
          >
            Calculate my calories
          </Button>
        </form>
      </main>
    </div>
  );
}
