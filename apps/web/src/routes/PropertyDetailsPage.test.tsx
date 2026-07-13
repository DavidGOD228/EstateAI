import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PropertyDto } from '@estateai/shared-types';
import { ApiError } from '../shared/api/client';
import { AuthProvider } from '../features/auth/AuthContext';
import { PropertyDetailsPage } from './PropertyDetailsPage';

vi.mock('../shared/api/endpoints', () => ({
  getProperties: vi.fn(),
  getProperty: vi.fn(),
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  deleteProperty: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  askProperty: vi.fn(),
  generateListing: vi.fn(),
  searchProperties: vi.fn(),
}));

import * as api from '../shared/api/endpoints';

function makeProperty(overrides: Partial<PropertyDto> = {}): PropertyDto {
  return {
    id: 'prop-1',
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
    features: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function renderDetails(id = 'prop-1') {
  return render(
    <MemoryRouter initialEntries={[`/properties/${id}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  (api.getMe as Mock).mockRejectedValue(new ApiError(401, 'You need to be logged in to do that.'));
});

describe('PropertyDetailsPage owner controls', () => {
  it('shows Edit and Delete controls when the property isOwn', async () => {
    (api.getProperty as Mock).mockResolvedValue(makeProperty({ isOwn: true }));

    renderDetails();

    await screen.findByText('Sunny 2BR in Kadriorg');

    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('hides Edit and Delete controls for a listing the user does not own', async () => {
    (api.getProperty as Mock).mockResolvedValue(makeProperty({ isOwn: false }));

    renderDetails();

    await screen.findByText('Sunny 2BR in Kadriorg');

    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('hides Edit and Delete controls for an anonymous viewer', async () => {
    (api.getProperty as Mock).mockResolvedValue(makeProperty());

    renderDetails();

    await screen.findByText('Sunny 2BR in Kadriorg');

    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
