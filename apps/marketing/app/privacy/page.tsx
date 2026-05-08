import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "DocVault Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 8 May 2026</p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. Introduction</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          DocVault (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal data when you use the DocVault mobile application and web service (collectively, the &quot;Service&quot;).
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          We are the data controller for the purposes of the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Data We Collect</h2>
        <p className="text-gray-600 leading-relaxed mb-4">We collect the following categories of personal data:</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li><strong>Account data:</strong> Email address (used for magic-link authentication).</li>
          <li><strong>Content data:</strong> Text notes, images, voice recordings, PDFs, and web links you choose to capture.</li>
          <li><strong>Usage data:</strong> Feature usage analytics, session duration, and error logs (anonymised).</li>
          <li><strong>Device data:</strong> Device type, operating system version, and app version (for compatibility).</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. How We Use Your Data</h2>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li>To provide and improve the Service (AI extraction, search, summaries).</li>
          <li>To authenticate your identity via magic-link email.</li>
          <li>To send transactional emails (sign-in links, account notifications).</li>
          <li>To generate anonymised, aggregated analytics to improve the product.</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          We do <strong>not</strong> sell your personal data. We do <strong>not</strong> use your content data to train AI models.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Legal Basis for Processing</h2>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li><strong>Contract:</strong> Processing necessary to provide the Service you signed up for.</li>
          <li><strong>Legitimate interest:</strong> Anonymised analytics to improve product quality.</li>
          <li><strong>Consent:</strong> Marketing communications (opt-in only).</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Data Storage and Security</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Your data is stored in EU data centres (AWS eu-central-1, Frankfurt). All data is encrypted at rest using AES-256 and in transit using TLS 1.3. File storage uses Cloudflare R2 with EU data residency.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Data Retention</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We retain your data for as long as your account is active. Upon account deletion, all personal data and content is permanently deleted within 30 days. Anonymised analytics data may be retained indefinitely.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Your Rights</h2>
        <p className="text-gray-600 leading-relaxed mb-4">Under UK GDPR, you have the right to:</p>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li>Access your personal data (Subject Access Request).</li>
          <li>Rectify inaccurate data.</li>
          <li>Erase your data (&quot;right to be forgotten&quot;).</li>
          <li>Restrict or object to processing.</li>
          <li>Data portability (export your memories as Markdown).</li>
          <li>Lodge a complaint with the ICO (ico.org.uk).</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">8. Third-Party Processors</h2>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li><strong>TiDB Cloud (PingCAP):</strong> Database hosting (EU region).</li>
          <li><strong>Cloudflare R2:</strong> File storage (EU region).</li>
          <li><strong>Resend:</strong> Transactional email delivery.</li>
          <li><strong>Inngest:</strong> Background job processing.</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          All processors are bound by Data Processing Agreements (DPAs) and process data only on our instructions.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">9. Cookies</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          The web application uses a single essential session cookie for authentication. We do not use tracking cookies or third-party advertising cookies.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">10. Changes to This Policy</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We may update this policy from time to time. Material changes will be communicated via email or in-app notification. Continued use of the Service after changes constitutes acceptance.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">11. Contact</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          For privacy enquiries or to exercise your rights, contact us at:{" "}
          <a href="mailto:privacy@docvault.uk" className="text-brand-500 hover:underline">privacy@docvault.uk</a>
        </p>
      </div>
    </div>
  );
}
