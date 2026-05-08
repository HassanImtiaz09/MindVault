import type { Metadata } from "next";
import { PricingCard } from "@/components/PricingCard";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent pricing for UK medical students and doctors. Start free, upgrade when you're ready.",
};

// TODO: wire to feature_flags (M0.6+)
const tiers = [
  {
    name: "Free",
    price: "£0",
    period: "",
    description:
      "Try DocVault risk-free. No credit card required.",
    features: [
      "30 saves per month",
      "1 Daily 5 quiz",
      "1 voice OSCE session per week",
      "200 SBA preview questions",
      "No mock exams",
    ],
    cta: "Get Started Free",
    href: "https://app.docvault.uk/auth/sign-in",
    highlighted: false,
  },
  {
    name: "Pro Student",
    price: "£8.99",
    period: "/month",
    description:
      "Full exam prep for verified UK medical students (£71/year).",
    features: [
      "Full UKMLA + PSA question banks",
      "6 mock exams per year",
      "OSCE Practice — 60 min/week",
      "Adaptive daily study plan",
      "Weekly progress report",
      "Verified .ac.uk email required",
    ],
    cta: "Start Student Plan",
    href: "https://app.docvault.uk/auth/sign-in?plan=pro-student",
    highlighted: true,
  },
  {
    name: "Pro Doctor",
    price: "£17.99",
    period: "/month",
    description:
      "Postgraduate exam prep and career tools (£143/year).",
    features: [
      "Everything in Pro Student",
      "MRCS / MRCP / MRCGP / MRCEM banks",
      "OSCE Practice — 180 min/week",
      "Portfolio sync",
      "Marketplace publishing",
    ],
    cta: "Start Doctor Plan",
    href: "https://app.docvault.uk/auth/sign-in?plan=pro-doctor",
    highlighted: false,
  },
  {
    name: "Specialist",
    price: "£32.99",
    period: "/month",
    description:
      "Maximum preparation with premium features (£279/year).",
    features: [
      "Everything in Pro Doctor",
      "Tier-3 specialist banks (FRCR, FRCA, etc.)",
      "Tavus video avatar tutor",
      "Unlimited OSCE sessions",
      "2 free Full Mocks per month",
    ],
    cta: "Start Specialist Plan",
    href: "https://app.docvault.uk/auth/sign-in?plan=specialist",
    highlighted: false,
  },
];

// TODO: wire to feature_flags (M0.6+)
const oneShots = [
  {
    name: "Mini Mock",
    price: "£19.99",
    description: "Timed 50-question mock under exam conditions.",
  },
  {
    name: "Half Mock",
    price: "£39.99",
    description: "100-question mock with full analytics report.",
  },
  {
    name: "Full Mock",
    price: "£79",
    description: "Complete exam simulation with detailed breakdown.",
  },
  {
    name: "Premium Mock Day",
    price: "£179",
    description: "Full-day simulation with live AI proctor and debrief.",
  },
  {
    name: "Pre-Exam Boost",
    price: "£49",
    description: "30-day intensive plan: daily questions, weak-area focus, and progress tracking.",
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">
            Transparent pricing for every stage
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            From medical school to specialty training. Start free, upgrade when
            you&apos;re ready. Annual plans save up to 34%.
          </p>
        </div>

        {/* Subscription tiers */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        {/* One-shot products */}
        <div className="mt-24 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            One-off exam products
          </h2>
          <p className="text-center text-gray-500 mb-10">
            No subscription required. Pay once, use within 12 months.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {oneShots.map((product) => (
              <div
                key={product.name}
                className="border border-gray-200 rounded-xl p-6 hover:border-brand-300 transition-colors"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <span className="text-lg font-bold text-brand-600">
                    {product.price}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{product.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Have questions?{" "}
            <a
              href="/faq"
              className="text-brand-500 font-medium hover:underline"
            >
              Check our FAQ
            </a>{" "}
            or{" "}
            <a
              href="mailto:support@docvault.uk"
              className="text-brand-500 font-medium hover:underline"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
