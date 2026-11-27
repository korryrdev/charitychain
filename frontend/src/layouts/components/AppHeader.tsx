import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { LanguageToggle } from '../../components/LanguageToggle';
import { GlobalSearch } from '../../components/navigation/GlobalSearch';
import { UserMenu } from './UserMenu';

export interface AppHeaderProps {
  title?: string;
  onMenuToggle?: () => void;
}

export function AppHeader({ title = 'CharityChain', onMenuToggle }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        {onMenuToggle && (
          <button
            type="button"
            className="cc-icon-btn app-header__menu"
            onClick={onMenuToggle}
            aria-label="Toggle navigation"
          >
            <Menu size={18} strokeWidth={1.9} aria-hidden="true" />
          </button>
        )}
        <Link className="cc-brand app-header__brand" to="/">
          <span className="cc-brand__mark" aria-hidden="true">
            C
          </span>
          <span>CharityChain</span>
        </Link>
        {title && title !== 'CharityChain' && (
          <>
            <span className="app-header__sep" aria-hidden="true">
              /
            </span>
            <span className="app-header__workspace">{title}</span>
          </>
        )}
      </div>

      <div className="app-header__right">
        <div className="app-header__utilities">
          <GlobalSearch />
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <span className="app-header__divider" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  );
}
