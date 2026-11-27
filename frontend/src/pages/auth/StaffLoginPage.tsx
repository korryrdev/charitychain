import { AuthPortalLoginForm } from '../../features/authentication/components/AuthPortalLoginForm';
import { AuthShell } from '../../features/authentication/components/AuthShell';

export function StaffLoginPage() {
  return (
    <AuthShell portal="staff">
      <AuthPortalLoginForm portal="staff" />
    </AuthShell>
  );
}
