import { describe, expect, it } from 'vitest';
import { validateGoodsSelection } from '../validation/goodsCollection.schema.js';

const policy = { maximumCategories: 4, maximumTotalUnits: 12, categoryLimits: { PADS: 3, DEFAULT: 2 } };
const item = { id: 'batch-1', itemName: 'Sanitary pads', unit: 'pack', availableQuantity: 8, category: { code: 'PADS', name: 'Pads' }, quantity: 4 };

describe('goods selection limits', () => {
  it('rejects a quantity above the category allowance', () => {
    expect(validateGoodsSelection([item], policy)[item.id]).toContain('limited to 3');
  });
  it('accepts an available selection within policy limits', () => {
    expect(validateGoodsSelection([{ ...item, quantity: 3 }], policy)).toEqual({});
  });
});
