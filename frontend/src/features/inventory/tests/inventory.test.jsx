import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { InventoryTable } from '../components/InventoryTable.jsx';

describe('inventory presentation', () => {
  it('shows available and reserved quantities distinctly', () => {
    const html = renderToStaticMarkup(createElement(InventoryTable, { items: [{ id: 'batch-1', item: { name: 'Soap', unit: 'bar', category: { name: 'Hygiene' } }, availableQuantity: 5, reservedQuantity: 2, status: 'AVAILABLE' }] }));
    expect(html).toContain('Soap'); expect(html).toContain('5'); expect(html).toContain('2');
  });
});
