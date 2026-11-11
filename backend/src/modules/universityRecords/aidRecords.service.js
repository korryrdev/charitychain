import { universityRecordsService } from './universityRecords.service.js';
export const aidRecordsService = Object.freeze({ async mine(auth) { return (await universityRecordsService.mine(auth)).aidRecords; }, async forStudent(auth, studentId) { return (await universityRecordsService.get(auth, studentId)).aidRecords; } });
