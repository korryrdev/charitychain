import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LanguageToggle } from '../components/LanguageToggle';
import { SkipLink } from '../components/SkipLink';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { GlobalSearch } from '../components/navigation/GlobalSearch';
import { HelpFab } from '../components/navigation/HelpFab';

// Account access is a focused task: minimal chrome, no marketing navigation or footer.
export function AuthLayout() {
  return (
    <div className="cc-authlayout">
      <SkipLink targetId="main-content" />
      <header className="cc-authbar">
        <div className="cc-authbar__inner">
          <Link className="cc-brand" to="/">
            <span className="cc-brand__mark" aria-hidden="true">
              C
            </span>
            <span>CharityChain</span>
          </Link>
          <div className="cc-authbar__actions">
            <GlobalSearch />
            <LanguageToggle />
            <ThemeToggle />
            <Link className="cc-btn cc-btn--ghost cc-btn--sm" to="/">
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="cc-hide-xs">Back to home</span>
              <span className="cc-show-xs">Home</span>
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="cc-authlayout__body">
        <Outlet />
      </main>
      <HelpFab />
    </div>
  );
}
