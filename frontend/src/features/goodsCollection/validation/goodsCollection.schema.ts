export interface GoodsSelectionLine {
  id: string;
  quantity: number | string;
  availableQuantity: number | string;
  unit: string;
  category: {
    code: string;
    name: string;
  };
}

export interface GoodsSelectionPolicy {
  maximumCategories: number;
  maximumTotalUnits: number;
  categoryLimits: Record<string, number>;
}

export function validateGoodsSelection(
  lines: GoodsSelectionLine[],
  policy: GoodsSelectionPolicy,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!lines.length) errors.lines = 'Choose at least one available item.';
  const categories = new Set(lines.map((line) => line.category.code));
  const total = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
  if (categories.size > policy.maximumCategories) errors.lines = `Choose at most ${policy.maximumCategories} categories.`;
  if (total > policy.maximumTotalUnits) errors.lines = `Choose at most ${policy.maximumTotalUnits} total units.`;
  for (const line of lines) {
    const limit = policy.categoryLimits[line.category.code] ?? policy.categoryLimits.DEFAULT;
    if (Number(line.quantity) > limit) errors[line.id] = `${line.category.name} is limited to ${limit} ${line.unit}(s).`;
    if (Number(line.quantity) > Number(line.availableQuantity)) {
      errors[line.id] = 'The requested quantity is not currently available.';
    }
  }
  return errors;
}
