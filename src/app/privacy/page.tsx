import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { LegalPage, type LegalSection } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: `Privacy policy · ${BRAND.name}`,
  description: `How ${BRAND.legalName} handles the personal information held in its workforce portal.`,
};

const sections: LegalSection[] = [
  {
    id: 'scope',
    heading: 'What this covers',
    body: [
      `This policy describes the personal information ${BRAND.legalName} holds in this workforce portal, why we hold it, who can see it, and how long we keep it. It applies to the portal at hr.${BRAND.domain} and to the records inside it.`,
      'The portal is an internal system. It is used by our own workforce and by the HR and administrative staff who support them. It is not a public service and does not accept sign-ups from outside the company.',
    ],
  },
  {
    id: 'what-we-hold',
    heading: 'Information we hold',
    body: ['The records in the portal exist to employ and pay people, and to meet the obligations that come with that.'],
    points: [
      'Identity and contact details: name, date of birth, home address, personal phone and email, and the work email issued to you.',
      'Employment record: position, department, reporting manager, hire and release dates, engagement type, and the client or vendor a placement runs through.',
      'Pay and billing: pay rate, bill rate, salary type, and the timesheets and invoices those rates feed.',
      'Time: leave requests with their reasons and any supporting documents, and daily attendance including clock-in and clock-out times.',
      'Work eligibility and compliance: Form I-9 records, work authorization type and expiry, E-Verify status where applicable, Form I-983 training plans, and the retention dates attached to them.',
      'Documents you or HR upload: offer letters, payslips, certificates and other employment records.',
      'Benefits: which plans you are enrolled in.',
      'Sign-in information: the account identifier tied to your person record and the email that account signs in with.',
    ],
  },
  {
    id: 'why',
    heading: 'Why we hold it',
    points: [
      'To employ, pay and support you, and to administer leave, attendance and benefits.',
      'To meet legal obligations, including work-eligibility verification and the record retention those rules require.',
      'To run the business: staffing clients, invoicing for work delivered, and understanding utilization.',
      'To keep the system secure, including confirming that the person signing in is who the account belongs to.',
    ],
  },
  {
    id: 'who-sees-it',
    heading: 'Who can see it',
    body: [
      'Access is set by role and is enforced by the system, not by convention.',
    ],
    points: [
      'You can see your own leave, attendance, documents and benefits.',
      'HR and administrators can see the full workforce record, because administering it is their job.',
      'No one outside the company gets access to the portal. Where information has to reach a client, a vendor or a government agency, it is shared through the specific process that requires it, limited to what that process needs.',
      'Service providers who host or support the system may process data on our instructions, under contract, and only for that purpose.',
    ],
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    body: [
      'Employment records are kept for the length of your engagement and then for as long as employment, tax and immigration rules require. Work-eligibility records carry their own retention date, which the portal tracks per person.',
      'Backups are taken so the system can be restored after a failure. They are held in secure storage and are subject to the same access limits as the live system.',
    ],
  },
  {
    id: 'your-choices',
    heading: 'Your information, your say',
    body: [
      'You can view much of your own record in the portal directly. If something is wrong, or you want to know what is held about you, contact HR and we will put it right or explain why we cannot.',
      'Depending on where you work, you may have further rights over your personal information, including access, correction, and objecting to certain processing. Ask HR and we will tell you what applies to you and how to use it.',
    ],
  },
  {
    id: 'security',
    heading: 'How it is protected',
    points: [
      'Accounts are created by HR or an administrator. There is no public sign-up, and this portal keeps its own sign-in, separate from the company website.',
      'Data is encrypted in transit, and the portal is served only over HTTPS.',
      'Credentials for the systems that store records are held on the server and are never exposed to the browser.',
      'Access is reviewed when someone changes role or leaves.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: [
      `Questions about this policy, or about the information held about you, go to HR at ${BRAND.contactEmail}. We will respond within a reasonable period, and within any period the law sets.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy policy"
      intro={`What ${BRAND.legalName} holds about the people who work here, why, and who can see it.`}
      updated="August 2026"
      sections={sections}
    />
  );
}
