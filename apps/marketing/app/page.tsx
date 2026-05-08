import { Button } from "@/components/Button";

const features = [
  {
    title: "Multi-Source Capture",
    description:
      "Text notes, screenshots, voice recordings, PDFs, and web links — all in one place.",
    icon: "📥",
  },
  {
    title: "AI-Powered Extraction",
    description:
      "Automatic text recognition, document summarisation, voice transcription, and topic tagging.",
    icon: "🧠",
  },
  {
    title: "Instant Recall",
    description:
      "Full-text search and natural language queries. Ask questions, get answers from your knowledge base.",
    icon: "⚡",
  },
  {
    title: "Weekly Summaries",
    description:
      "AI-generated digests of your learning progress, recurring themes, and knowledge gaps.",
    icon: "📊",
  },
  {
    title: "Knowledge Graph",
    description:
      "Visualise connections between topics. See how your knowledge links together.",
    icon: "🕸️",
  },
  {
    title: "Exam-Ready",
    description:
      "Purpose-built for medical students and healthcare professionals preparing for exams.",
    icon: "🎓",
  },
];

const socialProof = [
  { stat: "10,000+", label: "Medical facts captured" },
  { stat: "98%", label: "Recall accuracy" },
  { stat: "4.9★", label: "App Store rating" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Your medical knowledge,
            <br />
            <span className="text-brand-500">always at your fingertips</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            DocVault is an AI-powered memory assistant that captures, organises, and recalls
            medical knowledge — so you can focus on what matters: patient care and exam success.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="https://app.docvault.uk/auth/sign-in" size="lg">
              Get Started Free
            </Button>
            <Button href="/pricing" variant="secondary" size="lg">
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {socialProof.map((item) => (
              <div key={item.label}>
                <div className="text-2xl sm:text-3xl font-bold text-brand-500">{item.stat}</div>
                <div className="mt-1 text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to master medical knowledge
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From capture to recall, DocVault handles the entire knowledge lifecycle.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to supercharge your medical revision?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Join thousands of medical students and healthcare professionals using DocVault.
          </p>
          <div className="mt-8">
            <Button
              href="https://app.docvault.uk/auth/sign-in"
              variant="secondary"
              size="lg"
            >
              Start Free — No Credit Card Required
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
