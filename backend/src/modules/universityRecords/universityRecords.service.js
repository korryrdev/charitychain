import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { assertCanReadUniversityRecord } from './universityRecords.policy.js';
import { toUniversityRecord } from './universityRecords.mapper.js';
import { universityRecordsRepository } from './universityRecords.repository.js';
function missing(message = 'Student university record not found.') { return new AppError({ message, code: ERROR_CODES.STUDENT_NOT_FOUND, statusCode: 404 }); }
export function createUniversityRecordsService(repository = universityRecordsRepository) { return { async mine(auth) { const student = await repository.findStudentByUserId(auth.user.id); if (!student) throw missing(); return toUniversityRecord(student); }, async get(auth, studentId) { const student = await repository.findStudentById(studentId); if (!student) throw missing(); assertCanReadUniversityRecord(auth, student); return toUniversityRecord(student); }, async exams(auth, studentId, semesterCode) { const student = await repository.findStudentById(studentId); if (!student) throw missing(); assertCanReadUniversityRecord(auth, student); const semester = await repository.findSemester(semesterCode); if (!semester) throw missing('Academic semester not found.'); return repository.examCalendars(semester.id, student.programme); } }; }
export const universityRecordsService = createUniversityRecordsService();
