import type { GoodsSelectionPolicy } from '../validation/goodsCollection.schema';

export interface GoodsStockItem {
  id: string;
  itemName: string;
  unit: string;
  availableQuantity: number;
  category: {
    code: string;
    name: string;
  };
}

export interface GoodsSelectedLine extends GoodsStockItem {
  quantity: number;
}

export interface GoodsSelectorProps {
  stock?: GoodsStockItem[];
  selected?: GoodsSelectedLine[];
  onChange: (selected: GoodsSelectedLine[]) => void;
  policy: GoodsSelectionPolicy;
}

export function GoodsSelector({ stock = [], selected = [], onChange, policy }: GoodsSelectorProps) {
  const quantityFor = (id: string): number => selected.find((line) => line.id === id)?.quantity ?? 0;
  const update = (item: GoodsStockItem, quantity: string | number) => {
    const numeric = Math.max(0, Number(quantity) || 0);
    const remaining = selected.filter((line) => line.id !== item.id);
    onChange(numeric ? [...remaining, { ...item, quantity: numeric }] : remaining);
  };

  return (
    <section className="goods-selector">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Available stock</p>
          <h2>Choose items for the clerk to verify</h2>
        </div>
        <span>
          {selected.reduce((sum, line) => sum + Number(line.quantity), 0)}/{policy.maximumTotalUnits} items
        </span>
      </div>
      {stock.length ? (
        <div className="goods-grid">
          {stock.map((item) => {
            const limit = policy.categoryLimits[item.category.code] ?? policy.categoryLimits.DEFAULT;
            return (
              <article key={item.id}>
                <span>{item.category.name}</span>
                <h3>{item.itemName}</h3>
                <p>
                  {item.availableQuantity} {item.unit}(s) currently available · limit {limit}
                </p>
                <label>
                  Quantity
                  <input
                    type="number"
                    min={0}
                    max={Math.min(item.availableQuantity, limit)}
                    value={quantityFor(item.id)}
                    onChange={(event) => update(item, event.target.value)}
                  />
                </label>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="muted">No eligible stock is currently available.</p>
      )}
    </section>
  );
}
