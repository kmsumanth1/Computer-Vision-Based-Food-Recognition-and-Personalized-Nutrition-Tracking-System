import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthTabs from '../components/auth/AuthTabs';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import PasswordField from '../components/common/PasswordField';
import TextField from '../components/common/TextField';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';
import { isValidEmail } from '../utils/validation';

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      navigate(user.profile_completed ? (from ?? '/dashboard') : '/setup', { replace: true });
    } catch (error) {
      setSubmitError(parseApiError(error, 'We couldn’t log you in. Please try again.').message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      tabs={<AuthTabs />}
      title="Welcome back"
      subtitle="Log in to see today’s meals and targets."
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/signup" className="font-semibold text-pine-700 hover:underline">
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && <ErrorMessage title="Login failed" message={submitError} />}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-semibold text-pine-700 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" fullWidth loading={submitting} loadingText="Logging in…">
          Login
        </Button>
      </form>
    </AuthLayout>
  );
}
