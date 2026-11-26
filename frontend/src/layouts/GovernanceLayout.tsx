import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSession } from '../features/authentication/hooks/useSession';
import { NAVIGATION, allowedNavigation } from './navigation';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { MobileNavigation } from './components/MobileNavigation';
export function GovernanceLayout() { const { session } = useSession(); const [open, setOpen] = useState(false); const items = allowedNavigation(NAVIGATION.governance, session); return <div className="portal-layout"><AppHeader title="Governance portal" onMenuToggle={() => setOpen(!open)} /><AppSidebar items={items} open={open} onNavigate={() => setOpen(false)} /><main className="portal-layout__content"><Breadcrumbs /><Outlet /></main><MobileNavigation items={items} /></div>; }
