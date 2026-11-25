import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../features/authentication/hooks/useSession.js';
import { NAVIGATION, allowedNavigation } from './navigation.js';
import { AppHeader } from './components/AppHeader.jsx';
import { AppSidebar } from './components/AppSidebar.jsx';
import { MobileNavigation } from './components/MobileNavigation.jsx';
export function CommunityLayout() {
  const { session } = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const area = pathname.startsWith('/admin') ? 'administration'
    : pathname.startsWith('/student') ? 'student'
      : pathname.startsWith('/clerk') || pathname.startsWith('/finance') || pathname.startsWith('/inventory') ? 'operations'
        : pathname.startsWith('/committee') || pathname.startsWith('/auditor') ? 'governance'
          : 'community';
  const titles = { administration: 'Super administration', student: 'Student portal', operations: 'Operations portal', governance: 'Governance portal', community: 'Donor portal' };
  const items = allowedNavigation(NAVIGATION[area], session);
  return <div className="portal-layout"><AppHeader title={titles[area]} onMenuToggle={() => setOpen(!open)} /><AppSidebar items={items} open={open} onNavigate={() => setOpen(false)} /><main className="portal-layout__content"><Outlet /></main><MobileNavigation items={items} /></div>;
}
