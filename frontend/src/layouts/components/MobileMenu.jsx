import { useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LifeBuoy, Search, X } from 'lucide-react';
import { OPEN_SEARCH_EVENT } from '../../components/navigation/GlobalSearch.jsx';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';
import { useOverlay } from '../../hooks/useOverlay.js';

/** Full-height navigation sheet for small screens. */
export function MobileMenu({ open, onClose, primaryLinks, helpLinks, onOpenScreenHelp }) {
  const panelRef = useRef(null);
  useOverlay(panelRef, open, onClose);
  if (!open) return null;

  const openSearch = () => {
    onClose();
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
  };

  return (
    <div className="cc-sheet" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
      <div className="cc-sheet__top">
        <Link className="cc-brand" to="/" onClick={onClose}>
          <span className="cc-brand__mark" aria-hidden="true">
            C
          </span>
          <span>CharityChain</span>
        </Link>
        <button type="button" className="cc-icon-btn" aria-label="Close menu" data-autofocus onClick={onClose}>
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="cc-sheet__body">
        <button type="button" className="cc-sheet__search" onClick={openSearch}>
          <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          Search pages, FAQs and guides
        </button>

        <nav aria-label="Mobile navigation">
          <p className="cc-sheet__label">Explore</p>
          <ul className="cc-sheet__list">
            {primaryLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} onClick={onClose}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <p className="cc-sheet__label">Help</p>
          <ul className="cc-sheet__list">
            {helpLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} onClick={onClose}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="cc-sheet__action"
                onClick={() => {
                  onClose();
                  onOpenScreenHelp?.();
                }}
              >
                <LifeBuoy size={18} strokeWidth={1.75} aria-hidden="true" />
                Help for this screen
              </button>
            </li>
          </ul>
        </nav>

        <div className="cc-sheet__theme">
          <span>Appearance</span>
          <ThemeToggle showLabel />
        </div>
      </div>

      <div className="cc-sheet__footer">
        <Link className="cc-btn cc-btn--secondary cc-btn--lg" to="/auth/login" onClick={onClose}>
          Sign in
        </Link>
        <Link className="cc-btn cc-btn--primary cc-btn--lg" to="/auth/register" onClick={onClose}>
          Give support
        </Link>
      </div>
    </div>
  );
}
