import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';

const titleCase = (value) =>
  String(value ?? '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export function UserMenu() {
  const { user, session, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate('/auth/login');
  };
  if (!authenticated) {
    return (
      <div className="user-menu">
        <ThemeToggle />
        <Link className="cc-btn cc-btn--secondary cc-btn--sm" to="/auth/login">
          Sign in
        </Link>
      </div>
    );
  }
  const displayName = user.name ?? user.email ?? 'Account';
  const role = session?.roles?.[0];
  return (
    <div className="user-menu">
      <ThemeToggle />
      <span className="cc-avatar" aria-hidden="true">
        {displayName.charAt(0).toUpperCase()}
      </span>
      <span className="cc-user">
        <span className="cc-user__name">{displayName}</span>
        {role && <span className="cc-chip cc-chip--static">{titleCase(role)}</span>}
      </span>
      <button type="button" className="cc-btn cc-btn--ghost cc-btn--sm" onClick={signOut}>
        <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
        <span className="cc-hide-xs">Sign out</span>
      </button>
    </div>
  );
}
