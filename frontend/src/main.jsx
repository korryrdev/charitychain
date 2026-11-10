import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers.jsx';
import { ErrorBoundary } from './app/ErrorBoundary.jsx';
import { StartupGate } from './app/StartupGate.jsx';
import { AppRouter } from './app/router.jsx';
import './assets/styles/global.css';
import './assets/styles/public.css';
import './assets/styles/homepage-refresh.css';
import './assets/styles/public-pages.css';
import './assets/styles/section9.css';
import './assets/styles/donor.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <BrowserRouter><StartupGate><AppRouter /></StartupGate></BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>
);
