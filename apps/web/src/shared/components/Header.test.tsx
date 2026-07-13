import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { PromoBanner } from '../../features/properties/PromoBanner';
import { useAuth } from '../../features/auth/AuthContext';

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('Header auth gating', () => {
  it('hides the Generate link and shows Log in / Sign up when unauthenticated', () => {
    (useAuth as Mock).mockReturnValue({ status: 'unauthenticated', user: null });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Generate' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('shows the Generate link when authenticated', () => {
    (useAuth as Mock).mockReturnValue({
      status: 'authenticated',
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', createdAt: '2024-01-01T00:00:00.000Z' },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Generate' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
  });
});

describe('PromoBanner auth gating', () => {
  it('invites unauthenticated visitors to log in to generate', () => {
    (useAuth as Mock).mockReturnValue({ status: 'unauthenticated', user: null });

    render(
      <MemoryRouter>
        <PromoBanner />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: 'Log in to generate' });
    expect(cta).toHaveAttribute('href', '/login');
  });

  it('offers authenticated users the generator directly', () => {
    (useAuth as Mock).mockReturnValue({
      status: 'authenticated',
      user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', createdAt: '2024-01-01T00:00:00.000Z' },
    });

    render(
      <MemoryRouter>
        <PromoBanner />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: 'Try the generator' });
    expect(cta).toHaveAttribute('href', '/generate');
  });
});
