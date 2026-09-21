import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import AuthTabs from '../components/auth/AuthTabs';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import PasswordField from '../components/common/PasswordField';
import TextField from '../components/common/TextField';
import { useAuth } from '../context/AuthContext';
import { parseApiError } from '../utils/apiError';
import { isValidEmail } from '../utils/validation';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'The passwords don’t match.';
    setErrors(next);
    setSubmitError(null);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/setup', { replace: true });
    } catch (error) {
      setSubmitError(parseApiError(error, 'We couldn’t create your account. Please try again.').message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      tabs={<AuthTabs />}
      title="Create your account"
      subtitle="Next, you’ll tell us a bit about yourself so we can set your calorie plan."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-pine-700 hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {submitError && (
          <ErrorMessage
            title="Sign up failed"
            message={submitError}
            action={
              <Link to="/login" className="text-sm font-semibold text-pine-700 hover:underline">
                Go to login
              </Link>
            }
          />
        )}
        <TextField
          label="Name"
          autoComplete="name"
          placeholder="Your name"
          leftIcon={<User className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" size="lg" fullWidth loading={submitting} loadingText="Creating your account…">
          Sign Up
        </Button>
      </form>
    </AuthLayout>
  );
}
