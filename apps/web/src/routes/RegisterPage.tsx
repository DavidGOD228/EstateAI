import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { RegisterForm } from '../features/auth/RegisterForm';
import { resolveSafeInternalPath } from '../features/auth/resolveSafeInternalPath';

export function RegisterPage() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  const from = resolveSafeInternalPath(location.state);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-8 sm:py-12">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Join EstateAI to save searches and generate listings.
          </p>
        </div>
        <RegisterForm from={from} />
      </div>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" state={{ from }} className="font-medium text-emerald-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
