import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "DocVault Terms of Service — the agreement governing your use of the Service.",
};

export default function TermsPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 8 May 2026</p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          By accessing or using DocVault (the &quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Description of Service</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          DocVault is an AI-powered knowledge management application that allows users to capture, organise, and recall information from multiple sources. The Service is provided as a mobile application and web application.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Accounts</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          You must provide a valid email address to create an account. You are responsible for maintaining the security of your account. You must be at least 16 years old to use the Service.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Acceptable Use</h2>
        <p className="text-gray-600 leading-relaxed mb-4">You agree not to:</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li>Use the Service for any unlawful purpose.</li>
          <li>Upload content that infringes third-party intellectual property rights.</li>
          <li>Attempt to reverse-engineer, decompile, or disassemble the Service.</li>
          <li>Use automated systems to access the Service without permission.</li>
          <li>Store patient-identifiable health data without appropriate consent and safeguards.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Content Ownership</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          You retain full ownership of all content you upload to DocVault. By uploading content, you grant us a limited licence to process, store, and display it back to you as part of the Service. We do not claim ownership of your content.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Subscriptions and Payment</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Paid plans are billed monthly or annually in advance. Prices are in GBP and inclusive of VAT where applicable. You may cancel at any time; access continues until the end of the billing period.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Service Availability</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We aim for 99.9% uptime but do not guarantee uninterrupted access. We may perform scheduled maintenance with reasonable notice. We are not liable for downtime caused by factors outside our control.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          DocVault is a knowledge management tool, not a medical device. It does not provide medical advice. You should not rely solely on DocVault for clinical decision-making. To the maximum extent permitted by law, our liability is limited to the amount you paid for the Service in the 12 months preceding the claim.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Termination</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We may suspend or terminate your account if you violate these Terms. Upon termination, you may export your data within 30 days. After 30 days, your data will be permanently deleted.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">10. Governing Law</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">11. Changes to Terms</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We may update these Terms from time to time. Material changes will be communicated via email at least 30 days before taking effect. Continued use after changes constitutes acceptance.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">12. Contact</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          For questions about these Terms, contact us at:{" "}
          <a href="mailto:legal@docvault.uk" className="text-brand-500 hover:underline">legal@docvault.uk</a>
        </p>
      </div>
    </div>
  );
}
