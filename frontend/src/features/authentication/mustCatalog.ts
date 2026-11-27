import rawCatalog from '@charitychain/shared/must-catalog.json';

export type ProgrammeLevel = 'DEGREE' | 'DIPLOMA';

export interface MustProgramme {
  code: string;
  name: string;
  level: ProgrammeLevel;
  durationYears: number;
}

export interface MustSchool {
  code: string;
  name: string;
  programmes: readonly MustProgramme[];
}

export const OTHER_PROGRAMME_VALUE = '__OTHER__';

export const MUST_SCHOOLS: readonly MustSchool[] = rawCatalog.schools as readonly MustSchool[];

export function findMustSchool(schoolNameOrCode: string | undefined | null): MustSchool | null {
  const target = String(schoolNameOrCode ?? '').trim().toLowerCase();
  if (!target) return null;
  return (
    MUST_SCHOOLS.find(
      (school) => school.code.toLowerCase() === target || school.name.toLowerCase() === target,
    ) ?? null
  );
}

export function findMustProgramme(
  schoolNameOrCode: string | undefined | null,
  programmeNameOrCode: string | undefined | null,
): MustProgramme | null {
  const school = findMustSchool(schoolNameOrCode);
  const target = String(programmeNameOrCode ?? '').trim().toLowerCase();
  if (!school || !target) return null;
  return (
    school.programmes.find(
      (programme) =>
        programme.code.toLowerCase() === target || programme.name.toLowerCase() === target,
    ) ?? null
  );
}
