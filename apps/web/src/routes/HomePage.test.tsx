import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PropertyDto, SearchPropertiesResponse, UserDto } from '@estateai/shared-types';
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
  createProperty: vi.fn(),
  searchProperties: vi.fn(),
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

const AUTH_USER: UserDto = {
  id: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  createdAt: '2024-01-01T00:00:00.000Z',
};

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

  it('shows the "Your listing" star badge only for properties the user owns', async () => {
    const items = [
      makeProperty({ id: 'own', title: 'My Own Place', isOwn: true }),
      makeProperty({ id: 'other', title: 'Another Listing', isOwn: false }),
    ];
    (api.getProperties as Mock).mockResolvedValue({ items, total: 2 });

    renderHomePage();

    await screen.findByText('My Own Place');

    const ownCard = screen.getByText('My Own Place').closest('a');
    const otherCard = screen.getByText('Another Listing').closest('a');

    expect(ownCard?.querySelector('[title="Your listing"]')).not.toBeNull();
    expect(otherCard?.querySelector('[title="Your listing"]')).toBeNull();
  });
});

describe('HomePage AI search', () => {
  it('replaces the grid with ranked AI matches and restores it on clear', async () => {
    (api.getMe as Mock).mockResolvedValue(AUTH_USER);
    (api.getProperties as Mock).mockResolvedValue({ items: [makeProperty()], total: 1 });

    const match = makeProperty({ id: 'match-1', title: 'Bright Family Flat' });
    const response: SearchPropertiesResponse = {
      matches: [{ property: match, reason: 'Close to a park and has 2 bedrooms.' }],
      summary: 'Found 1 great match for a family-friendly flat.',
    };
    (api.searchProperties as Mock).mockResolvedValue(response);

    renderHomePage();

    await screen.findByText('Sunny 2BR in Kadriorg');

    const input = await screen.findByLabelText('AI search');
    fireEvent.change(input, { target: { value: 'bright flat near a park for a family' } });
    fireEvent.click(screen.getByRole('button', { name: /Search with AI/ }));

    expect(await screen.findByText('Bright Family Flat')).toBeInTheDocument();
    expect(screen.getByText('Found 1 great match for a family-friendly flat.')).toBeInTheDocument();
    expect(screen.getByText(/Close to a park and has 2 bedrooms\./)).toBeInTheDocument();
    expect(api.searchProperties).toHaveBeenCalledWith({
      query: 'bright flat near a park for a family',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear AI search' }));

    expect(screen.queryByText('Bright Family Flat')).not.toBeInTheDocument();
    expect(screen.getByText('Sunny 2BR in Kadriorg')).toBeInTheDocument();
  });

  it('shows a login hint instead of the search form when unauthenticated', async () => {
    renderHomePage();

    expect(await screen.findByText('to use AI search.')).toBeInTheDocument();
    expect(screen.queryByLabelText('AI search')).not.toBeInTheDocument();
  });
});
