import { NavLink } from 'react-router-dom';
import type { NavItem } from '../navigation';

export function MobileNavigation({ items }: { items: readonly NavItem[] }) {
  return (
    <nav className="mobile-navigation" aria-label="Mobile navigation">
      {items.slice(0, 5).map((item) => (
        <NavLink key={item.to} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
