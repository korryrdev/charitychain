import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu.jsx';
export function AppHeader({ title = 'CharityChain', onMenuToggle }) { return <header className="app-header"><Link className="app-header__brand" to="/">CharityChain</Link>{onMenuToggle && <button type="button" className="app-header__menu" onClick={onMenuToggle} aria-label="Toggle navigation">Menu</button>}<h1 className="app-header__title">{title}</h1><UserMenu /></header>; }
