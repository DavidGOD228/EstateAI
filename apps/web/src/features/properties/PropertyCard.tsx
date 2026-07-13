import { Link } from 'react-router-dom';
import type { PropertyDto } from '@estateai/shared-types';
import { OwnListingBadge } from '../../shared/components/OwnListingBadge';
import { PropertyImagePlaceholder } from './PropertyImagePlaceholder';
import { formatPrice } from './formatPrice';

export function PropertyCard({ property }: { property: PropertyDto }) {
  const { id, title, city, address, price, bedrooms, bathrooms, areaSqm, propertyType, features, isOwn } =
    property;

  return (
    <Link
      to={`/properties/${id}`}
      aria-label={`${title}, ${city}, ${formatPrice(price)}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
    >
      <PropertyImagePlaceholder propertyType={propertyType} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {isOwn && <OwnListingBadge />}
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
              {title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
            {propertyType}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {city} &middot; {address}
        </p>
        <p className="text-base font-semibold text-slate-900">{formatPrice(price)}</p>
        <p className="text-xs text-slate-600">
          {bedrooms} bd &middot; {bathrooms} ba &middot; {areaSqm} m&sup2;
        </p>
        {features.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {features.slice(0, 2).map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
