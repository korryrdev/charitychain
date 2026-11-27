export interface StockVarianceAlertProps {
  message?: string | null;
}

export function StockVarianceAlert({ message }: StockVarianceAlertProps) {
  return message ? (
    <aside className="stock-variance-alert" role="alert">
      <strong>Inventory variance requires attention</strong>
      <p>{message}</p>
    </aside>
  ) : null;
}
