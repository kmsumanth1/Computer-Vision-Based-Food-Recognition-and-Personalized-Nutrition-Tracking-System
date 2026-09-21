import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';

/** Sidebar (tablet and up), drawer (phones) and the page area. */
export default function AppShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(!isDesktop);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tablets start collapsed, desktops start expanded.
  useEffect(() => setCollapsed(!isDesktop), [isDesktop]);

  function handleLogout() {
    setDrawerOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow-pop"
      >
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onLogout={handleLogout} />
      <MobileNav open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenMenu={() => setDrawerOpen(true)}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
