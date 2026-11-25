import { useMemo, useState } from 'react';
import { SearchInput } from '../../components/forms/SearchInput.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { InformationGrid, PublicPage } from './PublicPage.jsx';

const CATALOGUE_ITEMS = [
  {
    title: 'Personal care',
    body: 'Examples include sanitary pads, soap, toothpaste, and tissue, subject to confirmed inventory.'
  },
  {
    title: 'Collection limits',
    body: 'Eligible students receive category and quantity limits set by the current collection policy.'
  },
  {
    title: 'Confirmation before release',
    body: 'The clerk records the selected goods, the student confirms the SMS record, and only then are goods released and stock updated.'
  }
];

export function GoodsCataloguePage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150).trim().toLowerCase();

  const items = useMemo(
    () =>
      CATALOGUE_ITEMS.filter(
        (item) =>
          !debouncedQuery ||
          `${item.title} ${item.body}`.toLowerCase().includes(debouncedQuery)
      ),
    [debouncedQuery]
  );

  return (
    <PublicPage
      title="Physical-goods catalogue"
      lead="The catalogue describes categories of goods that may be available. It is not a promise of stock or an entitlement to unlimited collection."
    >
      <SearchInput
        id="catalogue-search"
        label="Filter catalogue"
        value={query}
        onChange={setQuery}
        placeholder="Search goods categories or collection rules…"
      />
      {items.length > 0 ? (
        <InformationGrid items={items} />
      ) : (
        <p className="muted">No catalogue entries match your search.</p>
      )}
    </PublicPage>
  );
}
