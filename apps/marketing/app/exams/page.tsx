import type { Metadata } from "next";
import { Button } from "@/components/Button";

export const metadata: Metadata = {
  title: "Exams",
  description:
    "How DocVault helps medical students ace UKMLA, MRCP, PLAB, and other medical exams.",
};

const exams = [
  {
    name: "UKMLA (MLA)",
    description:
      "The UK Medical Licensing Assessment. DocVault helps you organise clinical knowledge across all MLA content areas.",
  },
  {
    name: "MRCP Part 1 & 2",
    description:
      "Membership of the Royal Colleges of Physicians. Capture and recall complex clinical scenarios and best-of-five answers.",
  },
  {
    name: "PLAB 1 & 2",
    description:
      "Professional and Linguistic Assessments Board. Build your UK clinical knowledge base from day one.",
  },
  {
    name: "MRCGP",
    description:
      "Membership of the Royal College of General Practitioners. Organise primary care knowledge and CSA scenarios.",
  },
  {
    name: "FRCS",
    description:
      "Fellowship of the Royal College of Surgeons. Capture operative notes, anatomy, and surgical decision-making.",
  },
  {
    name: "Finals & OSCEs",
    description:
      "Medical school finals and clinical examinations. Build structured revision notes with AI-powered recall.",
  },
];

const workflow = [
  {
    step: "1",
    title: "Capture",
    description: "Photograph lecture slides, record ward-round pearls, save guideline PDFs.",
  },
  {
    step: "2",
    title: "Extract",
    description: "AI automatically transcribes, summarises, and tags by topic and system.",
  },
  {
    step: "3",
    title: "Recall",
    description: "Ask natural language questions: 'What are the causes of raised JVP?'",
  },
  {
    step: "4",
    title: "Review",
    description: "Weekly AI summaries highlight gaps and suggest revision priorities.",
  },
];

export default function ExamsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Built for medical exams
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Whether you&apos;re preparing for UKMLA, MRCP, PLAB, or finals — DocVault adapts to
            your revision workflow and helps you retain more, faster.
          </p>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How it works for exam revision
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {workflow.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported exams */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Supported exams
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.name} className="p-6 bg-white rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{exam.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <h2 className="text-2xl font-bold text-gray-900">Start revising smarter today</h2>
        <p className="mt-2 text-gray-500">Free plan includes 50 memories per month.</p>
        <div className="mt-6">
          <Button href="https://app.docvault.uk/auth/sign-in" size="lg">
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
