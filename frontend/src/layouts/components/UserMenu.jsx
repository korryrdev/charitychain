import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';

export function UserMenu() {
  const { user, authenticated, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate('/auth/login');
  };
  if (!authenticated) {
    return (
      <div className="user-menu">
        <ThemeToggle />
        <Link to="/auth/login">Sign in</Link>
      </div>
    );
  }
  return (
    <div className="user-menu">
      <ThemeToggle />
      <span>{user.name ?? user.email}</span>
      <button type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}
