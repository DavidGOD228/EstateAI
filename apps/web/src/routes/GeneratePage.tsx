import { GeneratorForm } from '../features/ai/generator/GeneratorForm';
import { ResultPanel } from '../features/ai/generator/ResultPanel';
import { useListingGenerator } from '../features/ai/generator/useListingGenerator';

export function GeneratePage() {
  const { values, errors, status, result, errorMessage, setField, handleSubmit, retry } =
    useListingGenerator();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Smart Listing Generator</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fill in the property details and let AI write a polished listing.
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
        <ResultPanel status={status} result={result} errorMessage={errorMessage} onRetry={retry} />
      </div>
    </div>
  );
}
