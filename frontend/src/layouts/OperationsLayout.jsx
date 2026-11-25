import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSession } from '../features/authentication/hooks/useSession.js';
import { NAVIGATION, allowedNavigation } from './navigation.js';
import { AppHeader } from './components/AppHeader.jsx';
import { AppSidebar } from './components/AppSidebar.jsx';
import { Breadcrumbs } from './components/Breadcrumbs.jsx';
import { MobileNavigation } from './components/MobileNavigation.jsx';
export function OperationsLayout() { const { session } = useSession(); const [open, setOpen] = useState(false); const items = allowedNavigation(NAVIGATION.operations, session); return <div className="portal-layout"><AppHeader title="Operations portal" onMenuToggle={() => setOpen(!open)} /><AppSidebar items={items} open={open} onNavigate={() => setOpen(false)} /><main className="portal-layout__content"><Breadcrumbs /><Outlet /></main><MobileNavigation items={items} /></div>; }
