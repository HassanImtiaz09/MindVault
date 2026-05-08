import type { Metadata } from "next";
import { PricingCard } from "@/components/PricingCard";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for medical students and healthcare teams.",
};

const tiers = [
  {
    name: "Free",
    price: "£0",
    period: "",
    description: "Get started with core features. No credit card required.",
    features: [
      "50 memories per month",
      "Text and image capture",
      "Basic AI extraction",
      "Full-text search",
      "1 GB storage",
    ],
    cta: "Get Started Free",
    href: "https://app.docvault.uk/auth/sign-in",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "£9.99",
    period: "/month",
    description: "Unlimited knowledge capture for serious learners.",
    features: [
      "Unlimited memories",
      "All capture types (voice, PDF, web)",
      "Advanced AI extraction & summaries",
      "Natural language queries",
      "Weekly AI digests",
      "Knowledge graph visualisation",
      "25 GB storage",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    href: "https://app.docvault.uk/auth/sign-in?plan=pro",
    highlighted: true,
  },
  {
    name: "Teams",
    price: "£24.99",
    period: "/user/month",
    description: "Shared vaults and admin controls for clinical teams.",
    features: [
      "Everything in Pro",
      "Shared team vaults",
      "Role-based access control",
      "Admin dashboard & analytics",
      "SSO / SAML integration",
      "API access",
      "100 GB storage per user",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@docvault.uk?subject=Teams%20Plan%20Enquiry",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Start free, upgrade when you need more. All plans include a 14-day free trial of Pro features.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Have questions?{" "}
            <a href="/faq" className="text-brand-500 font-medium hover:underline">
              Check our FAQ
            </a>{" "}
            or{" "}
            <a href="mailto:support@docvault.uk" className="text-brand-500 font-medium hover:underline">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
