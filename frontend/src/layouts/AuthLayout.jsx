import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import { GlobalSearch } from '../components/navigation/GlobalSearch.jsx';
import { HelpFab } from '../components/navigation/HelpFab.jsx';

// Account access is a focused task: minimal chrome, no marketing navigation or footer.
export function AuthLayout() {
  return (
    <div className="cc-authlayout">
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
            <ThemeToggle />
            <Link className="cc-btn cc-btn--ghost cc-btn--sm" to="/">
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="cc-hide-xs">Back to home</span>
              <span className="cc-show-xs">Home</span>
            </Link>
          </div>
        </div>
      </header>
      <div className="cc-authlayout__body">
        <Outlet />
      </div>
      <HelpFab />
    </div>
  );
}
