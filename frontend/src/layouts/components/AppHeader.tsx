import { Link } from 'react-router-dom';
import { GlobalSearch } from '../../components/navigation/GlobalSearch';
import { HelpFab } from '../../components/navigation/HelpFab';
import { UserMenu } from './UserMenu';

export interface AppHeaderProps {
  title?: string;
  onMenuToggle?: () => void;
}

export function AppHeader({ title = 'CharityChain', onMenuToggle }: AppHeaderProps) {
  return (
    <header className="app-header">
      <Link className="app-header__brand" to="/">
        CharityChain
      </Link>
      {onMenuToggle && (
        <button
          type="button"
          className="app-header__menu"
          onClick={onMenuToggle}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      )}
      <h1 className="app-header__title">{title}</h1>
      <div className="app-header__utilities">
        <GlobalSearch />
      </div>
      <UserMenu />
      <HelpFab />
    </header>
  );
}
