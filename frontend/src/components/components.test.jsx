import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './common/Button.jsx';
import { DataTable } from './tables/DataTable.jsx';
import { Modal } from './common/Modal.jsx';
import { StatusBadge } from './status/StatusBadge.jsx';

describe('shared components', () => {
  it('renders accessible action and status components', () => { const click = vi.fn(); render(<><Button onClick={click}>Save</Button><StatusBadge status="RECONCILED" /></>); fireEvent.click(screen.getByRole('button', { name: 'Save' })); expect(click).toHaveBeenCalledTimes(1); expect(screen.getByText('Reconciled')).toBeTruthy(); });
  it('renders semantic tables and a closable dialog', () => { const close = vi.fn(); render(<><DataTable caption="Donations" columns={[{ key: 'amount', label: 'Amount' }]} rows={[{ id: '1', amount: 'KES 100' }]} /><Modal open title="Review" onClose={close}>Details</Modal></>); expect(screen.getByText('Donations')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Close dialog' })); expect(close).toHaveBeenCalledTimes(1); });
});
