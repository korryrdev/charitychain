import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, CircleHelp, LifeBuoy, Mail, ShieldAlert } from 'lucide-react';

const ITEMS = [
  { to: '/help', label: 'Help center', description: 'Step-by-step guides for every role', icon: BookOpen },
  { to: '/faq', label: 'FAQ', description: 'Short answers in plain language', icon: CircleHelp },
  { to: '/contact', label: 'Contact support', description: 'Talk to the right team', icon: Mail },
  { to: '/report-fraud', label: 'Report fraud', description: 'Flag something that looks wrong', icon: ShieldAlert }
];

/** Public-header "Help" dropdown: one entry point instead of several header items. */
export function HelpMenu({ onOpenScreenHelp }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="cc-dropdown" ref={rootRef}>
      <button
        type="button"
        className="cc-nav__link cc-dropdown__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Help
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className="cc-dropdown__chevron" />
      </button>
      {open && (
        <div className="cc-dropdown__menu" role="menu" aria-label="Help">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} role="menuitem" className="cc-dropdown__item" onClick={() => setOpen(false)}>
                <span className="cc-dropdown__icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span>
                  <span className="cc-dropdown__label">{item.label}</span>
                  <span className="cc-dropdown__desc">{item.description}</span>
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            role="menuitem"
            className="cc-dropdown__item cc-dropdown__item--accent"
            onClick={() => {
              setOpen(false);
              onOpenScreenHelp?.();
            }}
          >
            <span className="cc-dropdown__icon" aria-hidden="true">
              <LifeBuoy size={18} strokeWidth={1.75} />
            </span>
            <span>
              <span className="cc-dropdown__label">Help for this screen</span>
              <span className="cc-dropdown__desc">Tips for the page you are on</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
