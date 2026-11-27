import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../features/authentication/hooks/useAuth';
import { ThemeToggle } from '../../components/common/ThemeToggle';

const titleCase = (value?: string | null): string =>
  String(value ?? '')
    .replace(/^CUSTOM_/, '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export interface UserMenuProps {
  showThemeToggle?: boolean;
}

export function UserMenu({ showThemeToggle = false }: UserMenuProps) {
  const { user, session, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await logout();
    navigate('/auth/login');
  };

  if (!authenticated || !user) {
    return (
      <div className="user-menu">
        {showThemeToggle && <ThemeToggle />}
        <Link className="cc-btn cc-btn--secondary cc-btn--sm" to="/auth/login">
          Sign in
        </Link>
      </div>
    );
  }

  const displayName = user.name ?? user.email ?? 'Account';
  const role = session?.roles?.[0];

  return (
    <div className="user-menu cc-account" ref={containerRef}>
      {showThemeToggle && <ThemeToggle />}
      <button
        ref={triggerRef}
        type="button"
        className="cc-account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="cc-avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="cc-account-trigger__name">{displayName}</span>
        <ChevronDown
          size={15}
          strokeWidth={1.9}
          className={`cc-account-trigger__chevron${open ? ' is-open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={menuId} role="menu" className="cc-account-menu">
          <div className="cc-account-menu__header">
            <strong className="cc-account-menu__name">{displayName}</strong>
            {user.email && <span className="cc-account-menu__email">{user.email}</span>}
            {role && (
              <span className="cc-account-menu__role">
                <ShieldCheck size={13} aria-hidden="true" />
                <span>{titleCase(role)}</span>
              </span>
            )}
          </div>
          <div className="cc-account-menu__divider" aria-hidden="true" />
          <button
            type="button"
            role="menuitem"
            className="cc-account-menu__item cc-account-menu__item--danger"
            onClick={signOut}
          >
            <LogOut size={15} strokeWidth={1.85} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
