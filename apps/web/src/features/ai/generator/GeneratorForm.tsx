import type { FormEvent } from 'react';
import { Button } from '../../../shared/components/Button';
import { Input, Select, Textarea } from '../../../shared/components/Input';
import { PROPERTY_TYPES, TONES } from './options';
import { MAX_FEATURES_LENGTH, MAX_LOCATION_LENGTH, MAX_ROOMS } from './validation';
import type { FormErrors, FormValues } from './types';

export function GeneratorForm({
  values,
  errors,
  pending,
  onFieldChange,
  onSubmit,
}: {
  values: FormValues;
  errors: FormErrors;
  pending: boolean;
  onFieldChange: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <Input
        label="Location"
        placeholder="Kadriorg, Tallinn"
        value={values.location}
        maxLength={MAX_LOCATION_LENGTH}
        error={errors.location}
        disabled={pending}
        required
        onChange={(event) => onFieldChange('location', event.target.value)}
      />

      <Input
        label="Price (EUR)"
        type="number"
        min={0}
        step="1"
        inputMode="decimal"
        value={values.price}
        error={errors.price}
        disabled={pending}
        required
        onChange={(event) => onFieldChange('price', event.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Bedrooms"
          type="number"
          min={0}
          max={MAX_ROOMS}
          step={1}
          inputMode="numeric"
          value={values.bedrooms}
          error={errors.bedrooms}
          disabled={pending}
          required
          onChange={(event) => onFieldChange('bedrooms', event.target.value)}
        />
        <Input
          label="Bathrooms"
          type="number"
          min={0}
          max={MAX_ROOMS}
          step={1}
          inputMode="numeric"
          value={values.bathrooms}
          error={errors.bathrooms}
          disabled={pending}
          required
          onChange={(event) => onFieldChange('bathrooms', event.target.value)}
        />
      </div>

      <Input
        label="Size (m²)"
        type="number"
        min={0}
        step="1"
        inputMode="decimal"
        value={values.areaSqm}
        error={errors.areaSqm}
        disabled={pending}
        required
        onChange={(event) => onFieldChange('areaSqm', event.target.value)}
      />

      <Select
        label="Property type"
        value={values.propertyType}
        error={errors.propertyType}
        disabled={pending}
        required
        onChange={(event) =>
          onFieldChange('propertyType', event.target.value as FormValues['propertyType'])
        }
      >
        <option value="" disabled>
          Select a property type
        </option>
        {PROPERTY_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Textarea
        label="Optional features"
        placeholder="Balcony, renovated kitchen, quiet courtyard, close to tram stop"
        hint={`Free text — mention anything worth highlighting. ${values.optionalFeatures.length}/${MAX_FEATURES_LENGTH}`}
        value={values.optionalFeatures}
        maxLength={MAX_FEATURES_LENGTH}
        error={errors.optionalFeatures}
        disabled={pending}
        onChange={(event) => onFieldChange('optionalFeatures', event.target.value)}
      />

      <Select
        label="Tone"
        value={values.tone}
        disabled={pending}
        onChange={(event) => onFieldChange('tone', event.target.value as FormValues['tone'])}
      >
        {TONES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Button type="submit" variant="primary" loading={pending} disabled={pending} className="mt-2 w-full">
        Generate with AI
      </Button>
    </form>
  );
}
