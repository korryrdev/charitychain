import { prisma } from '@charitychain/database';
export function createStudentsRepository(database = prisma) { return {
  findById(id) { return database.student.findUnique({ where: { id } }); },
  findByUserId(userId) { return database.student.findUnique({ where: { userId } }); },
  findByRegistrationNumber(registrationNumber) { return database.student.findUnique({ where: { registrationNumber } }); },
  async claim(id, userId) {
    return database.$transaction(async (transaction) => {
      const result = await transaction.student.updateMany({ where: { id, userId: null }, data: { userId } });
      if (!result.count) return null;
      const studentRole = await transaction.role.findUniqueOrThrow({ where: { code: 'STUDENT' } });
      await transaction.userRole.upsert({
        where: { userId_roleId: { userId, roleId: studentRole.id } },
        update: {},
        create: { userId, roleId: studentRole.id }
      });
      return transaction.student.findUniqueOrThrow({ where: { id } });
    });
  },
  async ensureStudentRole(userId) {
    return database.$transaction(async (transaction) => {
      const studentRole = await transaction.role.findUniqueOrThrow({ where: { code: 'STUDENT' } });
      return transaction.userRole.upsert({
        where: { userId_roleId: { userId, roleId: studentRole.id } },
        update: {},
        create: { userId, roleId: studentRole.id }
      });
    });
  },
  async list({ programme, academicStatus, simulationProfile, page, pageSize }) { const where = { ...(programme ? { programme: { contains: programme, mode: 'insensitive' } } : {}), ...(academicStatus ? { academicStatus } : {}), ...(simulationProfile ? { simulationProfile } : {}) }; const [items,total] = await database.$transaction([database.student.findMany({ where, orderBy: { registrationNumber: 'asc' }, skip: (page-1)*pageSize, take: pageSize }), database.student.count({ where })]); return { items,total,page,pageSize }; }
}; }
export const studentsRepository = createStudentsRepository();
