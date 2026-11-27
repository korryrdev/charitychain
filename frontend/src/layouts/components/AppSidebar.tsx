import { NavLink } from 'react-router-dom';
import type { NavItem } from '../navigation';

export interface AppSidebarProps {
  items: readonly NavItem[];
  open?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ items, open = true, onNavigate }: AppSidebarProps) {
  return (
    <aside className={`app-sidebar${open ? ' app-sidebar--open' : ''}`} aria-label="Portal navigation">
      <nav>
        <ul>
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.icon && <i className={`fa-solid ${item.icon}`} aria-hidden="true" />}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
