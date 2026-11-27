import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SigningQueuePage } from './SigningQueuePage';
import { api } from '@/lib/api';
import * as web3Verify from '@/lib/web3Verify';

describe('SigningQueuePage (Web3.js EIP-712 2-of-3 release)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as unknown as { ethereum?: unknown }).ethereum;
  });

  it('requires real MetaMask EIP-1193 wallet connection without demo signatory controls', async () => {
    const ethereumMock = {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') {
          return ['0x1111111111111111111111111111111111111111'];
        }
        if (method === 'eth_chainId') {
          return '0x13882';
        }
        if (method === 'eth_signTypedData_v4') {
          return '0x' + 'ab'.repeat(65);
        }
        return null;
      }),
    };
    (window as unknown as { ethereum?: unknown }).ethereum = ethereumMock;

    vi.spyOn(web3Verify, 'fetchRegisteredSignatories').mockResolvedValue({
      configured: false,
      signatories: [],
    });

    const getCasesSpy = vi.spyOn(api, 'getCases').mockResolvedValue([
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
    const signSpy = vi.spyOn(api, 'signReleaseAuthorization').mockResolvedValue({
      id: 'case-1',
      caseNumber: 'C-0001',
      subGroupId: 'sg-1',
      subGroupName: 'Engineering Subgroup',
      needCategory: 'FEES',
      requestedAmountMinor: 350000,
      approvedAmountMinor: 300000,
      state: 'APPROVED',
      justification: 'Semester tuition arrears support',
      signatorySignatures: [
        { signer: '0x1111111111111111111111111111111111111111', signedAt: new Date().toISOString() },
      ],
      submitterId: 'rep-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SigningQueuePage />
      </QueryClientProvider>
    );

    expect(await screen.findByText('C-0001')).toBeInTheDocument();
    expect(getCasesSpy).toHaveBeenCalled();
    expect(screen.queryByText(/Demo Signatory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo Mode/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Connect MetaMask \(Web3\.js\)/i }));
    await waitFor(() => {
      expect(screen.getByText(/0x1111111111111111111111111111111111111111/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign EIP-712 Release/i }));
    expect(screen.getByText(/EIP-712 Domain Separator/i)).toBeInTheDocument();
    expect(screen.getByText(/name:\s*"CharityChain CaseWorkflow"/i)).toBeInTheDocument();
    expect(screen.getByText(/ReleaseAuthorization Typed Message/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sign with MetaMask/i }));
    await waitFor(() => {
      expect(signSpy).toHaveBeenCalledWith(
        'case-1',
        expect.objectContaining({
          signer: '0x1111111111111111111111111111111111111111',
          signature: '0x' + 'ab'.repeat(65),
          signMethod: 'METAMASK_EIP712',
        })
      );
    });
  });
});
