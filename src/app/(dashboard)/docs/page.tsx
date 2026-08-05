'use client';

import React, { useState } from 'react';
import {
  BookOpen, Users, Network, CalendarDays, Receipt, ShieldCheck, FolderOpen,
  Table2, Upload, Download, UserCog, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccess } from '@/hooks/useAccess';
import { PageContainer } from '@/components/dashboard/page-container';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * In-app documentation. One page describing what every module holds, which
 * fields each record carries, how assignments work, and what the import /
 * export paths accept — so the answer to "what does this field do" lives next
 * to the app instead of in someone's head.
 *
 * Full-access only (admin / HR): it describes management surfaces an ESS
 * employee cannot reach, and the Topbar link is hidden from them too.
 */

// ── Content ────────────────────────────────────────────────────────────────
// Kept as data so a section is a small edit, not a markup rewrite.

interface Field {
  name: string;
  type: string;
  notes: string;
}

interface Block {
  heading: string;
  body?: string;
  /** Rendered as a field table. */
  fields?: Field[];
  /** Rendered as a bulleted list. */
  points?: string[];
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  intro: string;
  blocks: Block[];
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'Overview & access',
    icon: BookOpen,
    intro:
      'This is Ocean Blue\'s internal HR and staffing console. It holds the workforce, the partners they are placed with, and the compliance, leave and billing records that hang off those placements.',
    blocks: [
      {
        heading: 'Access tiers',
        body: 'Roles live in this portal\'s own Cognito pool, separate from the company website. Accounts are invite-only, created from the Users page.',
        fields: [
          { name: 'Admin', type: 'Full access', notes: 'Everything, plus deleting backups and anything targeting another admin account or granting the admin role.' },
          { name: 'HR', type: 'Full access', notes: 'The entire portal: employees, partners, leave, billing, compliance, users. Can create and list backups but not delete them.' },
          { name: 'Employee', type: 'Self-service', notes: 'The limited ESS portal: their own leave, attendance and documents, plus handbook, procedures, policies and benefits. No other employee\'s data.' },
        ],
      },
      {
        heading: 'Employee view',
        body: 'Admin and HR can switch into employee view from the profile menu to work their own leave, attendance and documents. It swaps the navigation only — permissions are unchanged, so it is presentation rather than a sandbox. Exit from the badge in the top bar.',
      },
    ],
  },
  {
    id: 'employees',
    title: 'Employees',
    icon: Users,
    intro:
      'The workforce record. Every employee has one of four engagement types, and the type decides which fields the form shows and which the importer accepts.',
    blocks: [
      {
        heading: 'Engagement types',
        fields: [
          { name: 'W2', type: 'Employee', notes: 'Work authorization + expiry, salary type (Hourly/Annual), medical and 401(k) flags, office email, rehire date.' },
          { name: 'Contract', type: 'Contractor', notes: 'Contractor name, work authorization + expiry.' },
          { name: '1099', type: 'Independent', notes: 'Work authorization + expiry, salary type, office email, rehire date.' },
          { name: 'Offshore', type: 'International', notes: 'Payroll entity (LLP / Pvt Ltd), employment type, Aadhar, PAN, PF and UAN numbers, Vonage number. No work-auth expiry.' },
        ],
      },
      {
        heading: 'Shared fields',
        fields: [
          { name: 'name, position, department, reportingManager', type: 'text', notes: 'Identity and org placement.' },
          { name: 'dob, hireDate, dor', type: 'date', notes: 'Date of birth, hire date, and date of resignation / release.' },
          { name: 'address, city, state, pincode', type: 'text', notes: 'Home address of the worker.' },
          { name: 'contactNo, personalEmail', type: 'text', notes: 'Personal contact details. Office email is per type.' },
          { name: 'billRate, payRate', type: 'number (hourly)', notes: 'Drives Margins, Timesheets and Invoicing. Editable inline on the Margins page.' },
          { name: 'status', type: 'Active | Terminated', notes: 'A partner whose every assigned employee is Terminated shows as Inactive automatically.' },
          { name: 'revenueStatus', type: 'B | NB', notes: 'Billable or non-billable. Surfaces as the Billable KPI on partner profiles.' },
          { name: 'workCountry, i9Status, agreementStatus', type: 'text', notes: 'Compliance pack summary carried on the employee record.' },
          { name: 'cognitoSub, loginEmail', type: 'text', notes: 'Links a sign-in to this person. cognitoSub is authoritative and survives an email change; loginEmail is what HR reads when fixing a mismatch.' },
        ],
      },
      {
        heading: 'Assignments',
        body: 'An employee can be attached to clients, end clients, vendors and subcontractors at the same time. Each is stored as a list of assignments (with optional start / end dates) plus a primary id derived from the active one.',
        points: [
          'From the employee form: pick a Client or Vendor directly on the record.',
          'From a partner profile: use Add employees to multi-select several people at once. The modal lists only employees not already assigned to that partner.',
          'The partner\'s Employees count and roster read from those assignment lists, falling back to the primary id and legacy name fields on older records.',
        ],
      },
    ],
  },
  {
    id: 'partners',
    title: 'Partners',
    icon: Network,
    intro:
      'Clients, end clients, vendors and subcontractors share one record shape and one hub. /partners holds all four as tabs; each also has a full page of its own reachable through View all.',
    blocks: [
      {
        heading: 'Who is who',
        fields: [
          { name: 'Client', type: 'Direct', notes: 'The organisation being billed for a placement.' },
          { name: 'End client', type: 'Indirect', notes: 'Where the worker actually sits when the placement runs through an intermediary.' },
          { name: 'Vendor', type: 'Supplier', notes: 'A staffing partner supplying contractors.' },
          { name: 'Subcontractor', type: 'Supplier', notes: 'A firm whose people work under our contract. Carries Certificate of Insurance dates.' },
        ],
      },
      {
        heading: 'Fields',
        fields: [
          { name: 'name', type: 'text (required)', notes: 'The only required field on create and import.' },
          { name: 'contactPerson, email', type: 'text', notes: 'Primary point of contact.' },
          { name: 'phone, phoneExtension', type: 'text', notes: 'Extension is optional and stored separately; it renders as "555-0100 ext. 204" and dials as tel:…;ext=204.' },
          { name: 'address, city, state, zip, country', type: 'text', notes: 'Address is the street line; the rest are separate fields. Records created before the split keep their whole address in the street line and still display correctly.' },
          { name: 'status', type: 'Active | Inactive', notes: 'Set by hand. Vendors and subcontractors additionally show Inactive automatically when every assigned employee is Terminated (hover the badge for why).' },
          { name: 'coiEffectiveDate, coiExpiryDate', type: 'date (subcontractors)', notes: 'Certificate of Insurance window. The profile shows a status pill: valid, expiring within 60 days, or expired.' },
        ],
      },
      {
        heading: 'The profile page',
        points: [
          'Header: status, address and last-updated, with Export PDF, Edit, and a menu holding Add employees and Delete.',
          'KPI row: total employees, active, terminated, and billable (revenue status B).',
          'Cards: partner details, workforce mix by engagement type, and — for subcontractors — the COI card.',
          'Roster: every assigned employee, sortable, with its own Display menu. Clicking a row opens that employee.',
          'Back always returns to where you came from: the Partners tab if you opened the record there, the standalone list if you opened it from there.',
        ],
      },
      {
        heading: 'Moving records between types',
        body: 'Select rows on any partner list and use the bulk bar to copy or move them to another partner type. Name, contact, email, phone and extension, the full address, and status all carry across. Copy leaves the original in place; move removes it.',
      },
    ],
  },
  {
    id: 'leave',
    title: 'Leave & attendance',
    icon: CalendarDays,
    intro: 'Leave requests and daily attendance for the whole workforce, plus the self-service side employees use to file their own.',
    blocks: [
      {
        heading: 'Leave',
        fields: [
          { name: 'type', type: 'Sick | Casual | PTO | Long Leave | Unpaid', notes: 'Long Leave is the extended-absence category and accepts supporting documents.' },
          { name: 'startDate, endDate, days', type: 'date / number', notes: 'Days is the counted length of the request.' },
          { name: 'status', type: 'Pending | Approved | Rejected', notes: 'HR approves or rejects from the Leave Management page.' },
          { name: 'reason, documents', type: 'text / files', notes: 'Attachments upload to S3 and hang off the request.' },
        ],
      },
      {
        heading: 'Attendance',
        fields: [
          { name: 'date, status', type: 'date / Present · Absent · Remote · Half-day · Leave', notes: 'One record per employee per day.' },
          { name: 'checkIn, checkOut', type: 'time', notes: 'Clock times drive the attendance KPIs and the month calendar.' },
          { name: 'note', type: 'text', notes: 'Free-text context for the day.' },
        ],
      },
      {
        heading: 'Self-service',
        body: 'Employees see My Leave, My Attendance and My Documents only. Leave balances also appear on their profile.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    icon: Receipt,
    intro: 'Hours become money in three steps: a timesheet records worked hours at a bill and pay rate, an invoice bills a client for approved timesheets, and Margins watches the spread.',
    blocks: [
      {
        heading: 'Timesheets',
        fields: [
          { name: 'employeeId, clientId', type: 'reference', notes: 'Worker and client names are snapshotted onto the record so historic sheets still read correctly if a record is renamed.' },
          { name: 'periodStart, periodEnd, hours', type: 'date / number', notes: 'The pay period and hours worked in it.' },
          { name: 'billRate, payRate', type: 'number (hourly)', notes: 'Default from the employee record; override per sheet.' },
          { name: 'status', type: 'Draft | Submitted | Approved | Invoiced', notes: 'Invoiced is set when a sheet is pulled onto an invoice.' },
        ],
      },
      {
        heading: 'Invoices',
        fields: [
          { name: 'invoiceNumber, clientId', type: 'text / reference', notes: 'One invoice bills one client.' },
          { name: 'periodStart, periodEnd, issueDate, dueDate', type: 'date', notes: 'The billing window and payment dates.' },
          { name: 'lineItems', type: 'list', notes: 'Each line is a worker and period: hours × rate = amount.' },
          { name: 'subtotal, total, status', type: 'number / Draft · Sent · Paid', notes: 'Totals are computed from the line items.' },
        ],
      },
      {
        heading: 'Margins',
        body: 'A live view of bill rate against pay rate per placement, with the margin percentage. Rates are editable inline, so this doubles as the fastest way to correct a rate.',
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance',
    icon: ShieldCheck,
    intro: 'Work-authorization records and the paperwork that has to survive an audit.',
    blocks: [
      {
        heading: 'Form I-9',
        fields: [
          { name: 'citizenshipStatus, alienNumber', type: 'Section 1', notes: 'U.S. Citizen, Noncitizen National, Lawful Permanent Resident, or Alien Authorized to Work.' },
          { name: 'status', type: 'Not started → Section 1 complete → Pending verification → Verified → E-Verified', notes: 'The tracker reflects what has been recorded here. It is not a live DHS connection.' },
          { name: 'workAuth entries', type: 'list', notes: 'Each authorization carries type, number, issue and expiry, and Current / Expired / Superseded.' },
          { name: 'retain until', type: 'date', notes: 'Document-retention date, with an audit trail of who did what and when.' },
        ],
      },
      {
        heading: 'Form I-983 (STEM OPT)',
        body: 'Training plans for STEM OPT workers: status Draft, Active or Completed, evaluation dates, and material-change records.',
      },
      {
        heading: 'Expiry warnings',
        body: 'Work authorization expiring within 90 days is flagged with an amber warning on partner rosters and in printed reports, so a placement is never the thing that tells you first.',
      },
    ],
  },
  {
    id: 'company',
    title: 'Documents & company content',
    icon: FolderOpen,
    intro: 'Everything the workforce reads, plus the files kept per person.',
    blocks: [
      {
        heading: 'Documents',
        body: 'Per-employee file storage on S3. Upload from the employee\'s document page; employees see their own under My Documents.',
      },
      {
        heading: 'Handbook, procedures, policies',
        body: 'Company content authored in the portal and visible to every tier, including ESS employees.',
      },
      {
        heading: 'Benefits',
        fields: [
          { name: 'name, type, provider', type: 'text / Medical · Dental · Vision · 401k · Life · Disability · Other', notes: 'The plan and who runs it.' },
          { name: 'eligibility', type: 'employee types', notes: 'Which engagement types may enrol.' },
          { name: 'costPerMonth, employerContribution', type: 'number', notes: 'Monthly cost and the employer share.' },
          { name: 'enrolledEmployeeIds', type: 'list', notes: 'Enrolment is managed from the plan page.' },
        ],
      },
      {
        heading: 'Onboarding packets',
        body: 'Every new hire gets a packet of items to tick off. Packets can be marked complete wholesale for people onboarded before this system existed.',
      },
    ],
  },
  {
    id: 'tables',
    title: 'Working with lists',
    icon: Table2,
    intro: 'Every list page in the console behaves the same way, so what you learn on one works on all of them.',
    blocks: [
      {
        heading: 'Controls',
        points: [
          'Search matches across the useful text of a record — for partners that is name, contact, email, phone, extension and every part of the address.',
          'Filters sit next to the search box; status is on every partner list.',
          'Display, at the right end of the toolbar, shows and hides columns. Where a table has an id, your choice is remembered on that device.',
          'Click a column header to sort; click again to reverse.',
          'Checkboxes select rows and reveal the bulk bar. Row actions (View, Edit, Delete) live in the ⋯ menu at the end of each row; clicking anywhere else on the row opens it.',
        ],
      },
      {
        heading: 'Density',
        body: 'The console scales with your screen: type, spacing, control heights and the sidebar width all shrink on a small laptop and relax on a large monitor. Nothing is fixed to one size.',
      },
    ],
  },
  {
    id: 'import',
    title: 'Importing data',
    icon: Upload,
    intro:
      'Every list with an Import button accepts Excel or CSV, or a block pasted straight from a spreadsheet. Column headers are matched by name and by the aliases below, so an export from another system usually maps without editing.',
    blocks: [
      {
        heading: 'Partner columns (all four types)',
        fields: [
          { name: 'Name', type: 'required', notes: 'A row without a name is rejected and reported back with its row number.' },
          { name: 'Contact Person', type: 'text', notes: 'Also accepts "contact" or "poc".' },
          { name: 'Email, Phone', type: 'text', notes: 'Phone also accepts "phone number" or "contact number".' },
          { name: 'Phone Extension', type: 'text', notes: 'Also accepts "ext" or "extension".' },
          { name: 'Address', type: 'text', notes: 'The street line. Also accepts "street" or "address line 1".' },
          { name: 'City, Country', type: 'text', notes: 'Plain text.' },
          { name: 'State', type: 'text', notes: 'Also accepts "province" or "region".' },
          { name: 'ZIP', type: 'text', notes: 'Also accepts "zipcode", "zip code", "postal code" or "pincode".' },
          { name: 'Status', type: 'Active | Inactive', notes: 'Defaults to Active when blank.' },
        ],
      },
      {
        heading: 'Employees',
        body: 'The employee importer builds its columns from the same form the manual onboarding screen uses, one column set per engagement type, so it can never drift from the form. Client and Vendor columns accept the partner\'s name and are resolved to the record for you.',
      },
      {
        heading: 'How a run reports back',
        body: 'Rows are validated first, then written in batches. You get a per-row result: created, or failed with the reason. A failed batch marks its rows failed rather than silently dropping them.',
      },
    ],
  },
  {
    id: 'export',
    title: 'Exporting data',
    icon: Download,
    intro: 'Export CSV downloads exactly the rows currently in view — your search and filters apply — with these columns.',
    blocks: [
      {
        heading: 'What each export contains',
        fields: [
          { name: 'Clients / End clients', type: 'CSV', notes: 'ID, name, contact person, email, phone, extension, address, city, state, ZIP, country, status, employees, created, last updated.' },
          { name: 'Vendors / Subcontractors', type: 'CSV', notes: 'The same columns plus auto-inactive; subcontractors also carry COI effective and expiry.' },
          { name: 'Leave requests', type: 'CSV', notes: 'Employee, type, start, end, days, status, reason.' },
          { name: 'Timesheets', type: 'CSV', notes: 'Worker, client, period start, period end, hours, bill rate, pay rate, status.' },
          { name: 'Margins', type: 'CSV', notes: 'Worker, client, bill rate, pay rate, margin %.' },
          { name: 'Payroll', type: 'CSV', notes: 'Employee, email, type, status, pay rate, estimated monthly pay, client, work country, I-9 eligibility.' },
          { name: 'I-9 status', type: 'CSV', notes: 'Employee, type, I-9 status, E-Verify, retain until.' },
          { name: 'I-983', type: 'CSV', notes: 'Employee, type, work auth, I-983 status, next evaluation.' },
          { name: 'Employee documents', type: 'CSV', notes: 'Employee, type, document count.' },
        ],
      },
      {
        heading: 'Printed reports',
        body: 'Partner profiles have Export PDF, which opens a print view: contact header, headline counts, and the full employee roster with hire dates and work authorization, flagging anything expiring within 90 days. Allow popups for the site or the print window will be blocked.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Users & backups',
    icon: UserCog,
    intro: 'Administration surfaces, and the two things HR cannot do.',
    blocks: [
      {
        heading: 'Users',
        points: [
          'Accounts are invite-only. Invite from the Users page choosing Employee (ESS), HR or Admin.',
          'Nobody can change their own role, and only an admin may touch an admin account or grant the admin role.',
          'A sign-in is linked to a person by their Cognito id, so an email change does not break the link.',
        ],
      },
      {
        heading: 'Backups',
        body: 'Export a full snapshot of the database to secure S3 storage, and download any previous one. HR and admins can create and list backups; only an admin can delete one.',
      },
    ],
  },
];

// ── Presentation ───────────────────────────────────────────────────────────

function FieldTable({ fields }: { fields: Field[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {['Field', 'Type', 'What it does'].map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap border-b border-[var(--adm-line)] bg-[var(--adm-head)] px-3 py-2 text-[0.8rem] font-medium text-[var(--adm-head-ink)] first:rounded-tl-[6px] last:rounded-tr-[6px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.name} className="align-top">
              <td className="border-b border-[var(--adm-line-soft)] px-3 py-2.5 text-[0.8667rem] font-semibold text-[var(--adm-ink)]">
                {f.name}
              </td>
              <td className="whitespace-nowrap border-b border-[var(--adm-line-soft)] px-3 py-2.5 text-[0.8rem] text-[var(--adm-ink-mute)]">
                {f.type}
              </td>
              <td className="border-b border-[var(--adm-line-soft)] px-3 py-2.5 text-[0.8667rem] text-[var(--adm-ink-mute)]">
                {f.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocBlock({ block }: { block: Block }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[0.9333rem] font-semibold text-[var(--adm-ink)]">{block.heading}</h3>
      {block.body && <p className="max-w-3xl text-[0.9rem] leading-relaxed text-[var(--adm-ink-mute)]">{block.body}</p>}
      {block.points && (
        <ul className="max-w-3xl space-y-1.5">
          {block.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-[var(--adm-ink-mute)]">
              <span className="mt-[0.55em] h-1 w-1 flex-none rounded-full bg-[var(--adm-ink-subtle)]" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      {block.fields && <FieldTable fields={block.fields} />}
    </div>
  );
}

export default function DocsPage() {
  const { fullAccess } = useAccess();
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  if (!fullAccess) {
    return (
      <EmptyState
        icon={Lock}
        tone="default"
        title="Documentation isn't available on your account"
        description="These notes cover the management side of the portal. Your own leave, attendance and documents are in the menu on the left."
        className="mt-12"
      />
    );
  }

  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <PageContainer>
      <PageHeader
        icon={BookOpen}
        eyebrow="Reference"
        title="Documentation"
        description="What every module holds, which fields each record carries, and how data gets in and out."
      />

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Section list — a sticky rail on desktop, a scrolling chip row on mobile */}
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-2 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const on = s.id === section.id;
              return (
                <li key={s.id} className="flex-none lg:flex-auto">
                  <button
                    type="button"
                    onClick={() => setActive(s.id)}
                    aria-current={on ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 whitespace-nowrap rounded-[8px] px-3 py-2 text-left text-[0.8667rem] transition-colors duration-150',
                      on
                        ? 'bg-[var(--adm-accent-soft)] font-semibold text-[var(--adm-accent)]'
                        : 'font-medium text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]',
                    )}
                  >
                    <s.icon className="h-4 w-4 flex-none" strokeWidth={1.75} />
                    {s.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <article className="surface min-w-0 p-5 sm:p-6">
          <header className="mb-5 border-b border-[var(--adm-line)] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[8px] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]">
                <section.icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-[1.1333rem] font-bold tracking-[-0.01em] text-[var(--adm-ink)]">{section.title}</h2>
            </div>
            <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed text-[var(--adm-ink-mute)]">{section.intro}</p>
          </header>

          <div className="space-y-7">
            {section.blocks.map((b) => (
              <DocBlock key={b.heading} block={b} />
            ))}
          </div>
        </article>
      </div>
    </PageContainer>
  );
}
