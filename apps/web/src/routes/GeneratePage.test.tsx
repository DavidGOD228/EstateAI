import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { GenerateListingResponse } from '@estateai/shared-types';
import { GeneratePage } from './GeneratePage';

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

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Tallinn' } });
  fireEvent.change(screen.getByLabelText('Price (EUR)'), { target: { value: '150000' } });
  fireEvent.change(screen.getByLabelText('Bedrooms'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Bathrooms'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Size (m²)'), { target: { value: '60' } });
  fireEvent.change(screen.getByLabelText('Property type'), { target: { value: 'apartment' } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('GeneratePage', () => {
  it('shows validation errors on empty submit and does not call generateListing', () => {
    render(<GeneratePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));

    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(screen.getByText('Enter a price greater than 0.')).toBeInTheDocument();
    expect(screen.getByText('Select a property type.')).toBeInTheDocument();
    expect(api.generateListing).not.toHaveBeenCalled();
  });

  it('renders the generated listing and a copy button on success', async () => {
    const response: GenerateListingResponse = {
      headline: 'Bright Apartment in the Heart of Tallinn',
      description: 'A wonderful home.\n\nClose to everything you need.',
      highlights: ['Renovated kitchen', 'Quiet street'],
      targetAudience: 'Young professionals',
    };
    (api.generateListing as Mock).mockResolvedValue(response);

    render(<GeneratePage />);

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));

    expect(await screen.findByText('Bright Apartment in the Heart of Tallinn')).toBeInTheDocument();
    expect(screen.getByText('Renovated kitchen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy listing' })).toBeInTheDocument();

    await waitFor(() => {
      expect(api.generateListing).toHaveBeenCalledWith({
        location: 'Tallinn',
        price: 150000,
        bedrooms: 2,
        bathrooms: 1,
        areaSqm: 60,
        propertyType: 'apartment',
        tone: 'professional',
      });
    });
  });
});
