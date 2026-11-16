import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../components/LoginForm.jsx';
import { RegisterForm } from '../components/RegisterForm.jsx';
import { createAuthApi } from '../services/auth.api.js';
import { validateLogin, validateMfa, validateRegistration } from '../validation/auth.schema.js';

afterEach(() => {
  cleanup();
});

describe('authentication foundation', () => {
  it('validates registration, sign-in, and MFA payloads before transport', () => {
    expect(
      validateRegistration({
        name: 'A',
        email: 'invalid',
        password: 'short',
        confirmPassword: 'different'
      })
    ).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        email: 'Incorrect email',
        password: expect.any(String),
        confirmPassword: expect.any(String)
      })
    );
    expect(validateLogin({ email: 'donor@example.org', password: 'password' }, { role: 'DONOR' })).toEqual({});
    expect(validateMfa({ code: '123456' })).toEqual({});
  });

  it('enforces the MUST student email format for Student login and registration', () => {
    expect(
      validateLogin({ email: 'jane123456@students.must.ac.ke', password: 'password' }, { role: 'STUDENT' })
    ).toEqual({});
    expect(
      validateRegistration(
        {
          name: 'Jane Student',
          email: 'JANE123456@students.must.ac.ke',
          password: 'StrongPassword123',
          confirmPassword: 'StrongPassword123'
        },
        { role: 'STUDENT' }
      )
    ).toEqual({});

    for (const invalidEmail of [
      'jane@students.must.ac.ke',
      '123456@students.must.ac.ke',
      'jane12345@students.must.ac.ke',
      'jane1234567@students.must.ac.ke',
      'donor@example.org'
    ]) {
      expect(
        validateLogin({ email: invalidEmail, password: 'password' }, { role: 'STUDENT' })
      ).toEqual({ email: 'Incorrect email' });
      expect(
        validateRegistration(
          {
            name: 'Jane Student',
            email: invalidEmail,
            password: 'StrongPassword123',
            confirmPassword: 'StrongPassword123'
          },
          { role: 'STUDENT' }
        )
      ).toEqual({ email: 'Incorrect email' });
    }
  });

  it('allows standard email formats for Donor registration and sign-in', () => {
    expect(
      validateRegistration(
        {
          name: 'Donor User',
          email: 'donor@example.org',
          password: 'StrongPassword123',
          confirmPassword: 'StrongPassword123'
        },
        { role: 'DONOR' }
      )
    ).toEqual({});
    expect(validateLogin({ email: 'donor@example.org', password: 'password' }, { role: 'DONOR' })).toEqual({});
  });

  it('renders role tabs on LoginForm with Student active by default and shows Incorrect email for invalid student emails', async () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <LoginForm onSubmit={onSubmit} />
      </MemoryRouter>
    );

    const studentTab = screen.getByRole('tab', { name: 'Student' });
    const donorTab = screen.getByRole('tab', { name: 'Donor' });
    expect(studentTab).toHaveAttribute('aria-selected', 'true');
    expect(donorTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Secretariat' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'donor@example.org' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Incorrect email')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'name123456@students.must.ac.ke' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'name123456@students.must.ac.ke',
        password: 'StrongPassword123',
        role: 'STUDENT'
      })
    );
  });

  it('renders role tabs on RegisterForm with Student active by default and validates student emails', async () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <RegisterForm onSubmit={onSubmit} />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: 'Student' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Donor' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Secretariat' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Student Name' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'invalid@must.ac.ke' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'StrongPassword123' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Incorrect email')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'name123456@students.must.ac.ke' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Student Name',
        email: 'name123456@students.must.ac.ke',
        password: 'StrongPassword123',
        role: 'STUDENT'
      })
    );
  });

  it('sends auth API requests through the central client', async () => {
    const client = { post: vi.fn().mockResolvedValue({ user: { id: 'u1' } }) };
    const api = createAuthApi(client);
    await api.login({ email: ' DONOR@EXAMPLE.ORG ', password: 'password', role: 'DONOR' });
    expect(client.post).toHaveBeenCalledWith('/public/auth/login', {
      email: 'donor@example.org',
      password: 'password',
      role: 'DONOR'
    });
  });
});
