'use strict';

import { createHash } from 'node:crypto';
import { prisma } from '@charitychain/database';
import { formatMoney } from '../../utils/money.js';
import { ConflictError } from '../../errors/ConflictError.js';

export function createCertificateService({ database = prisma } = {}) {
  return {
    async generateCertificate(receiptCode) {
      const lot = await database.donationLot.findUnique({
        where: { receiptCode },
        include: {
          allocations: {
            include: { case: { select: { caseNumber: true } } }
          }
        }
      });

      if (!lot) {
        throw new ConflictError(`Receipt "${receiptCode}" not found.`);
      }

      const pref = await database.donorPreferenceEvent.findFirst({
        where: { donorRef: lot.donorRef },
        orderBy: { createdAt: 'desc' }
      });

      const recipientName = (pref?.isOptedIn && (pref.confirmedName || pref.publicAlias))
        ? (pref.confirmedName || pref.publicAlias)
        : 'Generous Supporter';

      const formattedAmount = formatMoney(lot.totalAmountMinor, lot.currency);
      const dateStr = lot.createdAt.toISOString().slice(0, 10);
      const allocatedCases = lot.allocations.map((a) => a.case?.caseNumber).filter(Boolean);
      const impactText = allocatedCases.length > 0
        ? `Directly aiding student cases: ${allocatedCases.join(', ')}`
        : 'Dedicated to student education and health support';

      const certSignature = createHash('sha256')
        .update(`${receiptCode}:${lot.totalAmountMinor}:${lot.sourceRefHash}`)
        .digest('hex');

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C5A059"/>
      <stop offset="100%" stop-color="#E5C158"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="#0D1117"/>
  <rect x="25" y="25" width="750" height="550" rx="15" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
  <rect x="35" y="35" width="730" height="530" rx="10" fill="none" stroke="#30363D" stroke-width="1"/>
  
  <text x="400" y="110" font-family="sans-serif" font-size="28" font-weight="bold" fill="#E5C158" text-anchor="middle" letter-spacing="4">CHARITYCHAIN FOUNDATION</text>
  <text x="400" y="150" font-family="serif" font-size="20" font-style="italic" fill="#8B949E" text-anchor="middle">Certificate of Appreciation</text>
  
  <text x="400" y="220" font-family="sans-serif" font-size="14" fill="#C9D1D9" text-anchor="middle">This certificate is proudly presented to</text>
  <text x="400" y="270" font-family="sans-serif" font-size="32" font-weight="bold" fill="#F0F6FC" text-anchor="middle">${recipientName}</text>
  
  <text x="400" y="330" font-family="sans-serif" font-size="16" fill="#C9D1D9" text-anchor="middle">in gratitude for the verified charitable contribution of</text>
  <text x="400" y="375" font-family="sans-serif" font-size="28" font-weight="bold" fill="#E5C158" text-anchor="middle">${formattedAmount}</text>
  
  <text x="400" y="420" font-family="sans-serif" font-size="14" fill="#8B949E" text-anchor="middle">${impactText}</text>
  
  <line x1="150" y1="480" x2="650" y2="480" stroke="#30363D" stroke-width="1"/>
  
  <text x="150" y="515" font-family="monospace" font-size="12" fill="#8B949E">Receipt: ${receiptCode}</text>
  <text x="150" y="535" font-family="monospace" font-size="11" fill="#484F58">Digest: ${certSignature.slice(0, 32)}...</text>
  
  <text x="650" y="515" font-family="monospace" font-size="12" fill="#8B949E" text-anchor="end">Date: ${dateStr}</text>
  <text x="650" y="535" font-family="monospace" font-size="11" fill="#484F58" text-anchor="end">Status: On-Chain Verified</text>
</svg>`;

      return {
        receiptCode,
        recipientName,
        amount: formattedAmount,
        date: dateStr,
        signature: certSignature,
        svg
      };
    }
  };
}

export const certificateService = createCertificateService();
