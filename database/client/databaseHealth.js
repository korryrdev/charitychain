import { prisma } from './prismaClient.js';

export async function databaseHealth() {
  await prisma.$queryRaw`SELECT 1`;
  return true;
}
