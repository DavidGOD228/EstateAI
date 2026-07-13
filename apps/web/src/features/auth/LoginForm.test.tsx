import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { LoginForm } from './LoginForm';
import { useAuth } from './AuthContext';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderLoginForm(login: Mock) {
  (useAuth as Mock).mockReturnValue({
    login,
    user: null,
    status: 'unauthenticated',
    register: vi.fn(),
    logout: vi.fn(),
  });

  return render(
    <MemoryRouter>
      <LoginForm from="/" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('LoginForm', () => {
  it('shows a validation error for an invalid email and does not call login', () => {
    const login = vi.fn();
    renderLoginForm(login);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows the API error message when login is rejected', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(401, 'Invalid email or password.'));
    renderLoginForm(login);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    });
    expect(login).toHaveBeenCalledWith('user@example.com', 'wrong-password');
  });
});
