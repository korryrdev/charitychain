import { PublicLayout } from './PublicLayout.jsx';

// Account access is part of the public journey, so it uses the same navigation
// and footer as the rest of the public site.
export function AuthLayout() { return <PublicLayout />; }
