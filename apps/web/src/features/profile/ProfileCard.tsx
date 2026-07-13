import type { UserDto } from '@estateai/shared-types';

const memberSinceFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProfileCard({ user }: { user: UserDto }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      <span
        aria-hidden="true"
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold text-white"
      >
        {initialsFor(user.name)}
      </span>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900">{user.name}</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      <p className="mt-4 text-sm text-slate-500">
        Member since {memberSinceFormatter.format(new Date(user.createdAt))}
      </p>
    </div>
  );
}
