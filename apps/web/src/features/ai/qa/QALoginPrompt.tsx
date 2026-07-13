import { Link } from 'react-router-dom';

export function QALoginPrompt() {
  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Ask AI about this property</h2>
      <p className="text-sm text-slate-600">
        Log in to ask AI questions about this listing and get an instant answer.
      </p>
      <Link
        to="/login"
        className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Log in
      </Link>
    </aside>
  );
}
