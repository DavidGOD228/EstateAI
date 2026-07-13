import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PropertyQA } from './PropertyQA';
import { useAuth } from '../../auth/AuthContext';
import { SUGGESTED_QUESTIONS } from './constants';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderPropertyQA() {
  return render(
    <MemoryRouter>
      <PropertyQA propertyId="11111111-1111-4111-8111-111111111111" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('PropertyQA gate', () => {
  it('shows the login prompt instead of the question form when unauthenticated', () => {
    (useAuth as Mock).mockReturnValue({ status: 'unauthenticated', user: null });

    renderPropertyQA();

    expect(
      screen.getByText('Log in to ask AI questions about this listing and get an instant answer.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Your question')).not.toBeInTheDocument();
  });

  it('shows the question form with suggested chips when authenticated', () => {
    (useAuth as Mock).mockReturnValue({ status: 'authenticated', user: { name: 'Jane' } });

    renderPropertyQA();

    const textarea = screen.getByLabelText('Your question');
    expect(textarea).toBeInTheDocument();

    const firstSuggestion = SUGGESTED_QUESTIONS[0];
    fireEvent.click(screen.getByRole('button', { name: firstSuggestion }));

    expect(textarea).toHaveValue(firstSuggestion);
  });
});
