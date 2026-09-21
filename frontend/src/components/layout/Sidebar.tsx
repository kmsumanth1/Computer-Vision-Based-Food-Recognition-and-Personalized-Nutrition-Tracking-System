import Logo, { LogoMark } from '../common/Logo';
import { cn } from '../../utils/cn';
import NavLinks from './NavLinks';
import LogoutButton from './LogoutButton';

interface SidebarProps {
  collapsed: boolean;
  onLogout: () => void;
}

/** Desktop and tablet navigation. Logout sits at the bottom-left. */
export default function Sidebar({ collapsed, onLogout }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col bg-pine-900 py-5 transition-[width] duration-200 md:flex',
        collapsed ? 'w-[76px] px-3' : 'w-64 px-4',
      )}
    >
      <div className={cn('mb-8 flex items-center', collapsed ? 'justify-center' : 'px-1')}>
        {collapsed ? <LogoMark /> : <Logo tone="dark" />}
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavLinks collapsed={collapsed} />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <LogoutButton onLogout={onLogout} collapsed={collapsed} />
      </div>
    </aside>
  );
}
