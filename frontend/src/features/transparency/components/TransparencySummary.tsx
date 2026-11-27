function money(value: unknown, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );
}

export interface TransparencyMetricSummary {
  total?: number | string | null;
  count?: number | null;
}

export interface TransparencyDashboardSummary {
  currency?: string;
  donations?: TransparencyMetricSummary | null;
  disbursements?: TransparencyMetricSummary | null;
  centralPoolBalance?: number | string | null;
}

export interface TransparencySummaryProps {
  dashboard?: TransparencyDashboardSummary | null;
}

export function TransparencySummary({ dashboard }: TransparencySummaryProps) {
  const cards = [
    {
      label: 'Confirmed inflows',
      value: money(dashboard?.donations?.total, dashboard?.currency),
      note: `${dashboard?.donations?.count ?? 0} recorded donations`,
    },
    {
      label: 'Reconciled outflows',
      value: money(dashboard?.disbursements?.total, dashboard?.currency),
      note: `${dashboard?.disbursements?.count ?? 0} completed disbursements`,
    },
    {
      label: 'Central pool balance',
      value: money(dashboard?.centralPoolBalance, dashboard?.currency),
      note: 'Confirmed inflows less reconciled outflows',
    },
  ];
  return (
    <section className="transparency-summary" aria-label="Public transparency summary">
      {cards.map((card) => (
        <article key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.note}</small>
        </article>
      ))}
    </section>
  );
}
