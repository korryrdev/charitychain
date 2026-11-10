# Simulated University Record Rules

## Purpose

The simulated university dataset provides deterministic, explainable records for development, demonstrations, and automated vetting tests without accessing a real university database or exposing real student information.

## Generation Command

From the project root:

```powershell
npm run db:seed:university
```

The default command creates 30 students. A controlled size may be supplied without changing the rules:

```powershell
$env:SIMULATED_STUDENT_COUNT = "60"
npm run db:seed:university
```

The accepted size is 6 to 500 students. Registration numbers, payment references, aid references, dates, profiles, and amounts are deterministic, so rerunning the same command updates the same records instead of creating duplicates.

## Dataset Invariants

- Registration numbers follow `MUST/SIM/2026/NNN`.
- Every generated student has four semesters of financial records.
- Every financial record satisfies `outstanding balance = invoiced amount - total payments`.
- Aid payments have corresponding HELB, scholarship, NGO, or waiver evidence.
- Exam-period factors use the stored exam calendar rather than arbitrary dates.
- Finance blocks contain their actual start and optional resolution timestamps.
- Historical CharityChain assistance is stored separately from university payments.
- No generated record contains real student information.
- A simulated student record can be linked to at most one authenticated account.

## Financial Profiles

### Micro-Payment Hardship

Several small, irregular family or self-funded payments occur throughout each semester. HELB may reduce the balance, but a substantial gap and exam-clearance block remain.

### Exam-Period Distress

The student makes a material emergency payment one or two days before examinations and has repeated exam-clearance blocks.

### Aid-Gap Reliance

HELB and government scholarship payments are present, but the combined aid still leaves an unpaid parental contribution.

### Chronic High Balance

Only sparse small payments occur, producing a large balance and recurring portal or finance restrictions.

### Stable Lump-Sum Control

The full semester charge is paid by the family near the beginning of each semester, with no finance blocks. This is the principal non-needy comparison profile.

### Mixed Control

Ordinary instalments clear the semester charge without persistent blocks or dependence on aid. This prevents the vetting model from treating every instalment pattern as hardship.

## Security Boundary

The registration number verifies that a record exists in the simulated university directory; it does not replace account authentication. The account must already be authenticated and authorized as a student before claiming a record. Claims are concurrency-safe, and financial records are accessible only to the linked student or privileged university-record staff.
