import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/Providers';
import { StartupGate } from '../../../app/StartupGate';
import { AppHeader } from '../../../layouts/components/AppHeader';
import { UsersAndRolesPage } from '../../../pages/admin/UsersAndRolesPage';
import type { PortalSession } from '../../../types/portal';

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

const adminSession: PortalSession = {
  user: {
    id: 'admin-1',
    name: 'System Administrator',
    email: 'kotlin.hustlehub@gmail.com',
    status: 'ACTIVE',
    twoFactorEnabled: true,
  },
  roles: ['ADMINISTRATOR'],
  permissions: ['system:administer', 'user:manage', 'role:manage'],
};

const sampleUsers = [
  {
    id: 'u-1',
    name: 'Aldo Kipyegon',
    email: 'kipyegonaldo@gmail.com',
    status: 'ACTIVE',
    twoFactorEnabled: false,
    roles: ['DONOR'],
    permissions: ['profile:read:self', 'donation:create'],
  },
  {
    id: 'u-2',
    name: 'System Administrator',
    email: 'kotlin.hustlehub@gmail.com',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    roles: ['ADMINISTRATOR'],
    permissions: ['system:administer', 'user:manage', 'role:manage'],
  },
];

const sampleRoles = [
  { code: 'ADMINISTRATOR', permissions: ['system:administer', 'user:manage'], _count: { users: 1 } },
  { code: 'CLERK', permissions: ['inventory:read'], _count: { users: 0 } },
  { code: 'DONOR', permissions: ['donation:create'], _count: { users: 1 } },
];

describe('AppHeader account dropdown and UsersAndRolesPage', () => {
  it('tucks user role, email, and Sign out inside the account dropdown', async () => {
    render(
      <MemoryRouter>
        <AppProviders sessionLoader={async () => adminSession}>
          <StartupGate>
            <AppHeader title="System administration" onMenuToggle={() => {}} />
          </StartupGate>
        </AppProviders>
      </MemoryRouter>
    );

    const accountTrigger = await screen.findByRole('button', { name: /System Administrator/i });
    expect(screen.queryByRole('menuitem', { name: /Sign out/i })).toBeNull();

    fireEvent.click(accountTrigger);

    expect(await screen.findByRole('menuitem', { name: /Sign out/i })).toBeTruthy();
    expect(screen.getByText('kotlin.hustlehub@gmail.com')).toBeTruthy();
    expect(screen.getByText('Administrator')).toBeTruthy();
  });

  it('lists people cleanly, switches tabs, invites staff via drawer, and saves permissions', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.includes('/users?pageSize=100')) {
        return jsonResponse({ items: sampleUsers });
      }
      if (url.endsWith('/roles')) {
        return jsonResponse({ roles: sampleRoles });
      }
      if (url.endsWith('/users/staff') && init?.method === 'POST') {
        return jsonResponse({ user: { id: 'u-3', email: 'clerk@charitychain.org' } }, 201);
      }
      if (url.endsWith('/roles/users/u-1/permissions') && init?.method === 'PUT') {
        return jsonResponse({ ok: true });
      }
      return jsonResponse({ error: { message: `Unhandled URL: ${url}` } }, 404);
    });

    render(
      <MemoryRouter>
        <UsersAndRolesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Users & roles' })).toBeTruthy();
    await screen.findByText('Aldo Kipyegon');

    // Switch to Roles tab
    const rolesTab = screen.getByRole('tab', { name: /Roles/i });
    fireEvent.click(rolesTab);
    expect(rolesTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/0 members/i)).toBeTruthy();

    // Switch back to People tab and open Invite staff drawer
    fireEvent.click(screen.getByRole('tab', { name: /People/i }));
    fireEvent.click(screen.getByRole('button', { name: /Invite staff/i }));

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Grace Mutua' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'grace@charitychain.org' },
    });
    fireEvent.click(screen.getByLabelText('Clerk'));
    fireEvent.click(screen.getByRole('button', { name: /Send invite/i }));

    await waitFor(() => {
      const staffPost = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/users/staff'));
      expect(staffPost).toBeTruthy();
      expect(JSON.parse(String(staffPost?.[1]?.body))).toEqual({
        name: 'Grace Mutua',
        email: 'grace@charitychain.org',
        roles: ['CLERK'],
      });
    });

    // Open Manage drawer on Aldo Kipyegon and save updated permissions
    const manageButtons = await screen.findAllByRole('button', { name: 'Manage' });
    fireEvent.click(manageButtons[0]);

    expect(screen.getByRole('dialog', { name: 'Aldo Kipyegon' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(([url]) =>
        String(url).endsWith('/roles/users/u-1/permissions')
      );
      expect(putCall).toBeTruthy();
      expect(JSON.parse(String(putCall?.[1]?.body))).toEqual({
        permissions: ['profile:read:self', 'donation:create'],
      });
    });
  });
});
