import { LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LogoutButtonProps {
  onLogout: () => void;
  collapsed?: boolean;
}

export default function LogoutButton({ onLogout, collapsed = false }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onLogout}
      title={collapsed ? 'Logout' : undefined}
      aria-label={collapsed ? 'Logout' : undefined}
      className={cn(
        'flex h-11 w-full items-center gap-3 rounded-xl text-[15px] font-medium text-white/65 transition-colors hover:bg-white/5 hover:text-white',
        collapsed ? 'justify-center' : 'px-3',
      )}
    >
      <LogOut className="h-5 w-5 shrink-0" aria-hidden />
      {!collapsed && 'Logout'}
    </button>
  );
}
