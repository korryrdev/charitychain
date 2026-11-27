import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from '../app/i18n/I18nContext';
import { SkipLink } from '../components/SkipLink';
import { HelpFab } from '../components/navigation/HelpFab';
import { useSession } from '../features/authentication/hooks/useSession';
import { NAVIGATION, allowedNavigation } from './navigation';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { MobileNavigation } from './components/MobileNavigation';

export function CommunityLayout() {
  const { t } = useTranslation();
  const { session } = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const area = pathname.startsWith('/admin')
    ? 'administration'
    : pathname.startsWith('/student')
      ? 'student'
      : pathname.startsWith('/clerk') || pathname.startsWith('/finance') || pathname.startsWith('/inventory')
        ? 'operations'
        : pathname.startsWith('/committee') || pathname.startsWith('/auditor')
          ? 'governance'
          : 'community';

  const titles = {
    administration: t('portalAdmin'),
    student: t('portalStudent'),
    operations: t('portalOperations'),
    governance: t('portalGovernance'),
    community: t('portalDonor'),
  };

  const items = allowedNavigation(NAVIGATION[area], session);

  return (
    <div className="portal-layout">
      <SkipLink targetId="main-content" />
      <AppHeader title={titles[area]} onMenuToggle={() => setOpen(!open)} />
      <AppSidebar items={items} open={open} onNavigate={() => setOpen(false)} />
      <main id="main-content" tabIndex={-1} className="portal-layout__content">
        <Outlet />
      </main>
      <MobileNavigation items={items} />
      <HelpFab />
    </div>
  );
}
