import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { LegalPage, type LegalSection } from '@/components/landing/LegalPage';

export const metadata: Metadata = {
  title: `Terms of use · ${BRAND.name}`,
  description: `The rules for using the ${BRAND.legalName} workforce portal.`,
};

const sections: LegalSection[] = [
  {
    id: 'who',
    heading: 'Who may use this portal',
    body: [
      `This portal is an internal system of ${BRAND.legalName}. It is for people the company has given an account: employees, contractors working under our engagements, and the HR and administrative staff who support them.`,
      'Accounts are issued by HR or an administrator. Creating an account any other way, or using someone else\'s, is not permitted.',
    ],
  },
  {
    id: 'account',
    heading: 'Your account',
    points: [
      'Keep your password to yourself. Anything done with your account is treated as done by you.',
      'Tell HR straight away if you think someone else has used your account, or if you receive an invite you did not expect.',
      'Your access reflects your role. Do not attempt to reach records your role does not open.',
      'When you leave the company or change role, your access changes with it.',
    ],
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    body: ['The records here are about real people and real client work. Treat them that way.'],
    points: [
      'Use the portal only for your work at the company.',
      'Do not copy, export or share workforce data except where your job requires it and the recipient is entitled to it.',
      'Do not upload anything you do not have the right to store here, and do not upload malicious files.',
      'Do not probe, scan or attempt to bypass the access controls, and do not use automated tools against the system without written permission.',
      'Do not misrepresent who you are or act on behalf of someone else without authority.',
    ],
  },
  {
    id: 'confidentiality',
    heading: 'Confidentiality',
    body: [
      'Everything in this portal is confidential company information, including personal information about colleagues, pay and billing rates, client relationships and compliance records. Your obligation to keep it confidential continues after your engagement ends.',
    ],
  },
  {
    id: 'availability',
    heading: 'Availability and changes',
    body: [
      'We aim to keep the portal available, but it may be unavailable during maintenance or because of events outside our control. Features may change as the company\'s needs change.',
      'We may update these terms. Where a change matters to how you use the portal, we will make it visible rather than quietly swapping the page.',
    ],
  },
  {
    id: 'monitoring',
    heading: 'Monitoring',
    body: [
      'Use of the portal is logged for security and for keeping records accurate, including who changed a record and when. Logs are used to protect the system and to meet our obligations, not to watch individuals for its own sake.',
    ],
  },
  {
    id: 'ending-access',
    heading: 'Ending access',
    body: [
      'We may suspend or end access to the portal where these terms are broken, where an account is compromised, or where your engagement with the company ends. Ending access does not end obligations that are meant to survive it, such as confidentiality.',
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: [
      `Questions about these terms go to HR at ${BRAND.contactEmail}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of use"
      intro="The rules for using this portal, in plain terms: who it is for, what it may be used for, and what is expected of you."
      updated="August 2026"
      sections={sections}
    />
  );
}
