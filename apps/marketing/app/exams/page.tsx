import type { Metadata } from "next";
import { Button } from "@/components/Button";

export const metadata: Metadata = {
  title: "Exams",
  description:
    "DocVault supports 16 UK medical exams — from UKMLA to specialty membership. Adaptive question banks, OSCE practice, and mock exams.",
};

const exams = [
  {
    name: "UKMLA (MLA)",
    tier: "Pro Student",
    description:
      "The UK Medical Licensing Assessment. 2,000+ SBAs mapped to the MLA content map, covering all clinical presentations and conditions.",
  },
  {
    name: "PSA",
    tier: "Pro Student",
    description:
      "Prescribing Safety Assessment. Drug interaction scenarios, dosing calculations, and prescribing error identification aligned to BNF guidance.",
  },
  {
    name: "MSRA",
    tier: "Pro Student",
    description:
      "Multi-Specialty Recruitment Assessment. Clinical problem-solving and professional dilemma questions for specialty training applications.",
  },
  {
    name: "PLAB 1 & 2",
    tier: "Pro Student",
    description:
      "Professional and Linguistic Assessments Board. SBA bank for Part 1 and OSCE scenarios for Part 2, tailored for IMGs entering UK practice.",
  },
  {
    name: "Finals & OSCEs",
    tier: "Pro Student",
    description:
      "Medical school finals and clinical examinations. Structured revision with AI-scored OSCE stations covering history, examination, and communication.",
  },
  {
    name: "MRCP Part 1 & 2",
    tier: "Pro Doctor",
    description:
      "Membership of the Royal Colleges of Physicians. Best-of-five questions across general internal medicine, with image-based and data interpretation sets.",
  },
  {
    name: "MRCS Part A",
    tier: "Pro Doctor",
    description:
      "Membership of the Royal College of Surgeons Part A. Applied basic sciences and principles of surgery in context, mapped to the intercollegiate syllabus.",
  },
  {
    name: "MRCGP (AKT & RCA)",
    tier: "Pro Doctor",
    description:
      "Membership of the Royal College of General Practitioners. AKT clinical knowledge questions and RCA consultation simulation for primary care trainees.",
  },
  {
    name: "MRCEM (Primary & Intermediate)",
    tier: "Pro Doctor",
    description:
      "Membership of the Royal College of Emergency Medicine. SBAs covering acute presentations, trauma management, and emergency procedures.",
  },
  {
    name: "MRCOG Part 1 & 2",
    tier: "Specialist",
    description:
      "Membership of the Royal College of Obstetricians and Gynaecologists. SBAs and EMQs spanning obstetrics, gynaecology, and reproductive medicine.",
  },
  {
    name: "MRCPCH (FOP & TAS)",
    tier: "Specialist",
    description:
      "Membership of the Royal College of Paediatrics and Child Health. Foundations of Practice and Theory & Science papers with paediatric-specific scenarios.",
  },
  {
    name: "MRCPsych Paper A & B",
    tier: "Specialist",
    description:
      "Membership of the Royal College of Psychiatrists. Neurosciences, psychopharmacology, and clinical psychiatry questions aligned to the MRCPsych curriculum.",
  },
  {
    name: "MRCPath Part 1",
    tier: "Specialist",
    description:
      "Membership of the Royal College of Pathologists. Histopathology, haematology, and clinical biochemistry questions with image interpretation.",
  },
  {
    name: "FRCA Primary & Final",
    tier: "Specialist",
    description:
      "Fellowship of the Royal College of Anaesthetists. Pharmacology, physiology, and physics applied to anaesthesia, plus clinical SAQs.",
  },
  {
    name: "FRCR Part 1 & 2A",
    tier: "Specialist",
    description:
      "Fellowship of the Royal College of Radiologists. Physics, anatomy, and image interpretation across all modalities (CT, MRI, USS, XR).",
  },
  {
    name: "MRCS Part B (OSCE)",
    tier: "Pro Doctor",
    description:
      "Surgical OSCE stations covering clinical examination, communication, history taking, and procedural skills with AI examiner scoring.",
  },
];

const workflow = [
  {
    step: "1",
    title: "Choose your exam",
    description:
      "Select your target exam and date. DocVault loads the relevant question bank and curriculum map.",
  },
  {
    step: "2",
    title: "Daily study plan",
    description:
      "An adaptive plan assigns daily SBAs, OSCE stations, and revision topics based on your weak areas.",
  },
  {
    step: "3",
    title: "Practise under pressure",
    description:
      "Timed questions, mock exams, and voice OSCE sessions simulate real exam conditions.",
  },
  {
    step: "4",
    title: "Track and improve",
    description:
      "Weekly reports show progress by topic, predict your score, and adjust the plan accordingly.",
  },
];

export default function ExamsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            16 UK medical exams, one platform
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            From UKMLA to specialty membership — DocVault provides adaptive question
            banks, OSCE simulation, and mock exams aligned to Royal College curricula.
          </p>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How DocVault prepares you
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {workflow.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported exams */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Supported exams
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Each exam has a dedicated question bank built from public curricula and guidelines.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.name}
                className="p-6 bg-white rounded-xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                    {exam.tier}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{exam.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Start revising smarter today
        </h2>
        <p className="mt-2 text-gray-500">
          Free plan includes 200 SBA preview questions and 1 voice OSCE per week.
        </p>
        <div className="mt-6">
          <Button href="https://app.docvault.uk/auth/sign-in" size="lg">
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
