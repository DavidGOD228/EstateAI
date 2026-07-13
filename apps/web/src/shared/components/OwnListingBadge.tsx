/** Small badge marking a listing as created by the current user. */
export function OwnListingBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="Your listing"
      className={`inline-flex shrink-0 items-center text-amber-500 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85L10 1.5z" />
      </svg>
      <span className="sr-only">Your listing</span>
    </span>
  );
}
