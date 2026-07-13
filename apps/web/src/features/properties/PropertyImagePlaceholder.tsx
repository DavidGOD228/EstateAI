import type { PropertyType } from '@estateai/shared-types';

const GRADIENTS: Record<PropertyType, string> = {
  apartment: 'from-sky-400 to-indigo-500',
  house: 'from-emerald-400 to-teal-600',
  studio: 'from-amber-400 to-orange-500',
  townhouse: 'from-rose-400 to-pink-600',
};

/** CSS-only image placeholder: gradient + abstract building silhouette + type chip. No external images. */
export function PropertyImagePlaceholder({
  propertyType,
  className = '',
}: {
  propertyType: PropertyType;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-end overflow-hidden bg-gradient-to-br ${GRADIENTS[propertyType]} ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        className="h-2/3 w-full text-white/25"
      >
        <path
          fill="currentColor"
          d="M0 100V58l22-14v9l18-11v13l24-15v17l20-9v11l28-17v21l22-9v13l30-8v19l20-5V100Z"
        />
      </svg>
      <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        {propertyType}
      </span>
    </div>
  );
}
