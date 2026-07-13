import { Link } from 'react-router-dom';
import { EmptyState } from '../shared/components/EmptyState';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      message="The page you are looking for does not exist or has moved."
      action={
        <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">
          Back to listings
        </Link>
      }
    />
  );
}
