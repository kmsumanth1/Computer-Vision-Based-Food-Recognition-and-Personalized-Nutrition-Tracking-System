import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

const TABS = [
  { to: '/login', label: 'Login' },
  { to: '/signup', label: 'Sign Up' },
];

export default function AuthTabs() {
  return (
    <nav aria-label="Account" className="mb-4 flex rounded-xl bg-pine-100/60 p-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          replace
          className={({ isActive }) =>
            cn(
              'flex-1 rounded-lg py-2 text-center text-sm font-semibold transition-colors',
              isActive ? 'bg-white text-pine-800 shadow-sm' : 'text-ink-mute hover:text-ink',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
