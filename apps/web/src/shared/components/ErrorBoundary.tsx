import { Component } from 'react';
import type { ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort UI safety net (A10: server-side request forgery & unhandled
 * failure surfaces apply to the client too). Catches render-time errors
 * anywhere below it in the tree and shows a generic fallback instead of a
 * blank/broken page.
 *
 * Fails safe: the caught error is only logged for diagnostics, never
 * rendered. Surfacing stack traces or messages in the UI can leak internal
 * implementation details to an attacker, so the fallback is always the same
 * generic copy regardless of what actually broke.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    console.error('Unhandled UI error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6">
          <ErrorState
            message="Something went wrong. Please reload the page."
            retryLabel="Reload page"
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
