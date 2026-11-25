import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './assets/styles/tokens.css';
import './assets/styles/global.css';
import './assets/styles/public.css';
import './assets/styles/homepage-refresh.css';
import './assets/styles/public-pages.css';
import './assets/styles/section9.css';
import './assets/styles/donor.css';
import './assets/styles/donor-refresh.css';
import './assets/styles/donation-refinement.css';
import './assets/styles/donation-history.css';
import './assets/styles/donation-detail.css';
import './assets/styles/donation-detail-minimal.css';
import './assets/styles/donor-settings.css';
import './assets/styles/donor-dashboard.css';
import './assets/styles/donor-amber-accents.css';
import './assets/styles/student-refresh.css';
import './assets/styles/student-auth.css';
import './assets/styles/sidebar-icons.css';
import './assets/styles/student-support.css';
import './assets/styles/physical-donations.css';
import './assets/styles/physical-donations-refinement.css';
import './assets/styles/student-vetting.css';
import './assets/styles/goods-collection.css';
import './assets/styles/clerk.css';
import './assets/styles/committee.css';
import './assets/styles/finance.css';
import './assets/styles/auditor.css';
import './assets/styles/admin.css';
import './assets/styles/access-workspace.css';
import './assets/styles/ui.css';
import './index.css';
import { AppProviders } from './app/providers.jsx';
import { ErrorBoundary } from './app/ErrorBoundary.jsx';
import { StartupGate } from './app/StartupGate.jsx';
import { AppRouter } from './app/router.jsx';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <StartupGate>
            <AppRouter />
          </StartupGate>
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>
);
