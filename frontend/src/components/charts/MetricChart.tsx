import type { ReactNode } from 'react';

export interface MetricChartItem {
  label: string;
  value: number | string;
}

export interface MetricChartProps {
  title: string;
  items: MetricChartItem[];
  formatter?: (value: number | string) => ReactNode;
}

export function MetricChart({ title, items, formatter = (value) => value }: MetricChartProps) {
  const maximum = Math.max(...items.map((item) => Number(item.value) || 0), 1);
  return (
    <section className="metric-chart" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <div aria-hidden="true">
              <i style={{ width: `${((Number(item.value) || 0) / maximum) * 100}%` }} />
            </div>
            <strong>{formatter(item.value)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
