import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, GraduationCap, Link2, Receipt, ShieldCheck, type LucideIcon } from 'lucide-react';
import { SearchEmpty } from '../../components/feedback/SearchEmpty';
import { SearchInput } from '../../components/forms/SearchInput';
import { Accordion } from '../../components/ui/Accordion';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../../features/help/helpData';
import { useDebounce } from '../../hooks/useDebounce';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ALL: BookOpen,
  DONORS: Receipt,
  STUDENTS: GraduationCap,
  BLOCKCHAIN: Link2,
  GOVERNANCE: ShieldCheck
};

const POPULAR_TOPICS = [
  { category: 'DONORS', title: 'Tracking a donation', text: 'Look up a gift with your Tracking ID.' },
  { category: 'STUDENTS', title: 'Student sign-in', text: 'The MUST email format and your portal.' },
  { category: 'GOVERNANCE', title: 'Privacy & recognition', text: 'Who sees your name, and how to opt out.' },
  { category: 'BLOCKCHAIN', title: 'Blockchain proof', text: 'What “verified and locked” really means.' }
];

export function FaqPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState('ALL');
  const query = searchParams.get('q') ?? '';
  const normalizedQuery = useDebounce(query, 150).trim();
  const needle = normalizedQuery.toLowerCase();

  const updateQuery = (nextValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextValue) next.set('q', nextValue);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const queryMatches = useMemo(
    () =>
      FAQ_ITEMS.filter(
        (item) => !needle || `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(needle)
      ),
    [needle]
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: queryMatches.length };
    for (const item of queryMatches) result[item.category] = (result[item.category] ?? 0) + 1;
    return result;
  }, [queryMatches]);

  const visible = queryMatches.filter((item) => category === 'ALL' || item.category === category);
  const accordionItems = visible.map((item) => ({
    id: item.id,
    title: item.question,
    body: item.answer,
    icon: CATEGORY_ICONS[item.category]
  }));

  const pickTopic = (topic: string) => {
    setCategory(topic);
    updateQuery('');
    document.getElementById('faq-results')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="cc-page">
      <section className="cc-hero">
        <div className="cc-container">
          <p className="cc-eyebrow">Frequently asked questions</p>
          <h1 className="cc-hero__title">Answers in plain language.</h1>
          <p className="cc-hero__lead">
            How donations, student applications, privacy controls and tamper-evident proof work — without the jargon.
          </p>
          <SearchInput
            id="faq-search"
            label="Search FAQs"
            size="lg"
            value={query}
            onChange={updateQuery}
            placeholder="Try “student email”, “tracking”, or “privacy”…"
          />
        </div>
      </section>

      <div className="cc-container cc-page__body">
        <section aria-labelledby="faq-popular">
          <h2 id="faq-popular" className="cc-section-title">
            Popular topics
          </h2>
          <div className="cc-topics">
            {POPULAR_TOPICS.map((topic) => {
              const Icon = CATEGORY_ICONS[topic.category];
              return (
                <button key={topic.title} type="button" className="cc-topic" onClick={() => pickTopic(topic.category)}>
                  <span className="cc-topic__icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className="cc-topic__title">{topic.title}</span>
                  <span className="cc-topic__text">{topic.text}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="cc-split" id="faq-results">
          <aside className="cc-split__aside" aria-label="FAQ categories">
            <div className="cc-categories" role="group" aria-label="FAQ categories">
              {FAQ_CATEGORIES.map((item) => {
                const Icon = CATEGORY_ICONS[item.id];
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`cc-category${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setCategory(item.id)}
                  >
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    <span className="cc-category__label">{item.label}</span>
                    <span className="cc-count" aria-hidden="true">
                      {counts[item.id] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="cc-split__main" aria-label="Answers">
            <p className="cc-results-meta" role="status" aria-live="polite">
              {visible.length} {visible.length === 1 ? 'answer' : 'answers'}
              {normalizedQuery ? ` for “${normalizedQuery}”` : ''}
            </p>
            {accordionItems.length > 0 ? (
              <Accordion
                key={`${category}-${normalizedQuery ? 'search' : 'browse'}`}
                items={accordionItems}
                defaultOpenAll={Boolean(normalizedQuery)}
                query={normalizedQuery}
              />
            ) : (
              <SearchEmpty
                title="No answers match yet"
                hint="Try a different word, pick another category, or ask us directly."
                clearLabel="Reset search"
                onClear={() => {
                  setCategory('ALL');
                  updateQuery('');
                }}
              />
            )}
          </section>
        </div>

        <section className="cc-cta" aria-labelledby="faq-cta">
          <div>
            <h2 id="faq-cta" className="cc-cta__title">
              Didn’t find your answer?
            </h2>
            <p>Our team and the step-by-step guides are one click away.</p>
          </div>
          <div className="cc-cta__actions">
            <Link className="cc-btn cc-btn--primary" to="/contact">
              Contact support
            </Link>
            <Link className="cc-btn cc-btn--secondary" to="/help">
              Open Help center
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
