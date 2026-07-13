import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// The create CTA is shown only to authenticated users; visitors are
// invited to log in instead (the /create route is protected anyway).
export function PromoBanner() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  const authenticated = status === 'authenticated';

  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold">Create listings with AI</p>
        <p className="text-xs text-emerald-50">
          {authenticated
            ? 'Turn a few property details into a polished listing in seconds.'
            : 'Log in to turn a few property details into a polished listing in seconds.'}
        </p>
      </div>
      <Link
        to={authenticated ? '/create' : '/login'}
        state={authenticated ? undefined : { from: '/create' }}
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
      >
        {authenticated ? 'Create a listing' : 'Log in to create'}
      </Link>
    </div>
  );
}
