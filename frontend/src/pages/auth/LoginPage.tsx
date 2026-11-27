import { AuthPortalLoginForm } from '../../features/authentication/components/AuthPortalLoginForm';
import { AuthShell } from '../../features/authentication/components/AuthShell';

export function LoginPage() {
  return (
    <AuthShell portal="donor">
      <AuthPortalLoginForm portal="donor" />
    </AuthShell>
  );
}
