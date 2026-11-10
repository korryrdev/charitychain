import { PrismaClient } from '@prisma/client';

const globalDatabase = globalThis;
export const prisma = globalDatabase.__charitychainPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

if (process.env.NODE_ENV !== 'production') globalDatabase.__charitychainPrisma = prisma;
