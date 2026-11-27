import { Navigate, useLocation } from 'react-router-dom';
import { AuthShell } from '../../features/authentication/components/AuthShell';
import { VerifyEmailView } from '../../features/authentication/components/VerifyEmailView';

export function VerifyAccountPage() {
  return (
    <AuthShell portal="donor">
      <VerifyEmailView portal="donor" />
    </AuthShell>
  );
}

export const DonorVerifyPage = VerifyAccountPage;

export function StudentVerifyPage() {
  return (
    <AuthShell portal="student">
      <VerifyEmailView portal="student" />
    </AuthShell>
  );
}

/** Preserves query parameters when legacy `/auth/verify-account` links are opened. */
export function RedirectVerifyAccount() {
  const location = useLocation();
  return <Navigate to={`/auth/verify${location.search}`} replace />;
}
