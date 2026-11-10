import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/authentication/hooks/useAuth.js';
export function UserMenu() { const { user, authenticated, logout } = useAuth(); const navigate = useNavigate(); const signOut = async () => { await logout(); navigate('/auth/login'); }; if (!authenticated) return <Link to="/auth/login">Sign in</Link>; return <div className="user-menu"><span>{user.name ?? user.email}</span><button type="button" onClick={signOut}>Sign out</button></div>; }
