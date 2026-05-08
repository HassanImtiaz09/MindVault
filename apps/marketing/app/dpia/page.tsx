import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Protection Impact Assessment",
  description: "DocVault DPIA — assessment of data protection risks and mitigations.",
};

export default function DPIAPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Protection Impact Assessment</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: 8 May 2026</p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. Overview</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          This Data Protection Impact Assessment (DPIA) evaluates the data protection risks associated with DocVault&apos;s processing of personal data, particularly given the potential for users to store health-related information. This assessment is conducted in accordance with Article 35 of the UK GDPR.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. Processing Description</h2>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm text-gray-600">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-gray-900">Nature of processing</td>
                <td className="py-3">Collection, storage, AI analysis, and retrieval of user-uploaded content (text, images, audio, documents, web links).</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-gray-900">Scope</td>
                <td className="py-3">Personal data of registered users; content may include health-related information at user&apos;s discretion.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-gray-900">Context</td>
                <td className="py-3">Mobile and web application for medical knowledge management. Users are primarily medical students and healthcare professionals.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4 font-semibold text-gray-900">Purpose</td>
                <td className="py-3">To help users capture, organise, and recall medical knowledge for educational and professional purposes.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. Necessity and Proportionality</h2>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li>Processing is necessary to deliver the core service (knowledge capture and retrieval).</li>
          <li>AI processing is limited to the user&apos;s own content and is not shared between users.</li>
          <li>Data minimisation: we collect only email for authentication; all other data is user-initiated.</li>
          <li>Purpose limitation: content is processed solely to provide the Service to the individual user.</li>
          <li>Storage limitation: data is deleted within 30 days of account deletion.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. Risk Assessment</h2>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm text-gray-600">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 pr-4 text-left font-semibold text-gray-900">Risk</th>
                <th className="py-3 pr-4 text-left font-semibold text-gray-900">Likelihood</th>
                <th className="py-3 pr-4 text-left font-semibold text-gray-900">Impact</th>
                <th className="py-3 text-left font-semibold text-gray-900">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Unauthorised access to user content</td>
                <td className="py-3 pr-4">Low</td>
                <td className="py-3 pr-4">High</td>
                <td className="py-3">AES-256 encryption at rest, TLS 1.3 in transit, session-based auth, no shared access by default.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Data breach via third-party processor</td>
                <td className="py-3 pr-4">Low</td>
                <td className="py-3 pr-4">High</td>
                <td className="py-3">All processors bound by DPAs; EU data residency; regular security reviews.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Inadvertent storage of patient-identifiable data</td>
                <td className="py-3 pr-4">Medium</td>
                <td className="py-3 pr-4">High</td>
                <td className="py-3">Terms prohibit storing patient data without consent; in-app guidance on appropriate use; content is user-controlled.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">AI model hallucination in recall</td>
                <td className="py-3 pr-4">Medium</td>
                <td className="py-3 pr-4">Medium</td>
                <td className="py-3">Disclaimer that DocVault is not a medical device; responses cite source memories; users verify against original content.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Loss of data availability</td>
                <td className="py-3 pr-4">Low</td>
                <td className="py-3 pr-4">Medium</td>
                <td className="py-3">Multi-AZ database; automated backups; user data export feature.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Technical and Organisational Measures</h2>
        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
          <li>Encryption at rest (AES-256) and in transit (TLS 1.3).</li>
          <li>Session-based authentication with magic-link (no passwords stored).</li>
          <li>Role-based access control for Teams plan.</li>
          <li>Automated database backups with point-in-time recovery.</li>
          <li>EU data residency (AWS eu-central-1, Cloudflare R2 EU).</li>
          <li>Regular dependency updates and security scanning.</li>
          <li>Data export functionality for portability.</li>
          <li>30-day deletion policy upon account closure.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">6. Conclusion</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          The residual risks after mitigation are assessed as acceptable. The processing is necessary and proportionate to the legitimate purpose of providing an AI-powered knowledge management service. Technical and organisational measures adequately address identified risks.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          This DPIA will be reviewed annually or when significant changes are made to the processing activities.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7. Contact</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          For questions about this DPIA, contact:{" "}
          <a href="mailto:privacy@docvault.uk" className="text-brand-500 hover:underline">privacy@docvault.uk</a>
        </p>
      </div>
    </div>
  );
}
