import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  GraduationCap,
  HandHeart,
  Mail,
  Package,
  Scale,
  SearchCheck,
  Settings,
  ShieldAlert,
  TriangleAlert,
  Users
} from 'lucide-react';
import { SearchEmpty } from '../../components/feedback/SearchEmpty.jsx';
import { SearchInput } from '../../components/forms/SearchInput.jsx';
import { Accordion } from '../../components/ui/Accordion.jsx';
import { HELP_GUIDES, TROUBLESHOOTING_ITEMS } from '../../features/help/helpData.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const ROLE_META = {
  STUDENT: { icon: GraduationCap, promise: 'Apply for aid and collect goods' },
  DONOR: { icon: HandHeart, promise: 'Give and follow your impact' },
  CLERK: { icon: Package, promise: 'Receive, inspect and release goods' },
  COMMITTEE: { icon: Users, promise: 'Review cases fairly' },
  FINANCE: { icon: Banknote, promise: 'Pay out and reconcile' },
  AUDITOR: { icon: SearchCheck, promise: 'Investigate and verify' },
  ADMIN: { icon: Settings, promise: 'Manage roles and policy' }
};

const ESCALATION = [
  { to: '/complaints', title: 'Complaints & appeals', text: 'Ask for a decision to be reviewed.', icon: Scale },
  { to: '/report-fraud', title: 'Report fraud', text: 'Flag something that looks wrong.', icon: ShieldAlert },
  { to: '/contact', title: 'Contact support', text: 'Reach the right team directly.', icon: Mail }
];

export function HelpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeRole = searchParams.get('role') ?? 'ALL';
  const query = searchParams.get('q') ?? '';
  const normalizedQuery = useDebounce(query, 150).trim();
  const needle = normalizedQuery.toLowerCase();

  const updateParam = (key, value, defaultValue = '') => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== defaultValue) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const guides = useMemo(
    () =>
      HELP_GUIDES.filter((guide) => {
        const matchesRole = activeRole === 'ALL' || guide.id === activeRole;
        const matchesQuery =
          !needle ||
          `${guide.roleLabel} ${guide.title} ${guide.summary} ${guide.steps.join(' ')}`.toLowerCase().includes(needle);
        return matchesRole && matchesQuery;
      }),
    [activeRole, needle]
  );

  const troubleshooting = useMemo(
    () =>
      TROUBLESHOOTING_ITEMS.filter(
        (item) => !needle || `${item.title} ${item.body}`.toLowerCase().includes(needle)
      ).map((item) => ({ id: item.id, title: item.title, body: item.body, icon: TriangleAlert })),
    [needle]
  );

  return (
    <div className="cc-page">
      <section className="cc-hero">
        <div className="cc-container">
          <p className="cc-eyebrow">Help center and user guides</p>
          <h1 className="cc-hero__title">How to use CharityChain.</h1>
          <p className="cc-hero__lead">
            Pick your role for a short, step-by-step guide, or search for a task, workflow or problem.
          </p>
          <SearchInput
            id="help-search"
            label="Search help guides"
            size="lg"
            value={query}
            onChange={(value) => updateParam('q', value)}
            placeholder="Search guides, workflows or troubleshooting…"
          />
        </div>
      </section>

      <div className="cc-container cc-page__body">
        <section aria-labelledby="help-roles">
          <div className="cc-section-head">
            <h2 id="help-roles" className="cc-section-title">
              I am a…
            </h2>
            {activeRole !== 'ALL' && (
              <button type="button" className="cc-textlink" onClick={() => updateParam('role', 'ALL', 'ALL')}>
                Show all roles
              </button>
            )}
          </div>
          <div className="cc-roles" role="group" aria-label="Choose a role">
            {HELP_GUIDES.map((guide) => {
              const meta = ROLE_META[guide.id];
              const Icon = meta.icon;
              const active = activeRole === guide.id;
              return (
                <button
                  key={guide.id}
                  type="button"
                  className={`cc-role${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  aria-label={guide.roleLabel}
                  aria-describedby={`role-promise-${guide.id}`}
                  onClick={() => updateParam('role', active ? 'ALL' : guide.id, 'ALL')}
                >
                  <span className="cc-role__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className="cc-role__label" aria-hidden="true">
                    {guide.roleLabel}
                  </span>
                  <span className="cc-role__promise" id={`role-promise-${guide.id}`}>
                    {meta.promise}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="help-guides-heading">
          <h2 id="help-guides-heading" className="cc-section-title">
            Step-by-step guides
          </h2>
          {guides.length > 0 ? (
            <div className="cc-guides">
              {guides.map((guide) => {
                const Icon = ROLE_META[guide.id].icon;
                return (
                  <article key={guide.id} className="cc-guide">
                    <header className="cc-guide__head">
                      <span className="cc-guide__icon" aria-hidden="true">
                        <Icon size={22} strokeWidth={1.75} />
                      </span>
                      <div>
                        <p className="cc-eyebrow">{guide.roleLabel}</p>
                        <h3 className="cc-guide__title">{guide.title}</h3>
                      </div>
                    </header>
                    <p className="cc-guide__summary">{guide.summary}</p>
                    <ol className="cc-stepper">
                      {guide.steps.map((step, index) => (
                        <li key={step}>
                          <span className="cc-stepper__node" aria-hidden="true">
                            {index + 1}
                          </span>
                          <span className="cc-stepper__text">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <Link className="cc-btn cc-btn--secondary cc-btn--sm cc-guide__cta" to={guide.primaryRoute}>
                      Open {guide.roleLabel} portal
                      <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <SearchEmpty
              title="No guides match your search"
              hint="Try a different word or choose another role."
              clearLabel="Reset filters"
              onClear={() => setSearchParams(new URLSearchParams(), { replace: true })}
            />
          )}
        </section>

        <section aria-labelledby="help-troubleshooting-heading">
          <h2 id="help-troubleshooting-heading" className="cc-section-title">
            Common problems
          </h2>
          {troubleshooting.length > 0 ? (
            <Accordion
              key={normalizedQuery ? 'search' : 'browse'}
              items={troubleshooting}
              defaultOpenAll={Boolean(normalizedQuery)}
              query={normalizedQuery}
            />
          ) : (
            <p className="cc-muted">No troubleshooting items match your search.</p>
          )}
        </section>

        <section aria-labelledby="help-escalation">
          <h2 id="help-escalation" className="cc-section-title">
            Still stuck?
          </h2>
          <div className="cc-escalation">
            {ESCALATION.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="cc-escalation__card">
                  <span className="cc-topic__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className="cc-topic__title">{item.title}</span>
                  <span className="cc-topic__text">{item.text}</span>
                  <ArrowRight className="cc-escalation__arrow" size={18} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
