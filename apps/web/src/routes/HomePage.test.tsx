import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PropertyDto } from '@estateai/shared-types';
import { ApiError } from '../shared/api/client';
import { AuthProvider } from '../features/auth/AuthContext';
import { HomePage } from './HomePage';

vi.mock('../shared/api/endpoints', () => ({
  getProperties: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  askProperty: vi.fn(),
  generateListing: vi.fn(),
}));

import * as api from '../shared/api/endpoints';

function makeProperty(overrides: Partial<PropertyDto> = {}): PropertyDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Sunny 2BR in Kadriorg',
    description: 'A lovely apartment near the park.',
    price: 185000,
    address: 'Poska 12',
    city: 'Tallinn',
    country: 'Estonia',
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 65,
    propertyType: 'apartment',
    features: ['Balcony', 'Renovated kitchen'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function renderHomePage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <HomePage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  (api.getMe as Mock).mockRejectedValue(new ApiError(401, 'You need to be logged in to do that.'));
});

describe('HomePage', () => {
  it('renders a card for each property returned by the API', async () => {
    const items = [
      makeProperty({ id: 'a', title: 'Sunny 2BR in Kadriorg' }),
      makeProperty({ id: 'b', title: 'Cozy Studio in Old Town' }),
    ];
    (api.getProperties as Mock).mockResolvedValue({ items, total: 2 });

    renderHomePage();

    expect(await screen.findByText('Sunny 2BR in Kadriorg')).toBeInTheDocument();
    expect(screen.getByText('Cozy Studio in Old Town')).toBeInTheDocument();
  });

  it('shows an error state with a retry button when the request fails', async () => {
    (api.getProperties as Mock).mockRejectedValue(new ApiError(503, 'Service unavailable.'));

    renderHomePage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText("Couldn't load properties")).toBeInTheDocument();
    expect(screen.getByText('Service unavailable.')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: 'Try again' });
    (api.getProperties as Mock).mockResolvedValue({ items: [makeProperty()], total: 1 });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Sunny 2BR in Kadriorg')).toBeInTheDocument();
    });
  });

  it('shows an empty state when no properties match', async () => {
    (api.getProperties as Mock).mockResolvedValue({ items: [], total: 0 });

    renderHomePage();

    expect(await screen.findByText('No properties match your filters')).toBeInTheDocument();
  });
});
