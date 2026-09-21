import { History, LayoutDashboard, ScanLine, User, UtensilsCrossed, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/food-analysis', label: 'Food Analysis', icon: ScanLine },
  { to: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
];
