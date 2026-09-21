import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import Button, { buttonClasses } from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import TextField from '../components/common/TextField';
import { authService } from '../services/auth';
import { parseApiError } from '../utils/apiError';
import { isValidEmail } from '../utils/validation';

const DEFAULT_SUCCESS = 'Password reset instructions have been sent to your email.';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!isValidEmail(email)) {
      setFieldError('Enter the email you signed up with.');
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setSuccessMessage(response.message || DEFAULT_SUCCESS);
    } catch (error) {
      setSubmitError(parseApiError(error, 'We couldn’t send the reset link. Please try again.').message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we’ll send you a link to choose a new password."
      tabs={
        <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to login
        </Link>
      }
    >
      {successMessage ? (
        <div role="status" className="space-y-5">
          <div className="flex gap-3 rounded-xl border border-pine-200 bg-pine-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-pine-600" aria-hidden />
            <div>
              <p className="font-semibold text-ink">Check your inbox</p>
              <p className="mt-0.5 text-sm text-ink-soft">{successMessage}</p>
            </div>
          </div>
          <Link to="/login" className={buttonClasses('primary', 'lg', true)}>
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && <ErrorMessage title="Couldn’t send the link" message={submitError} />}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />
          <Button type="submit" size="lg" fullWidth loading={submitting} loadingText="Sending…">
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
