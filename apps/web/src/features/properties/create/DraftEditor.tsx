import { useEffect, useRef, useState } from 'react';
import type { GenerateListingResponse } from '@estateai/shared-types';
import { Button } from '../../../shared/components/Button';
import { Input, Select, Textarea } from '../../../shared/components/Input';
import { PROPERTY_TYPES } from '../../ai/generator/options';
import type { FormValues } from '../../ai/generator/types';
import { formatDraftForClipboard } from './clipboardDraft';
import { FeatureTagsEditor } from './FeatureTagsEditor';
import {
  MAX_ADDRESS_LENGTH,
  MAX_CITY_LENGTH,
  MAX_COUNTRY_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_ROOMS,
  MAX_TITLE_LENGTH,
} from './types';
import type { DraftValues } from './types';
import { useDraftPublish } from './useDraftPublish';

const COPY_CONFIRMATION_MS = 2000;

export function DraftEditor({
  result,
  formValues,
  onBackToForm,
}: {
  result: GenerateListingResponse;
  formValues: FormValues;
  onBackToForm: () => void;
}) {
  const { values, errors, status, errorMessage, setField, addFeature, removeFeature, publish } =
    useDraftPublish(result, formValues);
  const pending = status === 'submitting';

  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatDraftForClipboard(values, result.targetAudience));
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPY_CONFIRMATION_MS);
    } catch {
      // Clipboard access can be denied or unavailable (permissions, insecure context); ignore.
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Review and publish</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit the AI draft below, then publish it as a live listing.
          </p>
        </div>
        <Button type="button" variant="ghost" disabled={pending} onClick={onBackToForm}>
          ← Regenerate
        </Button>
      </div>

      <Input
        label="Title"
        value={values.title}
        maxLength={MAX_TITLE_LENGTH}
        error={errors.title}
        disabled={pending}
        required
        onChange={(event) => setField('title', event.target.value)}
      />

      <Textarea
        label="Description"
        value={values.description}
        maxLength={MAX_DESCRIPTION_LENGTH}
        error={errors.description}
        disabled={pending}
        required
        className="min-h-40"
        onChange={(event) => setField('description', event.target.value)}
      />

      <div>
        <FeatureTagsEditor
          features={values.features}
          onAdd={addFeature}
          onRemove={removeFeature}
          disabled={pending}
        />
        {errors.features && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {errors.features}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          onChange={(event) => setField('price', event.target.value)}
        />
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
          onChange={(event) => setField('bedrooms', event.target.value)}
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
          onChange={(event) => setField('bathrooms', event.target.value)}
        />
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
          onChange={(event) => setField('areaSqm', event.target.value)}
        />
      </div>

      <Select
        label="Property type"
        value={values.propertyType}
        error={errors.propertyType}
        disabled={pending}
        required
        onChange={(event) => setField('propertyType', event.target.value as DraftValues['propertyType'])}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Address"
          placeholder="Street and number"
          value={values.address}
          maxLength={MAX_ADDRESS_LENGTH}
          error={errors.address}
          disabled={pending}
          required
          onChange={(event) => setField('address', event.target.value)}
        />
        <Input
          label="City"
          value={values.city}
          maxLength={MAX_CITY_LENGTH}
          error={errors.city}
          disabled={pending}
          required
          onChange={(event) => setField('city', event.target.value)}
        />
        <Input
          label="Country"
          value={values.country}
          maxLength={MAX_COUNTRY_LENGTH}
          error={errors.country}
          disabled={pending}
          required
          onChange={(event) => setField('country', event.target.value)}
        />
      </div>

      <p className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">Target audience:</span> {result.targetAudience}
      </p>

      {status === 'error' && errorMessage && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" loading={pending} disabled={pending} onClick={publish}>
          Publish listing
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => void handleCopy()}>
          {copied ? 'Copied' : 'Copy listing'}
        </Button>
      </div>
    </div>
  );
}
