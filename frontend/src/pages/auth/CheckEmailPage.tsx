import { AuthShell } from '../../features/authentication/components/AuthShell';
import { CheckEmailView } from '../../features/authentication/components/CheckEmailView';

export function DonorCheckEmailPage() {
  return (
    <AuthShell portal="donor">
      <CheckEmailView portal="donor" />
    </AuthShell>
  );
}

export function StudentCheckEmailPage() {
  return (
    <AuthShell portal="student">
      <CheckEmailView portal="student" />
    </AuthShell>
  );
}
