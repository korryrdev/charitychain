import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CircleHelp,
  CornerDownLeft,
  FileText,
  History,
  Receipt,
  Search
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PortalSession } from '@/types';
import { searchEverything } from '../../features/help/helpData';
import { useOverlay } from '../../hooks/useOverlay';
import { authStore } from '../../store/auth.store';
import { Highlight } from '../ui/Highlight';
import { Kbd } from '../ui/Kbd';

export const OPEN_SEARCH_EVENT = 'cc:open-search';

const RECENT_KEY = 'cc.recentSearches';
const QUICK_LINKS = [
  { to: '/track', label: 'Track a donation' },
  { to: '/student', label: 'Apply for aid' },
  { to: '/faq', label: 'FAQ' },
  { to: '/help', label: 'Help center' },
  { to: '/auth/login', label: 'Sign in' }
];

const SHORTCUT_LABEL =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '') ? '⌘K' : 'Ctrl K';

function readRecent() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
  } catch {
    return [];
  }
}

function writeRecent(term: string) {
  const value = term.trim();
  if (!value) return;
  try {
    const next = [value, ...readRecent().filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 4);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); recents are a nicety only.
  }
}

type SearchEntryType = 'tracking' | 'page' | 'faq' | 'guide';

interface SearchEntry {
  key: string;
  type: SearchEntryType;
  title: string;
  subtitle: string;
  run: (nav: NavigateFunction) => void;
}

const TYPE_META: Record<SearchEntryType, { icon: LucideIcon; tag: string; tone: string }> = {
  tracking: { icon: Receipt, tag: 'Donation', tone: 'accent' },
  page: { icon: FileText, tag: 'Page', tone: 'brand' },
  faq: { icon: CircleHelp, tag: 'FAQ', tone: 'info' },
  guide: { icon: BookOpen, tag: 'Guide', tone: 'warning' }
};

export function GlobalSearch({ session: propSession = undefined }: { session?: PortalSession | null }) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [storeSession, setStoreSession] = useState(() => authStore.get().session);

  useEffect(() => authStore.subscribe((state) => setStoreSession(state.session)), []);

  const openPalette = useCallback(() => {
    setQuery('');
    setActive(0);
    setRecent(readRecent());
    setOpen(true);
  }, []);
  const closePalette = useCallback(() => setOpen(false), []);

  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (openRef.current) closePalette();
        else openPalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, openPalette);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, openPalette);
    };
  }, [openPalette, closePalette]);

  useOverlay(panelRef, open, closePalette);

  const activeSession = propSession !== undefined ? propSession : storeSession;
  const trimmed = query.trim();

  const groups = useMemo(() => {
    const results = searchEverything(query, activeSession);
    const toEntry = (type: SearchEntryType, item: any): SearchEntry => {
      if (type === 'tracking') {
        return {
          key: 'tracking',
          type,
          title: `Track receipt ${item}`,
          subtitle: 'Open the private donation lookup',
          run: (nav) => nav('/track', { state: { trackingId: item } })
        };
      }
      if (type === 'page') {
        return { key: `page-${item.to}`, type, title: item.label, subtitle: item.description, run: (nav) => nav(item.to) };
      }
      if (type === 'faq') {
        return {
          key: `faq-${item.id}`,
          type,
          title: item.question,
          subtitle: item.answer,
          run: (nav) => nav(`/faq?q=${encodeURIComponent(item.question)}`)
        };
      }
      return {
        key: `guide-${item.id}`,
        type,
        title: `${item.roleLabel}: ${item.title}`,
        subtitle: item.summary,
        run: (nav) => nav(`/help?role=${encodeURIComponent(item.id)}`)
      };
    };

    const list: { label: string; entries: SearchEntry[] }[] = [];
    if (results.trackingMatch) list.push({ label: 'Donation tracking', entries: [toEntry('tracking', results.trackingMatch)] });
    if (results.pages.length) {
      list.push({ label: trimmed ? 'Pages & screens' : 'Suggested', entries: results.pages.map((item) => toEntry('page', item)) });
    }
    if (trimmed && results.faqs.length) list.push({ label: 'Frequently asked questions', entries: results.faqs.map((item) => toEntry('faq', item)) });
    if (trimmed && results.guides.length) list.push({ label: 'Help guides', entries: results.guides.map((item) => toEntry('guide', item)) });
    return list;
  }, [query, activeSession, trimmed]);

  const entries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);
  const activeIndex = Math.min(active, Math.max(entries.length - 1, 0));
  const activeEntry = entries[activeIndex];

  const choose = (entry: SearchEntry) => {
    writeRecent(trimmed);
    setOpen(false);
    entry.run(navigate);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(entries.length ? (activeIndex + 1) % entries.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(entries.length ? (activeIndex - 1 + entries.length) % entries.length : 0);
    } else if (event.key === 'Enter' && activeEntry) {
      event.preventDefault();
      choose(activeEntry);
    }
  };

  const goQuick = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  let flatIndex = -1;

  return (
    <>
      <button type="button" className="cc-search-trigger" aria-label="Quick search" onClick={openPalette}>
        <Search size={18} strokeWidth={1.75} aria-hidden="true" />
        <span className="cc-search-trigger__text">Search…</span>
        <Kbd className="cc-search-trigger__kbd">{SHORTCUT_LABEL}</Kbd>
      </button>

      {open && (
        <div className="cc-overlay cc-overlay--top" onMouseDown={closePalette}>
          <div
            ref={panelRef}
            className="cc-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cc-palette__input">
              <Search size={20} strokeWidth={1.75} aria-hidden="true" />
              <input
                data-autofocus
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="cc-palette-list"
                aria-activedescendant={activeEntry ? `cc-palette-${activeEntry.key}` : undefined}
                aria-label="Search pages, FAQs, guides, or tracking ID"
                placeholder="Search pages, FAQs, guides, or a receipt code (MAL-…)"
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKeyDown}
              />
              <button type="button" className="cc-palette__esc" aria-label="Close search" onClick={closePalette}>
                Esc
              </button>
            </div>

            <div className="cc-palette__body">
              {!trimmed && (
                <>
                  <div className="cc-palette__quick" aria-label="Quick links">
                    {QUICK_LINKS.map((link) => (
                      <button key={link.to} type="button" className="cc-chip" onClick={() => goQuick(link.to)}>
                        {link.label}
                      </button>
                    ))}
                  </div>
                  {recent.length > 0 && (
                    <section className="cc-palette__group">
                      <h2 className="cc-palette__heading">Recent searches</h2>
                      <div className="cc-palette__recent">
                        {recent.map((term) => (
                          <button
                            key={term}
                            type="button"
                            className="cc-palette__recent-item"
                            onClick={() => {
                              setQuery(term);
                              setActive(0);
                            }}
                          >
                            <History size={16} strokeWidth={1.75} aria-hidden="true" />
                            {term}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              <div id="cc-palette-list" role="listbox" aria-label="Search results">
                {groups.map((group) => (
                  <section className="cc-palette__group" key={group.label}>
                    <h2 className="cc-palette__heading">{group.label}</h2>
                    {group.entries.map((entry) => {
                      flatIndex += 1;
                      const index = flatIndex;
                      const meta = TYPE_META[entry.type];
                      const Icon = meta.icon;
                      const selected = index === activeIndex;
                      return (
                        <div
                          key={entry.key}
                          id={`cc-palette-${entry.key}`}
                          role="option"
                          aria-selected={selected}
                          className={`cc-palette__row${selected ? ' is-active' : ''}`}
                          onMouseMove={() => setActive(index)}
                          onClick={() => choose(entry)}
                        >
                          <span className={`cc-palette__type cc-palette__type--${meta.tone}`} aria-hidden="true">
                            <Icon size={18} strokeWidth={1.75} />
                          </span>
                          <span className="cc-palette__text">
                            <span className="cc-palette__title">
                              {entry.type === 'tracking' ? entry.title : <Highlight text={entry.title} query={trimmed} />}
                            </span>
                            <span className="cc-palette__subtitle">{entry.subtitle}</span>
                          </span>
                          <span className="cc-palette__tag">{meta.tag}</span>
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>

              {trimmed && entries.length === 0 && (
                <div className="cc-palette__empty">
                  <span className="cc-empty__icon" aria-hidden="true">
                    <Search size={24} strokeWidth={1.5} />
                  </span>
                  <p className="cc-empty__title">No results for “{trimmed}”</p>
                  <p className="cc-empty__hint">Try a shorter word, or browse the guides below.</p>
                  <div className="cc-palette__empty-actions">
                    <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={() => goQuick('/faq')}>
                      Browse FAQs
                    </button>
                    <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={() => goQuick('/help')}>
                      Open Help center
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="cc-palette__footer" aria-hidden="true">
              <span>
                <Kbd>
                  <ArrowUp size={12} />
                </Kbd>
                <Kbd>
                  <ArrowDown size={12} />
                </Kbd>
                navigate
              </span>
              <span>
                <Kbd>
                  <CornerDownLeft size={12} />
                </Kbd>
                open
              </span>
              <span>
                <Kbd>esc</Kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
