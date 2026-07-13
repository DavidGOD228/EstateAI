const sizes = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-10 border-4',
} as const;

export function Spinner({
  size = 'md',
  label,
}: {
  size?: keyof typeof sizes;
  label?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-block animate-spin rounded-full border-slate-300 border-t-emerald-600 ${sizes[size]}`}
      />
      <span className={label ? 'text-sm text-slate-600' : 'sr-only'}>{label ?? 'Loading'}</span>
    </span>
  );
}
