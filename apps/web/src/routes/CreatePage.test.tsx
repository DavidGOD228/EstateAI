import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { GenerateListingResponse, PropertyDto } from '@estateai/shared-types';
import { CreatePage } from './CreatePage';

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

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Kadriorg, Tallinn' } });
  fireEvent.change(screen.getByLabelText('Price (EUR)'), { target: { value: '150000' } });
  fireEvent.change(screen.getByLabelText('Bedrooms'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Bathrooms'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Size (m²)'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Property type'), { target: { value: 'apartment' } });
}

function renderCreatePage() {
  return render(
    <MemoryRouter>
      <CreatePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('CreatePage', () => {
  it('shows validation errors on empty submit and does not call generateListing', () => {
    renderCreatePage();

    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));

    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a price greater than 0.')).toBeInTheDocument();
    expect(screen.getByText('Select a property type.')).toBeInTheDocument();
    expect(api.generateListing).not.toHaveBeenCalled();
  });

  it('pre-fills the editable draft after generating, then publishes the edited values', async () => {
    const response: GenerateListingResponse = {
      headline: 'Bright Apartment in the Heart of Tallinn',
      description: 'A wonderful home.\n\nClose to everything you need.',
      highlights: ['Renovated kitchen', 'Quiet street'],
      targetAudience: 'Young professionals',
    };
    (api.generateListing as Mock).mockResolvedValue(response);

    const created: PropertyDto = {
      id: 'new-prop-1',
      title: 'Edited Title',
      description: 'Edited description text.',
      price: 150000,
      address: 'Kadriorg',
      city: 'Tallinn',
      country: 'Estonia',
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 60,
      propertyType: 'apartment',
      features: ['Renovated kitchen', 'Quiet street'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      isOwn: true,
    };
    (api.createProperty as Mock).mockResolvedValue(created);

    renderCreatePage();

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));

    const titleInput = await screen.findByLabelText('Title');
    expect(titleInput).toHaveValue('Bright Apartment in the Heart of Tallinn');

    const descriptionInput = screen.getByLabelText('Description');
    expect(descriptionInput).toHaveValue('A wonderful home.\n\nClose to everything you need.');

    expect(screen.getByText('Renovated kitchen')).toBeInTheDocument();
    expect(screen.getByText('Quiet street')).toBeInTheDocument();

    expect(screen.getByLabelText('Address')).toHaveValue('Kadriorg');
    expect(screen.getByLabelText('City')).toHaveValue('Tallinn');
    expect(screen.getByLabelText('Country')).toHaveValue('Estonia');

    fireEvent.change(titleInput, { target: { value: 'Edited Title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Edited description text.' } });

    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));

    await waitFor(() => {
      expect(api.createProperty).toHaveBeenCalledWith({
        title: 'Edited Title',
        description: 'Edited description text.',
        price: 150000,
        address: 'Kadriorg',
        city: 'Tallinn',
        country: 'Estonia',
        bedrooms: 2,
        bathrooms: 1,
        areaSqm: 60,
        propertyType: 'apartment',
        features: ['Renovated kitchen', 'Quiet street'],
      });
    });
  });

  it('adds and removes feature tags in the draft editor', async () => {
    const response: GenerateListingResponse = {
      headline: 'Cozy Studio near the Old Town',
      description: 'A great place to live.',
      highlights: ['Sea view'],
      targetAudience: 'Students',
    };
    (api.generateListing as Mock).mockResolvedValue(response);

    renderCreatePage();

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));

    await screen.findByLabelText('Title');
    expect(screen.getByText('Sea view')).toBeInTheDocument();

    const featureInput = screen.getByLabelText('Feature tags');
    fireEvent.change(featureInput, { target: { value: 'Parking' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Parking')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Sea view' }));
    expect(screen.queryByText('Sea view')).not.toBeInTheDocument();
  });
});
