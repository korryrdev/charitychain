import { prisma } from '@charitychain/database';
export function createStudentsRepository(database = prisma) { return {
  findById(id) { return database.student.findUnique({ where: { id } }); },
  findByUserId(userId) { return database.student.findUnique({ where: { userId } }); },
  findByRegistrationNumber(registrationNumber) { return database.student.findUnique({ where: { registrationNumber } }); },
  async claim(id, userId) { const result = await database.student.updateMany({ where: { id, userId: null }, data: { userId } }); if (!result.count) return null; return database.student.findUniqueOrThrow({ where: { id } }); },
  async list({ programme, academicStatus, simulationProfile, page, pageSize }) { const where = { ...(programme ? { programme: { contains: programme, mode: 'insensitive' } } : {}), ...(academicStatus ? { academicStatus } : {}), ...(simulationProfile ? { simulationProfile } : {}) }; const [items,total] = await database.$transaction([database.student.findMany({ where, orderBy: { registrationNumber: 'asc' }, skip: (page-1)*pageSize, take: pageSize }), database.student.count({ where })]); return { items,total,page,pageSize }; }
}; }
export const studentsRepository = createStudentsRepository();
