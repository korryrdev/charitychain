import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers.jsx';
import { ErrorBoundary } from './app/ErrorBoundary.jsx';
import { StartupGate } from './app/StartupGate.jsx';
import { AppRouter } from './app/router.jsx';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './assets/styles/global.css';
import './assets/styles/public.css';
import './assets/styles/homepage-refresh.css';
import './assets/styles/public-pages.css';
import './assets/styles/section9.css';
import './assets/styles/donor.css';
import './assets/styles/student-support.css';
import './assets/styles/physical-donations.css';
import './assets/styles/student-vetting.css';
import './assets/styles/goods-collection.css';
import './assets/styles/clerk.css';
import './assets/styles/committee.css';
import './assets/styles/finance.css';
import './assets/styles/auditor.css';
import './assets/styles/admin.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter><StartupGate><AppRouter /></StartupGate></BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>
);
