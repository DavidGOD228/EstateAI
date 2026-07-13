import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

function navClass({ isActive }: { isActive: boolean }): string {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:text-slate-900'
  }`;
}

export function Header() {
  const { user, status } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="EstateAI home">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-bold text-white"
          >
            E
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">EstateAI</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            Browse
          </NavLink>
          <NavLink to="/generate" className={navClass}>
            Generate
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {status === 'authenticated' && user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white"
              >
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? '')
                  .join('')}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
