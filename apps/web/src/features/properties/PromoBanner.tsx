import { Link } from 'react-router-dom';

export function PromoBanner() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold">Create listings with AI</p>
        <p className="text-xs text-emerald-50">Turn a few property details into a polished listing in seconds.</p>
      </div>
      <Link
        to="/generate"
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
      >
        Try the generator
      </Link>
    </div>
  );
}
