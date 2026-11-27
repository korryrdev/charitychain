'use strict';

function sanitizePdfText(input) {
  return String(input ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatKes(minorValue) {
  const minor = Number(minorValue || 0);
  return `KES ${(minor / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildContentStream(report) {
  const canonical = report.canonicalJson || {};
  const lots = Array.isArray(canonical.lots) ? canonical.lots.slice(0, 12) : [];
  const disbursements = Array.isArray(canonical.disbursements)
    ? canonical.disbursements.slice(0, 12)
    : [];

  const lines = [
    { text: `CHARITYCHAIN QUARTERLY AUDIT REPORT`, font: 'F1', size: 15, gap: 22 },
    {
      text: `Period: Q${report.quarter} ${report.year} (Version v${report.version}) | Academic Year: ${canonical.academicYear || `${report.year}/${report.year + 1}`}`,
      font: 'F1',
      size: 10,
      gap: 16,
    },
    {
      text: `Window: ${(canonical.startDate || '').slice(0, 10)} to ${(canonical.endDate || '').slice(0, 10)} | Generated: ${new Date(report.createdAt).toISOString()}`,
      font: 'F2',
      size: 9,
      gap: 20,
    },
    { text: 'FINANCIAL SUMMARY', font: 'F1', size: 11, gap: 15 },
    {
      text: `Total Inflow: ${formatKes(canonical.totalInflowMinor)} | Total Disbursed: ${formatKes(canonical.totalDisbursedMinor)}`,
      font: 'F2',
      size: 9,
      gap: 14,
    },
    {
      text: `Donation Lots Count: ${canonical.donationLotsCount ?? lots.length} | Disbursements Count: ${canonical.disbursementsCount ?? disbursements.length}`,
      font: 'F2',
      size: 9,
      gap: 18,
    },
    { text: 'CRYPTOGRAPHIC ANCHOR IDENTIFIERS', font: 'F1', size: 11, gap: 15 },
    { text: `Report Hash: ${report.reportHash}`, font: 'F2', size: 8, gap: 13 },
    { text: `Period Root: ${report.periodRoot}`, font: 'F2', size: 8, gap: 18 },
    { text: `DONATION LOTS (${lots.length} shown)`, font: 'F1', size: 10, gap: 14 },
  ];

  if (lots.length === 0) {
    lines.push({ text: '  No donation lots recorded in this reporting window.', font: 'F2', size: 8, gap: 13 });
  } else {
    for (const l of lots) {
      lines.push({
        text: `  ${l.code} | ${l.channel} | ${formatKes(l.amount)}`,
        font: 'F2',
        size: 8,
        gap: 12,
      });
    }
  }

  lines.push({ text: '', font: 'F2', size: 8, gap: 8 });
  lines.push({
    text: `ALLOCATED DISBURSEMENTS (${disbursements.length} shown)`,
    font: 'F1',
    size: 10,
    gap: 14,
  });

  if (disbursements.length === 0) {
    lines.push({ text: '  No case allocations recorded in this reporting window.', font: 'F2', size: 8, gap: 13 });
  } else {
    for (const d of disbursements) {
      lines.push({
        text: `  ${d.caseNumber} | ${d.category} | ${formatKes(d.amount)}`,
        font: 'F2',
        size: 8,
        gap: 12,
      });
    }
  }

  const commands = ['BT'];
  let y = 760;
  for (const line of lines) {
    if (y < 48) break;
    if (line.text) {
      commands.push(`/${line.font} ${line.size} Tf`);
      commands.push(`1 0 0 1 44 ${y} Tm`);
      commands.push(`(${sanitizePdfText(line.text)}) Tj`);
    }
    y -= line.gap;
  }
  commands.push('ET');
  return commands.join('\n');
}

/** Render a standalone standards-compliant PDF 1.4 quarterly audit report. */
export function renderQuarterlyReportPdf(report) {
  const streamContent = buildContentStream(report);
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n',
    `6 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += obj;
  }

  const xrefOffset = Buffer.byteLength(body, 'utf8');
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body + xref + trailer, 'utf8');
}
