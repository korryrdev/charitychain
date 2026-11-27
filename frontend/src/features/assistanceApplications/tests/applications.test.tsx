import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistanceApplicationPage } from '../../../pages/student/AssistanceApplicationPage';
import { validateApplication } from '../validation/application.schema';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const baseStudentRecord = {
  student: {
    id: 'student-1',
    registrationNumber: 'CT206/204483/24',
    fullName: 'Aldo Kipyegon',
    programme: 'BSc. in Computer Security and Forensics (BCSF)',
    school: 'School of Computing and Informatics',
    yearOfStudy: 3,
    academicStatus: 'ACTIVE',
  },
  activeSemester: {
    code: '2026-2027-S1',
    name: 'Semester 1',
    academicYear: '2026/2027',
    active: true,
  },
  financialRecords: [],
  payments: [],
  aidRecords: [],
  financeBlocks: [],
  assistanceHistory: [],
};

function renderApplicationPage() {
  return render(
    <MemoryRouter initialEntries={['/student/apply']}>
      <Routes>
        <Route path="/student/apply" element={<AssistanceApplicationPage />} />
        <Route
          path="/student/applications/:applicationId"
          element={<div>Application detail view</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('assistance application validation', () => {
  it('does not allow tuition requests to exceed the verified outstanding balance', () => {
    expect(
      validateApplication(
        {
          type: 'TUITION',
          requestedAmount: '5000',
          reason: 'I need urgent fee assistance for the current semester.',
        },
        { outstandingBalance: '4000' }
      ).requestedAmount
    ).toContain('cannot exceed');
  });

  it('accepts a supported upkeep request within the policy cap', () => {
    expect(
      validateApplication({
        type: 'UPKEEP',
        requestedAmount: '12000',
        reason: 'I need short-term upkeep support while I complete the current semester.',
      })
    ).toEqual({});
  });

  it('supports tuition cap up to KES 150,000 when no synced fee statement exists', () => {
    expect(
      validateApplication({
        type: 'TUITION',
        requestedAmount: '150000',
        reason: 'My guardian lost seasonal farm income before semester fee clearance.',
      })
    ).toEqual({});

    expect(
      validateApplication({
        type: 'TUITION',
        requestedAmount: '150001',
        reason: 'My guardian lost seasonal farm income before semester fee clearance.',
      }).requestedAmount
    ).toContain('150,000');
  });
});

describe('AssistanceApplicationPage submission and accessibility', () => {
  it('shows accessible validation errors, focuses the first invalid field, and submits even without a synced financial record', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.endsWith('/university-records/me')) {
        return jsonResponse({ record: baseStudentRecord });
      }
      if (url.includes('/applications/mine')) {
        return jsonResponse({ items: [], total: 0 });
      }
      if (url.endsWith('/applications')) {
        return jsonResponse({ application: { id: 'app-123' } }, 201);
      }
      if (url.endsWith('/applications/app-123/submit')) {
        return jsonResponse({ application: { id: 'app-123', status: 'MANUAL_REVIEW' } });
      }
      return jsonResponse({ error: { message: `Unexpected URL: ${url}` } }, 404);
    });

    renderApplicationPage();

    await screen.findByText(/Institutional fee statement not synced yet/i);

    const amountInput = screen.getByLabelText(/Requested amount \(KES\)/i) as HTMLInputElement;
    const reasonInput = screen.getByLabelText(/Why is support needed now\?/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /Submit for vetting/i });

    expect(amountInput.getAttribute('aria-invalid')).toBe('false');
    expect(reasonInput.getAttribute('aria-invalid')).toBe('false');
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.change(amountInput, { target: { value: '1000' } });
    fireEvent.change(reasonInput, { target: { value: 'too short' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(reasonInput.getAttribute('aria-invalid')).toBe('true');
      expect(document.activeElement).toBe(reasonInput);
    });
    expect(screen.getByText('Explain the request in at least 20 characters.')).toBeTruthy();

    fireEvent.change(reasonInput, {
      target: { value: 'Household medical costs disrupted my semester tuition savings.' },
    });

    await waitFor(() => {
      expect(reasonInput.getAttribute('aria-invalid')).toBe('false');
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit for vetting/i }));

    await waitFor(() => {
      expect(screen.getByText('Application detail view')).toBeTruthy();
    });

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === 'POST'
    );
    expect(postCalls).toHaveLength(2);
    expect(JSON.parse(String(postCalls[0][1]?.body))).toEqual({
      type: 'TUITION',
      requestedAmount: 1000,
      reason: 'Household medical costs disrupted my semester tuition savings.',
      semesterCode: '2026-2027-S1',
    });
    expect(String(postCalls[1][0])).toContain('/applications/app-123/submit');
  });
});
