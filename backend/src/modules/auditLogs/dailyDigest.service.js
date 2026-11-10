'use strict';

import { prisma } from '@charitychain/database';
import { computeMerkleRoot, generateMerkleProof, hashLeaf } from '../../utils/merkle.js';
import { parseYyyyMmDd, formatYyyyMmDd } from '../../utils/dates.js';
import { alertsService } from '../alerts/alerts.service.js';

export function createDailyDigestService({ database = prisma, alerts = alertsService } = {}) {
  function getDayBounds(dateInput) {
    let date;
    if (typeof dateInput === 'number') {
      date = parseYyyyMmDd(dateInput);
    } else if (typeof dateInput === 'string' && /^\d{8}$/.test(dateInput)) {
      date = parseYyyyMmDd(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    const start = new Date(Date.UTC(y, m, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    const yyyymmdd = formatYyyyMmDd(date);
    return { start, end, yyyymmdd, isoDate: start.toISOString().slice(0, 10) };
  }

  function leafForEvent(event) {
    return hashLeaf(`${event.id}:${event.hash}:${event.sequence ?? 0}`);
  }

  return {
    async computeDigest(dateInput) {
      const { start, end, yyyymmdd, isoDate } = getDayBounds(dateInput);

      const events = await database.auditEvent.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
      });

      const leaves = events.map(leafForEvent);
      const rootBuffer = computeMerkleRoot(leaves);
      const merkleRoot = '0x' + rootBuffer.toString('hex');

      const existingAnchor = await database.outboxEvent.findFirst({
        where: {
          eventName: 'daily_digest.anchored',
          aggregateId: String(yyyymmdd)
        }
      });

      if (existingAnchor) {
        const storedRoot = existingAnchor.payload?.merkleRoot;
        if (storedRoot && storedRoot !== merkleRoot) {
          await alerts.raiseAlert({
            ruleId: 'R17',
            severity: 'CRITICAL',
            details: {
              day: yyyymmdd,
              computedRoot: merkleRoot,
              storedRoot,
              eventCount: events.length
            }
          });
        }
      }

      return {
        day: yyyymmdd,
        date: isoDate,
        entryCount: events.length,
        merkleRoot,
        anchored: Boolean(existingAnchor),
        anchorEvent: existingAnchor?.id ?? null
      };
    },

    async anchorDay(dateInput, actorId = 'system') {
      const digest = await this.computeDigest(dateInput);

      const existing = await database.outboxEvent.findFirst({
        where: {
          eventName: 'daily_digest.anchored',
          aggregateId: String(digest.day)
        }
      });
      if (existing) {
        return { ...digest, anchored: true };
      }

      const outbox = await database.outboxEvent.create({
        data: {
          eventName: 'daily_digest.anchored',
          aggregateType: 'DailyLedgerDigest',
          aggregateId: String(digest.day),
          idempotencyKey: `digest:${digest.day}`,
          payload: {
            day: digest.day,
            date: digest.date,
            merkleRoot: digest.merkleRoot,
            entryCount: digest.entryCount,
            anchoredBy: actorId
          }
        }
      });

      return { ...digest, anchored: true, anchorEvent: outbox.id };
    },

    async getEventProof(dateInput, auditEventId) {
      const { start, end, yyyymmdd } = getDayBounds(dateInput);

      const events = await database.auditEvent.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
      });

      const targetIndex = events.findIndex((e) => e.id === auditEventId);
      if (targetIndex === -1) return null;

      const leaves = events.map(leafForEvent);
      const rootBuffer = computeMerkleRoot(leaves);
      const proof = generateMerkleProof(leaves, targetIndex);

      return {
        day: yyyymmdd,
        auditEventId,
        merkleRoot: '0x' + rootBuffer.toString('hex'),
        leaf: '0x' + leaves[targetIndex].toString('hex'),
        proof
      };
    }
  };
}

export const dailyDigestService = createDailyDigestService();
