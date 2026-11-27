import { Link } from 'react-router-dom';
import { GraduationCap, HandHeart } from 'lucide-react';

export interface AuthPortalNavProps {
  mode: 'login' | 'register';
  active: 'donor' | 'student';
}

export function AuthPortalNav({ mode, active }: AuthPortalNavProps) {
  const donorTo = mode === 'login' ? '/auth/login' : '/auth/register';
  const studentTo = mode === 'login' ? '/student/auth/login' : '/student/auth/register';
  const label = mode === 'login' ? 'Choose sign-in portal' : 'Choose registration portal';

  return (
    <nav className="cc-portal-switch" aria-label={label}>
      <Link
        to={donorTo}
        className={`cc-portal-switch__link${active === 'donor' ? ' is-active' : ''}`}
        aria-current={active === 'donor' ? 'page' : undefined}
      >
        <HandHeart size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>Donor</span>
      </Link>
      <Link
        to={studentTo}
        className={`cc-portal-switch__link${active === 'student' ? ' is-active' : ''}`}
        aria-current={active === 'student' ? 'page' : undefined}
      >
        <GraduationCap size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>Student</span>
      </Link>
    </nav>
  );
}
