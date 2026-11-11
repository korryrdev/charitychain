export const UNIVERSITY_SIMULATION_VERSION = 'must-financial-patterns-v1';

export const SIMULATION_PROFILES = Object.freeze([
  'MICRO_PAYMENT_HARDSHIP',
  'EXAM_PERIOD_DISTRESS',
  'AID_GAP_RELIANCE',
  'CHRONIC_HIGH_BALANCE',
  'STABLE_LUMP_SUM_CONTROL',
  'MIXED_CONTROL'
]);

export const SIMULATION_RULES = Object.freeze({
  tuitionPerSemester: 27000,
  profiles: {
    MICRO_PAYMENT_HARDSHIP: 'Three to five irregular family micro-payments, optional HELB, and a persistent unpaid gap.',
    EXAM_PERIOD_DISTRESS: 'Material payments one or two days before examinations plus repeated finance blocks.',
    AID_GAP_RELIANCE: 'HELB or scholarship disbursement with an outstanding parental contribution.',
    CHRONIC_HIGH_BALANCE: 'Sparse payments and a high balance carried across semesters.',
    STABLE_LUMP_SUM_CONTROL: 'A single full family payment at the beginning of each semester with no finance block.',
    MIXED_CONTROL: 'Ordinary mid-semester instalments without a persistent distress pattern.'
  }
});

export const SEMESTER_BLUEPRINTS = Object.freeze([
  { code: '2024-2025-S1', name: 'Semester 1', academicYear: '2024/2025', startsAt: '2024-09-02', endsAt: '2024-12-20', feeDueAt: '2024-09-16', examStartsAt: '2024-12-02', examEndsAt: '2024-12-13' },
  { code: '2024-2025-S2', name: 'Semester 2', academicYear: '2024/2025', startsAt: '2025-01-13', endsAt: '2025-05-02', feeDueAt: '2025-01-27', examStartsAt: '2025-04-14', examEndsAt: '2025-04-25' },
  { code: '2025-2026-S1', name: 'Semester 1', academicYear: '2025/2026', startsAt: '2025-09-01', endsAt: '2025-12-19', feeDueAt: '2025-09-15', examStartsAt: '2025-12-01', examEndsAt: '2025-12-12' },
  { code: '2025-2026-S2', name: 'Semester 2', academicYear: '2025/2026', startsAt: '2026-01-12', endsAt: '2026-05-01', feeDueAt: '2026-01-26', examStartsAt: '2026-04-13', examEndsAt: '2026-04-24', active: true }
]);
