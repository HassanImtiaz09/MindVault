import { Button } from "@/components/Button";

const surfaces = [
  {
    title: "Personal Vault",
    description:
      "Save clinical pearls, guidelines, and study notes in one searchable place. AI extracts key facts from PDFs, voice recordings, and web links automatically.",
    icon: "🗄️",
  },
  {
    title: "Adaptive Study Plan",
    description:
      "A daily plan that adjusts to your weak areas, exam date, and available time. Spaced repetition meets intelligent scheduling.",
    icon: "📋",
  },
  {
    title: "AI Refresher Videos",
    description:
      "Short, AI-generated video summaries of topics you're revising. Visual learning backed by your own notes and the latest guidelines.",
    icon: "🎬",
  },
  {
    title: "Voice OSCE Simulator",
    description:
      "Practise clinical stations with a real-time AI examiner. Get scored on communication, clinical reasoning, and time management.",
    icon: "🎙️",
  },
  {
    title: "Doctor Marketplace",
    description:
      "Buy and sell revision resources created by doctors who've passed. Vetted content, fair royalties, peer-reviewed quality.",
    icon: "🏪",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            The AI study coach
            <br />
            <span className="text-brand-500">built by an NHS doctor</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            DocVault combines a personal medical vault, adaptive study plans,
            AI-generated refresher videos, and a voice OSCE simulator — everything
            UK medical students and doctors need to pass exams and stay sharp.
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

      {/* Credibility block */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Built by a practising NHS doctor, for doctors
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            DocVault was created by Dr Hassan Imtiaz — an NHS doctor who experienced
            first-hand the fragmented, outdated exam prep landscape in UK medicine.
            Every feature is designed around the real workflow of medical students and
            trainees: capturing knowledge on the ward, revising efficiently around
            shifts, and practising clinical skills without expensive courses. The
            content is aligned to Royal College curricula and built exclusively from
            public sources (NICE, BNF, GMC frameworks) — never paraphrased from
            commercial question banks.
          </p>
        </div>
      </section>

      {/* Five product surfaces */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Five surfaces, one platform
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From capturing clinical pearls to sitting a full mock OSCE — DocVault
              covers every stage of your medical career.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {surfaces.map((surface) => (
              <div
                key={surface.title}
                className="p-6 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors"
              >
                <div className="text-3xl mb-4">{surface.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {surface.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {surface.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to study smarter?
          </h2>
          <p className="mt-4 text-lg text-brand-100">
            Start free with 30 saves per month, a daily quiz, and weekly OSCE
            practice. No credit card required.
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
