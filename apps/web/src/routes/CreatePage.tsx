import { useEffect, useState } from 'react';
import { GeneratorForm } from '../features/ai/generator/GeneratorForm';
import { ResultPanel } from '../features/ai/generator/ResultPanel';
import { useListingGenerator } from '../features/ai/generator/useListingGenerator';
import { DraftEditor } from '../features/properties/create/DraftEditor';

export function CreatePage() {
  const { values, errors, status, result, errorMessage, setField, handleSubmit, retry } =
    useListingGenerator();
  const [mode, setMode] = useState<'form' | 'draft'>('form');
  const [draftKey, setDraftKey] = useState(0);

  // Once the AI has generated a listing, move straight into the editable
  // draft step. Each successful generation gets a fresh draft (new key) so
  // edits from a previous round never leak into a regenerated one.
  useEffect(() => {
    if (status === 'success' && result) {
      setMode('draft');
      setDraftKey((key) => key + 1);
    }
  }, [status, result]);

  if (mode === 'draft' && result) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Create a listing</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review and edit the AI draft, then publish it as a live listing.
          </p>
        </div>

        <DraftEditor
          key={draftKey}
          result={result}
          formValues={values}
          onBackToForm={() => setMode('form')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create a listing</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fill in the property details and let AI write a polished draft you can edit and publish.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <GeneratorForm
          values={values}
          errors={errors}
          pending={status === 'loading'}
          onFieldChange={setField}
          onSubmit={handleSubmit}
        />
        <ResultPanel
          status={status === 'success' ? 'idle' : status}
          result={null}
          errorMessage={errorMessage}
          onRetry={retry}
        />
      </div>
    </div>
  );
}
