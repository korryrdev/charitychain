import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SigningQueuePage } from './SigningQueuePage';
import { api } from '@/lib/api';

describe('SigningQueuePage (Web3.js EIP-712 2-of-3 release)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders EIP-712 domain separator and MetaMask Web3.js connect controls for approved cases', async () => {
    vi.spyOn(api, 'getCases').mockResolvedValue([
      {
        id: 'case-1',
        caseNumber: 'C-0001',
        subGroupId: 'sg-1',
        subGroupName: 'Engineering Subgroup',
        needCategory: 'FEES',
        requestedAmountMinor: 350000,
        approvedAmountMinor: 300000,
        state: 'APPROVED',
        justification: 'Semester tuition arrears support',
        signatorySignatures: [],
        submitterId: 'rep-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SigningQueuePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('C-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect MetaMask \(Web3\.js\)/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sign EIP-712 Release/i }));
    expect(screen.getByText(/EIP-712 Domain Separator/i)).toBeInTheDocument();
    expect(screen.getByText(/name:\s*"CharityChain CaseWorkflow"/i)).toBeInTheDocument();
    expect(screen.getByText(/ReleaseAuthorization Typed Message/i)).toBeInTheDocument();
  });
});
