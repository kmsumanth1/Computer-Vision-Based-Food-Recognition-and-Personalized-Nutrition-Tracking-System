import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { LogoMark } from '../common/Logo';
import { NAV_ITEMS } from '../../constants/nav';
import { initialsOf } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMenu: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ onOpenMenu, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.to));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Phones: open the drawer */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="-ml-2 rounded-lg p-2 text-ink-soft hover:bg-pine-50 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      <LogoMark className="h-8 w-8 md:hidden" />

      {/* Tablet and up: collapse or expand the sidebar */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="-ml-2 hidden rounded-lg p-2 text-ink-mute hover:bg-pine-50 hover:text-ink md:block"
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>

      <p className="font-display text-lg font-semibold text-ink">{current?.label ?? ''}</p>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm font-medium text-ink-soft sm:inline">{user?.name}</span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-600 text-sm font-semibold text-white"
          aria-hidden
        >
          {initialsOf(user?.name ?? '')}
        </span>
      </div>
    </header>
  );
}
