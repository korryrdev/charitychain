import { readFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync(new URL('./mustCatalog.json', import.meta.url), 'utf8'));

export const MUST_SCHOOLS = Object.freeze(
  raw.schools.map((school) =>
    Object.freeze({
      ...school,
      programmes: Object.freeze(school.programmes.map((programme) => Object.freeze(programme)))
    })
  )
);

const norm = (value) => String(value ?? '').trim().toLowerCase();

export function findMustSchool(schoolNameOrCode) {
  const target = norm(schoolNameOrCode);
  if (!target) return null;
  return (
    MUST_SCHOOLS.find((school) => norm(school.code) === target || norm(school.name) === target) ??
    null
  );
}

export function findMustProgramme(schoolNameOrCode, programmeNameOrCode) {
  const school = findMustSchool(schoolNameOrCode);
  const target = norm(programmeNameOrCode);
  if (!school || !target) return null;
  return (
    school.programmes.find(
      (programme) => norm(programme.code) === target || norm(programme.name) === target
    ) ?? null
  );
}

export function findMustProgrammeAnywhere(programmeNameOrCode) {
  const target = norm(programmeNameOrCode);
  if (!target) return null;
  for (const school of MUST_SCHOOLS) {
    const match = school.programmes.find(
      (programme) => norm(programme.code) === target || norm(programme.name) === target
    );
    if (match) return { school, programme: match };
  }
  return null;
}

export function maxYearsForSelection(schoolNameOrCode, programmeNameOrCode) {
  return findMustProgramme(schoolNameOrCode, programmeNameOrCode)?.durationYears ?? 5;
}
