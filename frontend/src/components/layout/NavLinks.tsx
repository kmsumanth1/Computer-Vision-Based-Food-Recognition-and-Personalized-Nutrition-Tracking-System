import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/nav';
import { cn } from '../../utils/cn';

interface NavLinksProps {
  /** Icons only, with the label as a tooltip */
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** The five main destinations. Shared by the sidebar and the mobile drawer. */
export default function NavLinks({ collapsed = false, onNavigate }: NavLinksProps) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'group relative flex h-11 items-center gap-3 rounded-xl text-[15px] font-medium transition-colors',
              collapsed ? 'justify-center px-0' : 'px-3',
              isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-2.5 h-6 w-[3px] rounded-r-full bg-volt transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-volt')} aria-hidden />
              {!collapsed && <span>{label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
