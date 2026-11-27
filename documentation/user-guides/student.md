# Student User Guide (`/student`)

Eligible campus students register using their university email, link a simulated MUST academic/financial record, apply for emergency financial aid with transparent Need-Index feedback, request essential goods packs, and file formal appeals (`system-dashboards.md §3`).

---

## 1. Registering & Linking Your University Record

1. Navigate to `/student/auth/register` (or the Student tab on `/auth/register`).
2. Register using a valid student email (`name123456@students.must.ac.ke`), which provisions the `STUDENT` role (`auth.service.js`).
3. Link your university registration number using the `CTxxx/xxxxxx/yy` format (`^[A-Z]{2}\d{3}\/\d{6}\/\d{2}$`, e.g. `CT206/204483/24` or `CT201/000001/23`; see [University Simulation Rules](../database/university-simulation-rules.md)).
4. Sign in at `/student/auth/login` or `/auth/login`.

---

## 2. Applying for Financial Aid (`/student/apply`, `/student/applications`)

1. Inspect your read-only academic & fee balance summary at `/student/record` (students do not upload fake fee PDFs; vetting inspects authoritative university records).
2. Submit a **Tuition** or **Upkeep** request at `/student/apply`.
3. Explainable Need-Index vetting (`modules/vetting/`) evaluates unmet balance, fragmented micro-payments, late pre-exam payments, finance blocks, HELB/scholarship reliance, prior aid, and duplicate submissions automatically upon HTTP submit.
4. Track status progression and clear vetting explanations on `/student/applications/:applicationId/vetting`.

---

## 3. Requesting & Confirming Physical Goods (`/student/goods`)

1. Browse eligible hygiene/essential categories (`Sanitary pads`, `Toilet tissue`, `Soap`, `Toothpaste`) and remaining semester limits at `/student/goods`.
2. Submit a collection request at `/student/goods/request`.
3. At the clerk desk handover, **you must independently confirm (`Yes`/`No`)** on `/confirm-goods` before inventory permanently deducts the items (`FR-FLOW-05`). Clerks cannot confirm on your behalf.

---

## 4. Submitting Appeals (`/student/appeals`)

If a vetting decision, university record value, or collection event looks inaccurate, file an appeal or discrepancy report directly at `/student/appeals` (`StudentAppeal`).
