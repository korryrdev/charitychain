import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/app/Providers';
import { api } from '@/lib/api';
import { RecognitionWallPage } from './RecognitionWallPage';

describe('RecognitionWallPage (FR-DON-12 & FR-DON-16 privacy + reporting)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('omits monetary amounts, renders neutral Supporter pill when untiered, and submits real name reports', async () => {
    vi.spyOn(api, 'getRecognitionWall').mockResolvedValue({
      entries: [
        {
          id: 'pref-untiered',
          displayName: 'Kind Falcon',
          displayMode: 'ALIAS',
          tier: null,
          awardedMonth: '2026-11',
          isConsistentGiver: false,
        },
        {
          id: 'pref-gold',
          displayName: 'Dr. Grace Hopper',
          displayMode: 'NAMED',
          tier: 'GOLD',
          awardedMonth: '2026-10',
          isConsistentGiver: true,
        },
      ],
      anonymousCount: 6,
    });

    const reportSpy = vi
      .spyOn(api, 'reportRecognitionName')
      .mockResolvedValue({ reported: true, alertId: 'alert-99998888' });

    render(
      <MemoryRouter>
        <AppProviders sessionLoader={async () => null}>
          <RecognitionWallPage />
        </AppProviders>
      </MemoryRouter>
    );

    expect(await screen.findByText('Kind Falcon')).toBeInTheDocument();
    expect(screen.getByText('Dr. Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('Supporter')).toBeInTheDocument();
    expect(screen.queryByText('Bronze Supporter')).not.toBeInTheDocument();
    expect(screen.queryByText(/KES/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Awarded 2026-11/)).toBeInTheDocument();
    expect(screen.getByText(/6 Anonymous Friends/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Report Kind Falcon' }));
    fireEvent.change(
      screen.getByLabelText(/Reason for reporting/i),
      { target: { value: 'Suspected impersonation of a staff member' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));

    await waitFor(() =>
      expect(reportSpy).toHaveBeenCalledWith('pref-untiered', {
        reason: 'Suspected impersonation of a staff member',
        reporterContact: undefined,
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent('alert-99');
  });
});
