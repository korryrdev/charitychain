import { prisma } from '../client/prismaClient.js';
import { pathToFileURL } from 'node:url';
import { SEMESTER_BLUEPRINTS, SIMULATION_PROFILES, SIMULATION_RULES, UNIVERSITY_SIMULATION_VERSION } from './simulationRules.js';

const firstNames = ['Amina','Brian','Carol','David','Esther','Faith','George','Hellen','Ian','Joy','Kevin','Lucy','Mercy','Noah','Olive','Peter','Queen','Ruth','Samuel','Terry'];
const lastNames = ['Mwangi','Mutua','Njeri','Kiptoo','Wambui','Otieno','Muthoni','Kamau','Achieng','Kariuki','Wanjiku','Maina'];
const programmes = [
  ['BSC-COMPUTER-SCIENCE','School of Computing and Informatics'],
  ['BSC-INFORMATION-TECHNOLOGY','School of Computing and Informatics'],
  ['BACHELOR-OF-COMMERCE','School of Business and Economics'],
  ['BSC-NURSING','School of Health Sciences'],
  ['BSC-EDUCATION','School of Education']
];
const at = (date, days = 0) => new Date(new Date(`${date}T09:00:00.000Z`).getTime() + days * 86400000);

function paymentPlan(profile, semester, index) {
  const start = semester.startsAt;
  const exam = semester.examStartsAt;
  const suffix = `${index}-${semester.code}`;
  if (profile === 'STABLE_LUMP_SUM_CONTROL') return { payments: [{ amount: 27000, source: 'FAMILY', paidAt: at(start, 1) }], aids: [], blocks: [] };
  if (profile === 'MICRO_PAYMENT_HARDSHIP') return { payments: [{ amount: 1500, source: 'FAMILY', paidAt: at(start, 12) },{ amount: 3000, source: 'SELF', paidAt: at(start, 47) },{ amount: 1200, source: 'FAMILY', paidAt: at(start, 78) },{ amount: 8000, source: 'HELB', paidAt: at(start, 60) }], aids: [{ aidType: 'HELB', providerName: 'Higher Education Loans Board', awardedAmount: 8000, disbursedAmount: 8000, status: 'DISBURSED', disbursedAt: at(start, 60) }], blocks: [{ blockType: 'EXAM_CLEARANCE', reason: 'Outstanding fee balance before examinations', blockedAt: at(exam, -7), resolvedAt: null }] };
  if (profile === 'EXAM_PERIOD_DISTRESS') return { payments: [{ amount: 4000, source: 'FAMILY', paidAt: at(start, 35) },{ amount: 12000, source: 'FAMILY', paidAt: at(exam, -2) }], aids: [], blocks: [{ blockType: 'EXAM_CLEARANCE', reason: 'Emergency clearance required', blockedAt: at(exam, -8), resolvedAt: at(exam, -1) }] };
  if (profile === 'AID_GAP_RELIANCE') return { payments: [{ amount: 10000, source: 'HELB', paidAt: at(start, 50) },{ amount: 5000, source: 'SCHOLARSHIP', paidAt: at(start, 65) },{ amount: 2000, source: 'FAMILY', paidAt: at(start, 80) }], aids: [{ aidType: 'HELB', providerName: 'Higher Education Loans Board', awardedAmount: 10000, disbursedAmount: 10000, status: 'DISBURSED', disbursedAt: at(start, 50) },{ aidType: 'GOVERNMENT_SCHOLARSHIP', providerName: 'Government Scholarship Fund', awardedAmount: 5000, disbursedAmount: 5000, status: 'DISBURSED', disbursedAt: at(start, 65) }], blocks: [] };
  if (profile === 'CHRONIC_HIGH_BALANCE') return { payments: [{ amount: 2000 + (index % 3) * 500, source: 'FAMILY', paidAt: at(start, 40) }], aids: [], blocks: [{ blockType: 'PORTAL_RESTRICTION', reason: 'Chronic unpaid fee balance', blockedAt: at(start, 70), resolvedAt: null }] };
  return { payments: [{ amount: 9000, source: 'FAMILY', paidAt: at(start, 20) },{ amount: 9000, source: 'SELF', paidAt: at(start, 58) },{ amount: 9000, source: 'FAMILY', paidAt: at(start, 82) }], aids: [], blocks: [] };
}

export async function seedUniversityRecords({ count = 30 } = {}) {
  if (!Number.isInteger(count) || count < 6 || count > 500) throw new Error('Simulated student count must be an integer from 6 to 500.');
  const semesters = [];
  for (const blueprint of SEMESTER_BLUEPRINTS) {
    const semester = await prisma.academicSemester.upsert({ where: { code: blueprint.code }, update: { name: blueprint.name, academicYear: blueprint.academicYear, startsAt: at(blueprint.startsAt), endsAt: at(blueprint.endsAt), feeDueAt: at(blueprint.feeDueAt), active: Boolean(blueprint.active) }, create: { code: blueprint.code, name: blueprint.name, academicYear: blueprint.academicYear, startsAt: at(blueprint.startsAt), endsAt: at(blueprint.endsAt), feeDueAt: at(blueprint.feeDueAt), active: Boolean(blueprint.active) } });
    await prisma.examCalendar.deleteMany({ where: { semesterId: semester.id } });
    await prisma.examCalendar.create({ data: { semesterId: semester.id, examType: 'END_SEMESTER', startsAt: at(blueprint.examStartsAt), endsAt: at(blueprint.examEndsAt), clearanceDeadline: at(blueprint.examStartsAt, -3) } });
    semesters.push({ ...blueprint, id: semester.id });
  }
  for (let index = 0; index < count; index += 1) {
    const serial = String(index + 1).padStart(3, '0');
    const registrationNumber = `MUST/SIM/2026/${serial}`;
    const profile = SIMULATION_PROFILES[index % SIMULATION_PROFILES.length];
    const [programme, school] = programmes[index % programmes.length];
    const student = await prisma.student.upsert({ where: { registrationNumber }, update: { fullName: `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`, programme, school, yearOfStudy: (index % 4) + 1, academicStatus: 'ACTIVE', simulationProfile: profile }, create: { registrationNumber, fullName: `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`, programme, school, yearOfStudy: (index % 4) + 1, academicStatus: 'ACTIVE', simulationProfile: profile, admittedAt: at('2022-09-01', (index % 4) * 365), expectedGraduation: at('2027-06-30', (index % 4) * 365) } });
    await prisma.$transaction([prisma.studentPayment.deleteMany({ where: { studentId: student.id } }), prisma.studentAidRecord.deleteMany({ where: { studentId: student.id } }), prisma.studentFinanceBlock.deleteMany({ where: { studentId: student.id } }), prisma.studentAssistanceHistory.deleteMany({ where: { studentId: student.id } }), prisma.studentFinancialRecord.deleteMany({ where: { studentId: student.id } })]);
    for (const semester of semesters) {
      const plan = paymentPlan(profile, semester, index);
      let paid = 0;
      for (let paymentIndex = 0; paymentIndex < plan.payments.length; paymentIndex += 1) { const payment = plan.payments[paymentIndex]; paid += payment.amount; await prisma.studentPayment.create({ data: { studentId: student.id, semesterId: semester.id, reference: `SIM-PAY-${serial}-${semester.code}-${paymentIndex + 1}`, amount: payment.amount, source: payment.source, paidAt: payment.paidAt, description: `${UNIVERSITY_SIMULATION_VERSION}:${profile}` } }); }
      let aidAmount = 0;
      for (let aidIndex = 0; aidIndex < plan.aids.length; aidIndex += 1) { const aid = plan.aids[aidIndex]; aidAmount += aid.disbursedAmount; await prisma.studentAidRecord.create({ data: { studentId: student.id, semesterId: semester.id, reference: `SIM-AID-${serial}-${semester.code}-${aidIndex + 1}`, ...aid } }); }
      const balance = Math.max(0, SIMULATION_RULES.tuitionPerSemester - paid);
      await prisma.studentFinancialRecord.create({ data: { studentId: student.id, semesterId: semester.id, invoicedAmount: SIMULATION_RULES.tuitionPerSemester, paidAmount: paid, aidAmount, outstandingBalance: balance, status: balance === 0 ? 'CLEARED' : plan.blocks.length ? 'BLOCKED' : semester.active ? 'OVERDUE' : 'PARTIALLY_PAID' } });
      for (const block of plan.blocks) await prisma.studentFinanceBlock.create({ data: { studentId: student.id, semesterId: semester.id, ...block } });
    }
    if (index % 7 === 0) { const previous = semesters.at(-2); await prisma.studentAssistanceHistory.create({ data: { studentId: student.id, semesterId: previous.id, assistanceType: 'TUITION', providerName: 'CharityChain Foundation Historical Simulation', amount: 3000, reference: `SIM-ASST-${serial}-${previous.code}`, providedAt: at(previous.startsAt, 75) } }); }
  }
  return { version: UNIVERSITY_SIMULATION_VERSION, students: count, semesters: semesters.length, profiles: SIMULATION_PROFILES.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = Number(process.env.SIMULATED_STUDENT_COUNT ?? 30);
  seedUniversityRecords({ count }).then((summary) => console.log(JSON.stringify(summary))).finally(() => prisma.$disconnect());
}
