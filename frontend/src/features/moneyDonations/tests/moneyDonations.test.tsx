import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DonationForm } from '../components/DonationForm';
import {
  normalizeKenyanPhoneNumber,
  validateDonation
} from '../validation/donation.schema';
import { useDonation } from '../hooks/useDonation';

describe('money donation validation', () => {
  it('normalizes valid Kenyan phone number formats for Daraja', () => {
    expect(normalizeKenyanPhoneNumber('0768 720 710')).toBe('254768720710');
    expect(normalizeKenyanPhoneNumber('+254 768-720-710')).toBe('254768720710');
    expect(normalizeKenyanPhoneNumber('0712345678')).toBe('254712345678');
    expect(normalizeKenyanPhoneNumber('12345')).toBeNull();
  });

  it('requires a valid positive fiat donation request and STK phone number', () => {
    expect(validateDonation({ amount: 0, channel: 'CARD', purpose: 'OTHER' })).toEqual(
      expect.objectContaining({
        amount: expect.any(String),
        channel: expect.any(String),
        purpose: expect.any(String)
      })
    );
    expect(validateDonation({ amount: 1000, channel: 'MPESA_STK', purpose: 'TUITION' })).toEqual({
      phoneNumber: expect.any(String)
    });
    expect(
      validateDonation({
        amount: 1000,
        channel: 'MPESA_STK',
        purpose: 'TUITION',
        phoneNumber: '0712345678'
      })
    ).toEqual({});
    expect(
      validateDonation({ amount: 1000, channel: 'MPESA_PAYBILL', purpose: 'TUITION' })
    ).toEqual({});
  });

  it('submits local-format phone numbers normalized for the STK API', async () => {
    const onSubmit = vi.fn();
    render(<DonationForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Contribution amount (KES)'), {
      target: { value: '1' }
    });
    fireEvent.change(screen.getByLabelText('M-Pesa phone number'), {
      target: { value: '0768 720 710' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to payment' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ phoneNumber: '254768720710', amount: 1 })
      )
    );
  });

  it('creates an STK payment after the donation and retains it if payment initiation fails', async () => {
    const api = {
      create: vi.fn().mockResolvedValue({
        donation: { id: 'donation-1' },
        verificationSecret: 'private-secret'
      })
    };
    const payments = {
      initiate: vi.fn().mockResolvedValue({ payment: { status: 'PENDING' } })
    };
    const { result } = renderHook(() => useDonation(api, payments));

    await act(() =>
      result.current.create({
        amount: 1000,
        channel: 'MPESA_STK',
        phoneNumber: '254712345678'
      })
    );

    expect(api.create).toHaveBeenCalledWith({ amount: 1000, channel: 'MPESA_STK' });
    expect(payments.initiate).toHaveBeenCalledWith({
      donationId: 'donation-1',
      phoneNumber: '254712345678'
    });
    expect(result.current.payment).toEqual({ status: 'PENDING' });

    payments.initiate.mockRejectedValueOnce(new Error('M-Pesa unavailable.'));
    await act(async () => {
      await expect(
        result.current.create({
          amount: 1000,
          channel: 'MPESA_STK',
          phoneNumber: '254712345678'
        })
      ).rejects.toThrow('M-Pesa unavailable.');
    });
    expect(result.current.donation).toEqual({ id: 'donation-1' });
    expect(result.current.error).toBe('M-Pesa unavailable.');
  });

  it('refreshes payment and donation state after a provider result', async () => {
    const api = {
      create: vi.fn().mockResolvedValue({
        donation: { id: 'donation-2', status: 'PAYMENT_REQUESTED' },
        verificationSecret: 'private-secret'
      }),
      get: vi.fn().mockResolvedValue({
        donation: { id: 'donation-2', status: 'RECONCILED' }
      })
    };
    const payments = {
      initiate: vi.fn().mockResolvedValue({
        payment: { id: 'payment-2', status: 'PENDING' }
      }),
      refresh: vi.fn().mockResolvedValue({
        payment: { id: 'payment-2', status: 'SUCCEEDED' }
      })
    };
    const { result } = renderHook(() => useDonation(api, payments));

    await act(() =>
      result.current.create({
        amount: 1000,
        channel: 'MPESA_STK',
        phoneNumber: '254712345678'
      })
    );
    await act(() => result.current.refreshStatus());

    expect(payments.refresh).toHaveBeenCalledWith('payment-2');
    expect(api.get).toHaveBeenCalledWith('donation-2');
    expect(result.current.payment?.status).toBe('SUCCEEDED');
    expect(result.current.donation?.status).toBe('RECONCILED');
    expect(result.current.checkingStatus).toBe(false);

    act(() => result.current.reset());
    expect(result.current.donation).toBeNull();
    expect(result.current.payment).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
