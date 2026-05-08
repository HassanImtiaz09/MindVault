import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about DocVault.",
};

const faqs = [
  {
    q: "What is DocVault?",
    a: "DocVault is an AI study and coaching platform built by an NHS doctor for UK medical students and doctors. It combines a personal medical vault, adaptive study plans, AI-generated refresher videos, a voice OSCE simulator, and a doctor marketplace — everything you need to pass exams and stay sharp throughout your career.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We store data in EU data centres (AWS eu-central-1) and comply with UK GDPR. We never sell your data or use it to train AI models. See our Privacy Policy and DPIA for full details.",
  },
  {
    q: "Which platforms does DocVault support?",
    a: "DocVault is available as a native mobile app for iOS and Android, plus a web application at app.docvault.uk. Your data syncs seamlessly across all devices.",
  },
  {
    q: "Can I use DocVault offline?",
    a: "You can capture text notes and images offline. They will sync and be processed by AI once you reconnect. Voice transcription and natural language queries require an internet connection.",
  },
  {
    q: "What AI models does DocVault use?",
    a: "We use a combination of leading AI models via our model router, selecting the best model for each task (transcription, summarisation, extraction, Q&A). We never send your data to third parties for model training.",
  },
  {
    q: "How does the Free plan differ from Pro?",
    a: "The Free plan includes 30 saves per month, 1 Daily 5 quiz, 1 voice OSCE session per week, and 200 SBA preview questions (no mock exams). Pro Student (£8.99/month or £71/year, verified .ac.uk only) unlocks full UKMLA + PSA question banks, 6 mocks per year, 60 min/week OSCE practice, a daily study plan, and weekly progress reports. Pro Doctor (£17.99/month) adds postgraduate exam banks and 180 min/week OSCE. See our Pricing page for the full comparison.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export all your memories as Markdown files at any time from the app settings. We believe in data portability — your knowledge belongs to you.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes — Pro Student is exclusively for verified UK medical students at £8.99/month (or £71/year, saving 34%). You must verify with a .ac.uk email address. For medical schools wanting institutional licences, contact us at sales@docvault.uk.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel anytime from your account settings. Your data remains accessible on the Free plan after cancellation. We do not charge cancellation fees.",
  },
  {
    q: "What file formats are supported?",
    a: "DocVault supports plain text, images (JPEG, PNG, HEIC), voice recordings (M4A, MP3, WAV), PDFs, DOCX files, and web links. We continuously add support for more formats.",
  },
];

export default function FAQPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need to know about DocVault.
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-gray-100 pb-8">
              <h2 className="text-lg font-semibold text-gray-900">{faq.q}</h2>
              <p className="mt-3 text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center p-8 bg-gray-50 rounded-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Still have questions?</h2>
          <p className="mt-2 text-gray-500">
            Email us at{" "}
            <a href="mailto:support@docvault.uk" className="text-brand-500 font-medium hover:underline">
              support@docvault.uk
            </a>{" "}
            and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
