import { universityRecordsService } from './universityRecords.service.js';
export const examCalendarService = Object.freeze({ forStudent: (...args) => universityRecordsService.exams(...args) });
