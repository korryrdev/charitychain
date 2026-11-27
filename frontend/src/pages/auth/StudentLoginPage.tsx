import { AuthPortalLoginForm } from '../../features/authentication/components/AuthPortalLoginForm';
import { AuthShell } from '../../features/authentication/components/AuthShell';

export function StudentLoginPage() {
  return (
    <AuthShell portal="student">
      <AuthPortalLoginForm portal="student" />
    </AuthShell>
  );
}
