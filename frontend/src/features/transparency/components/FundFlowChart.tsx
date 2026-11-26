function money(value: unknown, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );
}

export interface FundFlowItem {
  from: string;
  to: string;
  amount?: number | string | null;
}

export interface FundFlowChartProps {
  flows?: FundFlowItem[];
  currency?: string;
}

export function FundFlowChart({ flows = [], currency = 'KES' }: FundFlowChartProps) {
  const maximum = Math.max(1, ...flows.map((flow) => Number(flow.amount ?? 0)));
  return (
    <section className="public-chart" aria-labelledby="fund-flow-title">
      <div className="public-chart__heading">
        <h2 id="fund-flow-title">Confirmed fund flow</h2>
        <p>Only reconciled aggregate amounts are shown publicly.</p>
      </div>
      <ul>
        {flows.map((flow) => (
          <li key={`${flow.from}-${flow.to}`}>
            <div>
              <span>{flow.from}</span>
              <span aria-hidden="true">→</span>
              <strong>{flow.to}</strong>
            </div>
            <div className="public-chart__bar">
              <i style={{ width: `${Math.max(3, (Number(flow.amount ?? 0) / maximum) * 100)}%` }} />
            </div>
            <b>{money(flow.amount, currency)}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}
