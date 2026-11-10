import { universityRecordsService } from './universityRecords.service.js';
export const paymentHistoryService = Object.freeze({ async mine(auth) { return (await universityRecordsService.mine(auth)).payments; }, async forStudent(auth, studentId) { return (await universityRecordsService.get(auth, studentId)).payments; } });
