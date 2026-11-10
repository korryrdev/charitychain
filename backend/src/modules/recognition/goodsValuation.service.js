import { Prisma } from '@prisma/client';
import { ValidationError } from '../../errors/ValidationError.js';

export function calculateGoodsValue(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ValidationError('At least one approved goods valuation line is required.');
  }
  return lines.reduce((total, line, index) => {
    if (!line.approvedRate || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new ValidationError(
        'Goods recognition requires approved rates and positive quantities.',
        [{ path: `lines.${index}`, message: 'Invalid approved valuation line.' }]
      );
    }
    return total.plus(new Prisma.Decimal(line.approvedRate).times(line.quantity));
  }, new Prisma.Decimal(0));
}
