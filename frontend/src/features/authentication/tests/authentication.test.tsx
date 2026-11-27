import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, type InitialEntry } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../../app/Providers';
import { StartupGate } from '../../../app/StartupGate';
import { AuthPortalLoginForm } from '../components/AuthPortalLoginForm';
import { CheckEmailView } from '../components/CheckEmailView';
import { VerifyEmailView } from '../components/VerifyEmailView';
import { RegisterPage } from '../../../pages/auth/RegisterPage';
import { StudentRegisterPage } from '../../../pages/auth/StudentRegisterPage';
import { ProtectedRoute } from '../../authorization/components/ProtectedRoute';
import { createAuthApi } from '../services/auth.api';
import {
  validateChangePassword,
  validateLogin,
  validateMfa,
  validatePasswordReset,
  validateRegistration,
  validateStudentRegistration,
} from '../validation/auth.schema';
import type { PortalSession } from '../../../types/portal';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  if (status === 204) {
    return new Response(null, { status: 204, headers });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function renderWithSession(
  session: PortalSession | null,
  ui: React.ReactNode,
  initialEntries: InitialEntry[] = ['/'],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppProviders sessionLoader={async () => session}>
        <StartupGate>{ui}</StartupGate>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('authentication foundation and hardening', () => {
  it('validates registration, student registration, sign-in, password reset, change password, and MFA payloads', () => {
    expect(
      validateRegistration({
        name: 'A',
        email: 'invalid',
        password: 'short',
        confirmPassword: 'different',
      }),
    ).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        email: 'Incorrect email',
        password: expect.any(String),
        confirmPassword: expect.any(String),
      }),
    );

    expect(
      validateStudentRegistration({
        name: 'Jane Student',
        email: 'jane123456@students.must.ac.ke',
        registrationNumber: 'CT201/000001/24',
        school: 'School of Computing and Informatics',
        programme: 'BSc. in Computer Science (BCS)',
        yearOfStudy: '2',
        password: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      }),
    ).toEqual({});

    expect(
      validateStudentRegistration({
        name: 'Jane Student',
        email: 'jane123456@students.must.ac.ke',
        registrationNumber: 'CT201/000001/24',
        school: 'School of Business and Economics',
        programme: 'Diploma in Human Resource Management (HR)',
        yearOfStudy: '4',
        password: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      }),
    ).toEqual({ yearOfStudy: expect.stringContaining('Year 3') });

    expect(
      validateStudentRegistration({
        name: 'Jane Student',
        email: 'jane123456@students.must.ac.ke',
        registrationNumber: 'BAD-REG',
        school: 'School of Engineering and Architecture',
        programme: 'Bachelor of Technology in Civil Engineering',
        yearOfStudy: '5',
        password: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      }),
    ).toEqual({ registrationNumber: expect.any(String) });

    expect(validateLogin({ email: 'donor@example.org', password: 'password' }, { role: 'DONOR' })).toEqual({});
    expect(validateMfa({ code: '123456' })).toEqual({});
    expect(
      validatePasswordReset({
        userId: 'u1',
        token: 't'.repeat(32),
        password: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      }),
    ).toEqual({});
    expect(
      validateChangePassword({
        currentPassword: 'StrongPassword123',
        newPassword: 'StrongPassword123',
        confirmPassword: 'StrongPassword123',
      }),
    ).toEqual({ newPassword: expect.any(String) });
  });

  it('enforces the MUST student email format for Student login and registration', () => {
    expect(
      validateLogin({ email: 'jane123456@students.must.ac.ke', password: 'password' }, { role: 'STUDENT' }),
    ).toEqual({});

    for (const invalidEmail of [
      'jane@students.must.ac.ke',
      '123456@students.must.ac.ke',
      'jane12345@students.must.ac.ke',
      'jane1234567@students.must.ac.ke',
      'donor@example.org',
    ]) {
      expect(
        validateLogin({ email: invalidEmail, password: 'password' }, { role: 'STUDENT' }),
      ).toEqual({ email: 'Incorrect email' });
    }
  });

  it('sends auth API requests through the central client including portal and resendVerification', async () => {
    const client = { post: vi.fn().mockResolvedValue({ user: { id: 'u1' } }) };
    const api = createAuthApi(client);
    await api.login({ email: ' DONOR@EXAMPLE.ORG ', password: 'password', portal: 'donor' });
    expect(client.post).toHaveBeenCalledWith('/public/auth/login', {
      email: 'donor@example.org',
      password: 'password',
      portal: 'donor',
    });
    await api.resendVerification(' STUDENT123456@STUDENTS.MUST.AC.KE ');
    expect(client.post).toHaveBeenCalledWith('/public/auth/resend-verification', {
      email: 'student123456@students.must.ac.ke',
    });
  });

  it('disables submit with a live countdown on 429 and offers inline resend on ACCOUNT_NOT_VERIFIED', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many attempts.',
            details: { retryAfterSeconds: 30 },
          },
        },
        429,
        { 'Retry-After': '30' },
      ),
    );

    renderWithSession(null, <AuthPortalLoginForm portal="student" />);

    const emailInput = await screen.findByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'jane123456@students.must.ac.ke' } });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const lockedBtn = await screen.findByRole('button', { name: /Try again in 30s/i });
    expect(lockedBtn).toBeDisabled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    cleanup();
    fetchSpy.mockReset();
    fetchSpy
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: {
              code: 'ACCOUNT_NOT_VERIFIED',
              message: 'Please verify your email address before signing in.',
            },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ accepted: true }, 202));

    renderWithSession(null, <AuthPortalLoginForm portal="donor" />);
    fireEvent.change(await screen.findByLabelText('Email address'), {
      target: { value: 'donor@example.org' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    const resendBtn = await screen.findByRole('button', { name: 'Resend verification email' });
    fireEvent.click(resendBtn);
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.stringContaining('/public/auth/resend-verification'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'donor@example.org' }),
        }),
      ),
    );
  });

  it('requires a button click on VerifyEmailView (no auto-POST on mount) and enforces resend cooldown on CheckEmailView', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(null, 204));

    renderWithSession(
      null,
      <Routes>
        <Route path="/student/auth/verify" element={<VerifyEmailView portal="student" />} />
      </Routes>,
      [`/student/auth/verify?email=jane123456%40students.must.ac.ke&token=${'t'.repeat(43)}`],
    );

    const confirmBtn = await screen.findByRole('button', { name: 'Confirm my email' });
    // Must not auto-POST on GET render
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(confirmBtn);
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/public/auth/verify-account'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'jane123456@students.must.ac.ke', token: 't'.repeat(43) }),
        }),
      ),
    );
    expect(await screen.findByText('Email verified')).toBeInTheDocument();

    cleanup();
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue(jsonResponse({ accepted: true }, 202));

    renderWithSession(
      null,
      <Routes>
        <Route path="/student/auth/check-email" element={<CheckEmailView portal="student" />} />
      </Routes>,
      [{ pathname: '/student/auth/check-email', state: { email: 'jane123456@students.must.ac.ke' } }],
    );

    const resendBtn = await screen.findByRole('button', { name: 'Resend verification email' });
    fireEvent.click(resendBtn);
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/public/auth/resend-verification'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'jane123456@students.must.ac.ke' }),
        }),
      ),
    );
    expect(await screen.findByRole('button', { name: /Resend email in 60s/i })).toBeDisabled();
  });

  it('navigates StudentRegisterPage and RegisterPage to check-email and never straight into the app', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        jsonResponse({ requiresVerification: true, email: 'jane123456@students.must.ac.ke' }, 201),
      );

    renderWithSession(
      null,
      <Routes>
        <Route path="/student/auth/register" element={<StudentRegisterPage />} />
        <Route path="/student/auth/check-email" element={<div>Student Check Email</div>} />
        <Route path="/student" element={<div>Student Landing</div>} />
      </Routes>,
      ['/student/auth/register'],
    );

    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Jane Student' } });
    fireEvent.change(screen.getByLabelText('Student email address'), {
      target: { value: 'jane123456@students.must.ac.ke' },
    });
    fireEvent.change(screen.getByLabelText('University registration number'), {
      target: { value: 'CT201/000001/24' },
    });

    // Cascading dropdowns & Year radio pills: 3-year diploma limits to Year 3; 5-year engineering allows Year 5.
    fireEvent.change(screen.getByLabelText('School'), {
      target: { value: 'School of Computing and Informatics' },
    });
    fireEvent.change(screen.getByLabelText('Programme'), {
      target: { value: 'Diploma in Information Technology (IT)' },
    });
    expect(screen.getByRole('radio', { name: 'Year 3' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Year 4' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('School'), {
      target: { value: 'School of Engineering and Architecture' },
    });
    fireEvent.change(screen.getByLabelText('Programme'), {
      target: { value: 'Bachelor of Technology in Civil Engineering' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Year 5' }));

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create student account' }));

    expect(await screen.findByText('Student Check Email')).toBeInTheDocument();
    expect(screen.queryByText('Student Landing')).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toMatchObject({
      school: 'School of Engineering and Architecture',
      programme: 'Bachelor of Technology in Civil Engineering',
      yearOfStudy: 5,
    });

    cleanup();
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue(
      jsonResponse({ requiresVerification: true, email: 'donor@example.org' }, 201),
    );

    renderWithSession(
      null,
      <Routes>
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/check-email" element={<div>Donor Check Email</div>} />
        <Route path="/donor" element={<div>Donor Landing</div>} />
      </Routes>,
      ['/auth/register'],
    );

    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Donor User' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'donor@example.org' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'StrongPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create donor account' }));

    expect(await screen.findByText('Donor Check Email')).toBeInTheDocument();
    expect(screen.queryByText('Donor Landing')).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('redirects unauthenticated users to portal logins and enforces password change / MFA enrolment on ProtectedRoute', async () => {
    const routes = (
      <Routes>
        <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><div>Student Home</div></ProtectedRoute>} />
        <Route path="/donor" element={<ProtectedRoute roles={['DONOR']}><div>Donor Home</div></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['ADMINISTRATOR']}><div>Admin Home</div></ProtectedRoute>} />
        <Route path="/student/auth/login" element={<div>Student Login</div>} />
        <Route path="/auth/login" element={<div>Donor Login</div>} />
        <Route path="/staff/login" element={<div>Staff Login</div>} />
        <Route path="/auth/change-password" element={<div>Forced Change Password</div>} />
        <Route path="/auth/mfa-setup" element={<div>Forced MFA Setup</div>} />
      </Routes>
    );

    renderWithSession(null, routes, ['/student']);
    expect(await screen.findByText('Student Login')).toBeInTheDocument();

    cleanup();
    renderWithSession(null, routes, ['/donor']);
    expect(await screen.findByText('Donor Login')).toBeInTheDocument();

    cleanup();
    renderWithSession(null, routes, ['/admin']);
    expect(await screen.findByText('Staff Login')).toBeInTheDocument();

    cleanup();
    renderWithSession(
      {
        user: { id: 'a1', email: 'a@example.org', mustChangePassword: true },
        roles: ['ADMINISTRATOR'],
        permissions: [],
      },
      routes,
      ['/admin'],
    );
    expect(await screen.findByText('Forced Change Password')).toBeInTheDocument();

    cleanup();
    renderWithSession(
      {
        user: { id: 'a1', email: 'a@example.org', mustChangePassword: false, mfaEnrollmentRequired: true },
        roles: ['ADMINISTRATOR'],
        permissions: [],
      },
      routes,
      ['/admin'],
    );
    expect(await screen.findByText('Forced MFA Setup')).toBeInTheDocument();
  });
});
