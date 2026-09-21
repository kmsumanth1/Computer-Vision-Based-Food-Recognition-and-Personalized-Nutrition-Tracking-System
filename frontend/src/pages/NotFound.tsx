import { Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { buttonClasses } from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <Logo />
      <h1 className="mt-10 text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink-mute">The page you’re looking for doesn’t exist or has moved.</p>
      <Link to="/dashboard" className={`${buttonClasses('primary', 'lg')} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
