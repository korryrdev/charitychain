import { useState, useSyncExternalStore } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle.jsx';
import { ContextualHelpDrawer } from '../components/navigation/ContextualHelpDrawer.jsx';
import { GlobalSearch } from '../components/navigation/GlobalSearch.jsx';
import { defaultAuthorizedPath } from '../features/authorization/permissions.js';
import { authStore } from '../store/auth.store.js';
import { HelpMenu } from './components/HelpMenu.jsx';
import { MobileMenu } from './components/MobileMenu.jsx';

const primaryLinks = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/transparency', label: 'Transparency' },
  { to: '/track', label: 'Track donation' },
  { to: '/goods', label: 'Goods' }
];
const helpLinks = [
  { to: '/help', label: 'Help center' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact support' },
  { to: '/report-fraud', label: 'Report fraud' }
];
const footerGroups = [
  { title: 'Explore', links: [...primaryLinks, { to: '/recognition', label: 'Donor recognition' }] },
  {
    title: 'Support',
    links: [
      { to: '/governance', label: 'Governance' },
      { to: '/faq', label: 'Frequently asked questions' },
      { to: '/help', label: 'Help center & guides' },
      { to: '/complaints', label: 'Complaints and appeals' },
      { to: '/report-fraud', label: 'Report fraud' },
      { to: '/contact', label: 'Contact and support' }
    ]
  },
  {
    title: 'Policies',
    links: [
      { to: '/policies', label: 'Policies' },
      { to: '/privacy', label: 'Privacy notice' },
      { to: '/recognition', label: 'Donor recognition' }
    ]
  }
];

export function PublicLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { ready, session } = useSyncExternalStore(authStore.subscribe, authStore.get);
  const authenticated = Boolean(ready && session);
  const dashboardTo = defaultAuthorizedPath(session);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="marketing-shell">
      <div className="marketing-banner">
        <span aria-hidden="true">✓</span> Public figures are published only after confirmation and reconciliation.
      </div>
      <header className="cc-header">
        <div className="cc-header__inner">
          <Link className="cc-brand" to="/" onClick={closeMenu}>
            <span className="cc-brand__mark" aria-hidden="true">
              C
            </span>
            <span>CharityChain</span>
          </Link>

          <nav className="cc-nav" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="cc-nav__link">
                {link.label}
              </NavLink>
            ))}
            <HelpMenu onOpenScreenHelp={() => setHelpOpen(true)} />
          </nav>

          <div className="cc-header__actions">
            <GlobalSearch />
            <span className="cc-hide-sm">
              <ThemeToggle />
            </span>
            {authenticated ? (
              <Link className="cc-btn cc-btn--primary cc-btn--sm cc-hide-sm" to={dashboardTo}>
                My dashboard
              </Link>
            ) : (
              <>
                <Link className="cc-btn cc-btn--secondary cc-btn--sm cc-hide-sm" to="/auth/login">
                  Sign in
                </Link>
                <Link className="cc-btn cc-btn--primary cc-btn--sm cc-hide-sm" to="/auth/register">
                  Give support <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
            <button
              type="button"
              className="cc-icon-btn cc-menu-btn"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        primaryLinks={primaryLinks}
        helpLinks={helpLinks}
        onOpenScreenHelp={() => setHelpOpen(true)}
        authenticated={authenticated}
        dashboardTo={dashboardTo}
      />
      <ContextualHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} pathname={pathname} />

      <main>
        <Outlet />
      </main>
      <footer className="marketing-footer">
        <div className="marketing-footer__inner">
          <section className="marketing-footer__intro">
            <Link className="marketing-brand" to="/">
              <span className="marketing-brand__mark" aria-hidden="true">
                C
              </span>
              <span>CharityChain</span>
            </Link>
            <p>Transparent, accountable university support for students and staff.</p>
            <p className="marketing-footer__note">
              Payments are handled through M-Pesa, Paybill, and banks. Public reporting is reconciled and privacy-safe.
            </p>
          </section>
          {footerGroups.map((group) => (
            <section key={group.title}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.to}`}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="marketing-footer__base">
          <span>© {new Date().getFullYear()} CharityChain</span>
          <span>Built for accountable support.</span>
        </div>
      </footer>
    </div>
  );
}
