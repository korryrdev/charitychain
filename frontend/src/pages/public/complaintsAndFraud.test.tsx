import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/Providers';
import { api } from '@/lib/api';
import { ComplaintPage } from './ComplaintPage';
import { FraudReportPage } from './FraudReportPage';

describe('Public Complaints & Fraud Reporting Pages', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits a public complaint via api.submitPublicComplaint and shows CMP tracking reference', async () => {
    const spy = vi.spyOn(api, 'submitPublicComplaint').mockResolvedValue({
      complaint: {
        id: '11112222-3333-4444-8555-666677778888',
        trackingRef: 'CMP-11112222',
        kind: 'COMPLAINT',
        category: 'DONATION_ISSUE',
        subject: 'Receipt date discrepancy',
        reference: 'MLK-99AA-11BB',
        description: 'My M-Pesa confirmation showed a different timestamp than expected.',
        status: 'OPEN',
        severity: 'MEDIUM',
        createdAt: '2026-11-27T08:00:00Z',
        updatedAt: '2026-11-27T08:00:00Z',
        events: [],
      },
    });

    render(
      <MemoryRouter>
        <AppProviders sessionLoader={async () => null}>
          <ComplaintPage />
        </AppProviders>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Subject/i), {
      target: { value: 'Receipt date discrepancy' },
    });
    fireEvent.change(screen.getByLabelText(/Safe Reference Code/i), {
      target: { value: 'MLK-99AA-11BB' },
    });
    fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
      target: { value: 'My M-Pesa confirmation showed a different timestamp than expected.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit complaint' }));

    expect(await screen.findByRole('status')).toHaveTextContent('CMP-11112222');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('submits a confidential fraud report via api.submitPublicFraudReport and shows FRD tracking reference', async () => {
    const spy = vi.spyOn(api, 'submitPublicFraudReport').mockResolvedValue({
      report: {
        id: 'aaaa1111-2222-4333-8444-555566667777',
        trackingRef: 'FRD-AAAA1111',
        kind: 'FRAUD_REPORT',
        category: 'IMPERSONATION',
        subject: null,
        reference: 'CASE-2026-009',
        description: 'Caller impersonated finance office asking for verification secret.',
        status: 'OPEN',
        severity: 'HIGH',
        createdAt: '2026-11-27T08:00:00Z',
        updatedAt: '2026-11-27T08:00:00Z',
        events: [],
      },
    });

    render(
      <MemoryRouter>
        <AppProviders sessionLoader={async () => null}>
          <FraudReportPage />
        </AppProviders>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Anomaly Category/i), {
      target: { value: 'IMPERSONATION' },
    });
    fireEvent.change(screen.getByLabelText(/Safe Reference Code/i), {
      target: { value: 'CASE-2026-009' },
    });
    fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
      target: { value: 'Caller impersonated finance office asking for verification secret.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit confidential report' }));

    expect(await screen.findByRole('status')).toHaveTextContent('FRD-AAAA1111');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
