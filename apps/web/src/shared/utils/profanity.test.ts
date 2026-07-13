import { describe, expect, it } from 'vitest';
import { containsProfanity, PROFANITY_VIOLATION_MESSAGE } from './profanity';
import { validate } from '../../features/ai/generator/validation';
import { validateDraft, validateNewFeature } from '../../features/properties/create/validation';
import type { FormValues } from '../../features/ai/generator/types';
import type { DraftValues } from '../../features/properties/create/types';

const cleanFormValues: FormValues = {
  location: 'Kadriorg, Tallinn',
  price: '245000',
  bedrooms: '2',
  bathrooms: '1',
  areaSqm: '68',
  propertyType: 'apartment',
  optionalFeatures: 'Balcony, renovated kitchen',
  tone: 'professional',
};

const cleanDraftValues: DraftValues = {
  title: 'Bright flat in Kadriorg',
  description: 'A bright two-bedroom flat close to the park.',
  price: '245000',
  bedrooms: '2',
  bathrooms: '1',
  areaSqm: '68',
  propertyType: 'apartment',
  address: 'Poska 12',
  city: 'Tallinn',
  country: 'Estonia',
  features: ['Balcony'],
};

describe('containsProfanity', () => {
  it('flags profanity including simple obfuscation, but not clean text', () => {
    expect(containsProfanity('this flat is shit')).toBe(true);
    expect(containsProfanity('f@ck this listing')).toBe(true);
    expect(containsProfanity('bright renovated apartment near a park')).toBe(false);
    expect(containsProfanity('grass lawn and classic interior')).toBe(false);
  });
});

describe('generator form profanity validation', () => {
  it('rejects profane location and optionalFeatures with the violation message', () => {
    expect(validate({ ...cleanFormValues, location: 'Bitchville' }).location).toBe(PROFANITY_VIOLATION_MESSAGE);
    expect(validate({ ...cleanFormValues, optionalFeatures: 'shitty neighbors' }).optionalFeatures).toBe(
      PROFANITY_VIOLATION_MESSAGE,
    );
    expect(validate(cleanFormValues)).toEqual({});
  });
});

describe('create draft profanity validation', () => {
  it('rejects profane title, description, address, and feature tags', () => {
    expect(validateDraft({ ...cleanDraftValues, title: 'Shitty flat' }).title).toBe(PROFANITY_VIOLATION_MESSAGE);
    expect(validateDraft({ ...cleanDraftValues, description: 'No fucking parking.' }).description).toBe(
      PROFANITY_VIOLATION_MESSAGE,
    );
    expect(validateDraft({ ...cleanDraftValues, address: 'Asshole street 1' }).address).toBe(PROFANITY_VIOLATION_MESSAGE);
    expect(validateDraft({ ...cleanDraftValues, features: ['dumbass neighbors'] }).features).toBe(
      PROFANITY_VIOLATION_MESSAGE,
    );
    expect(validateDraft(cleanDraftValues)).toEqual({});
  });

  it('rejects adding a profane feature tag', () => {
    expect(validateNewFeature('dumbass neighbors', [])).toBe(PROFANITY_VIOLATION_MESSAGE);
    expect(validateNewFeature('Sauna', [])).toBeNull();
  });
});
