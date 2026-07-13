import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import * as api from '../../shared/api/endpoints';
import { Button } from '../../shared/components/Button';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** Edit/delete controls for the listing owner. Server enforces ownership independently. */
export function OwnerActions({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    setDeleting(true);
    setErrorMessage(null);
    api
      .deleteProperty(propertyId)
      .then(() => navigate('/'))
      .catch((error: unknown) => {
        setErrorMessage(error instanceof ApiError ? error.message : DEFAULT_ERROR_MESSAGE);
        setDeleting(false);
      });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/properties/${propertyId}/edit`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
        >
          Edit
        </Link>

        {!confirming && (
          <Button type="button" variant="danger" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        )}
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <span className="text-sm text-red-700">Delete this listing? This cannot be undone.</span>
          <Button
            type="button"
            variant="danger"
            loading={deleting}
            disabled={deleting}
            onClick={handleDelete}
          >
            Confirm delete
          </Button>
          <Button type="button" variant="ghost" disabled={deleting} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
