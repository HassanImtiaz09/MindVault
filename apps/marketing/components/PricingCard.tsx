import Link from "next/link";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-8 flex flex-col",
        highlighted
          ? "border-brand-500 shadow-lg shadow-brand-100 ring-1 ring-brand-500"
          : "border-gray-200"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {period && <span className="text-sm text-gray-500 ml-1">{period}</span>}
      </div>
      <ul className="mt-8 space-y-3 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={cn(
          "mt-8 block text-center px-6 py-3 rounded-lg text-sm font-semibold transition-colors",
          highlighted
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        )}
      >
        {cta}
      </Link>
    </div>
  );
}
