import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { MAX_FEATURES, MAX_FEATURE_LENGTH } from './types';
import { validateNewFeature } from './validation';

export function FeatureTagsEditor({
  features,
  onAdd,
  onRemove,
  disabled,
}: {
  features: string[];
  onAdd: (feature: string) => void;
  onRemove: (feature: string) => void;
  disabled?: boolean;
}) {
  const [candidate, setCandidate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const validationError = validateNewFeature(candidate, features);
    if (validationError) {
      setError(validationError);
      return;
    }
    onAdd(candidate.trim());
    setCandidate('');
    setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Feature tags"
            placeholder="e.g. Balcony"
            hint={`${features.length}/${MAX_FEATURES} added`}
            maxLength={MAX_FEATURE_LENGTH}
            value={candidate}
            disabled={disabled || features.length >= MAX_FEATURES}
            error={error ?? undefined}
            onChange={(event) => {
              setCandidate(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || features.length >= MAX_FEATURES}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>

      {features.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <li key={feature}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {feature}
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${feature}`}
                  onClick={() => onRemove(feature)}
                  className="rounded-full text-emerald-600 hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-emerald-300"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
