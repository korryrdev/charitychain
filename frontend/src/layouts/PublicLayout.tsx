import { useState, useSyncExternalStore } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTranslation } from '../app/i18n/I18nContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { SkipLink } from '../components/SkipLink';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ContextualHelpDrawer } from '../components/navigation/ContextualHelpDrawer';
import { GlobalSearch } from '../components/navigation/GlobalSearch';
import { defaultAuthorizedPath } from '../features/authorization/permissions';
import { authStore } from '../store/auth.store';
import { HelpMenu } from './components/HelpMenu';
import { MobileMenu } from './components/MobileMenu';

export function PublicLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { ready, session } = useSyncExternalStore(authStore.subscribe, authStore.get);
  const authenticated = Boolean(ready && session);
  const dashboardTo = defaultAuthorizedPath(session);
  const closeMenu = () => setMenuOpen(false);

  const primaryLinks = [
    { to: '/how-it-works', label: t('navHowItWorks') },
    { to: '/transparency', label: t('navDashboard') },
    { to: '/trace', label: t('navTrace') },
    { to: '/track', label: t('navTrack') },
    { to: '/goods', label: t('navGoods') },
  ];
  const helpLinks = [
    { to: '/help', label: t('footerHelp') },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: t('footerContact') },
    { to: '/report-fraud', label: t('footerReportFraud') },
  ];
  const footerGroups = [
    { title: t('footerExplore'), links: [...primaryLinks, { to: '/recognition', label: t('navRecognition') }] },
    {
      title: t('footerSupport'),
      links: [
        { to: '/governance', label: t('footerGovernance') },
        { to: '/faq', label: t('footerFaq') },
        { to: '/help', label: t('footerHelp') },
        { to: '/complaints', label: t('footerComplaints') },
        { to: '/report-fraud', label: t('footerReportFraud') },
        { to: '/contact', label: t('footerContact') },
      ],
    },
    {
      title: t('footerPolicies'),
      links: [
        { to: '/policies', label: t('footerPoliciesLink') },
        { to: '/privacy', label: t('footerPrivacy') },
        { to: '/recognition', label: t('navRecognition') },
      ],
    },
  ];

  return (
    <div className="marketing-shell">
      <SkipLink targetId="main-content" />
      <div className="marketing-banner">
        <span aria-hidden="true">✓</span> {t('bannerVerified')}
      </div>
      <header className="cc-header">
        <div className="cc-header__inner">
          <Link className="cc-brand" to="/" onClick={closeMenu}>
            <span className="cc-brand__mark" aria-hidden="true">
              C
            </span>
            <span>{t('appName')}</span>
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
            <LanguageToggle />
            <span className="cc-hide-sm">
              <ThemeToggle />
            </span>
            {authenticated ? (
              <Link className="cc-btn cc-btn--primary cc-btn--sm cc-hide-sm" to={dashboardTo}>
                {t('navMyDashboard')}
              </Link>
            ) : (
              <>
                <Link className="cc-btn cc-btn--secondary cc-btn--sm cc-hide-sm" to="/auth/login">
                  {t('navSignIn')}
                </Link>
                <Link className="cc-btn cc-btn--primary cc-btn--sm cc-hide-sm" to="/auth/register">
                  {t('navGiveSupport')} <span aria-hidden="true">→</span>
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

      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="marketing-footer">
        <div className="marketing-footer__inner">
          <section className="marketing-footer__intro">
            <Link className="marketing-brand" to="/">
              <span className="marketing-brand__mark" aria-hidden="true">
                C
              </span>
              <span>{t('appName')}</span>
            </Link>
            <p>{t('footerTagline')}</p>
            <p className="marketing-footer__note">{t('footerPaymentNote')}</p>
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
          <span>© {new Date().getFullYear()} {t('appName')}</span>
          <span>{t('footerBuiltFor')}</span>
        </div>
      </footer>
    </div>
  );
}
