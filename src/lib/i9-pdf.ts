// SERVER-ONLY. Fills the OFFICIAL USCIS Form I-9 (a standard AcroForm) from our
// stored I-9 record + employee data using pdf-lib. The form's edition/OMB live
// in the template PDF itself, so they're always current.
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { I9_FORM } from '@/config/i9Form';
import { I9Record } from '@/types/i9';
import { BRAND } from '@/config/brand';

export type I9EmployeeLike = {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dob?: string;
  personalEmail?: string;
  officeEmail?: string;
  contactNo?: string;
  hireDate?: string;
};

function isoToUS(iso?: string): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : iso;
}

// Section 1 citizenship attestation checkboxes (standard form order 1–4).
const CITIZEN_CB: Record<string, string> = {
  'U.S. Citizen': 'CB_1',
  'Noncitizen National': 'CB_2',
  'Lawful Permanent Resident': 'CB_3',
  'Alien Authorized to Work': 'CB_4',
};

export async function buildI9Pdf(rec: I9Record, emp: I9EmployeeLike): Promise<Uint8Array> {
  const abs = path.join(process.cwd(), I9_FORM.templatePath);
  const pdf = await PDFDocument.load(fs.readFileSync(abs), { ignoreEncryption: true });
  const form = pdf.getForm();

  const text = (field: string, val?: string) => {
    if (val == null || val === '') return;
    try { form.getTextField(field).setText(String(val)); } catch { /* field absent / not text */ }
  };
  const drop = (field: string, val?: string) => {
    if (!val) return;
    try { form.getDropdown(field).select(val); } catch { /* value not an option */ }
  };
  const check = (field?: string) => {
    if (!field) return;
    try { form.getCheckBox(field).check(); } catch { /* absent */ }
  };

  const tokens = (emp.name || rec.employeeName || '').trim().split(/\s+/).filter(Boolean);
  const first = tokens[0] || '';
  const last = tokens.length > 1 ? tokens[tokens.length - 1] : '';
  const middle = tokens.length > 2 ? tokens[1].charAt(0) : '';

  // ── Section 1 · Employee ──
  text('Last Name (Family Name)', last);
  text('First Name Given Name', first);
  text('Employee Middle Initial (if any)', middle);
  text('Address Street Number and Name', emp.address);
  text('City or Town', emp.city);
  drop('State', emp.state);
  text('ZIP Code', emp.pincode);
  text('Date of Birth mmddyyyy', isoToUS(emp.dob));
  text('Employees E-mail Address', emp.personalEmail || emp.officeEmail);
  text('Telephone Number', emp.contactNo);
  text("Today's Date mmddyyy", isoToUS(rec.section1Date));
  check(CITIZEN_CB[rec.citizenshipStatus || '']);
  if (rec.citizenshipStatus === 'Lawful Permanent Resident') {
    text('3 A lawful permanent resident Enter USCIS or ANumber', rec.alienNumber);
  } else if (rec.citizenshipStatus === 'Alien Authorized to Work') {
    text('USCIS ANumber', rec.alienNumber);
    text('Exp Date mmddyyyy', isoToUS(rec.documentExpiry));
  }

  // ── Section 2 · name reprint + employer basics (document grid left for reviewer) ──
  text('Last Name Family Name from Section 1', last);
  text('First Name Given Name from Section 1', first);
  text('Middle initial if any from Section 1', middle);
  text('FirstDayEmployed mmddyyyy', isoToUS(emp.hireDate));
  text('Employers Business or Org Name', BRAND.name);
  text('S2 Todays Date mmddyyyy', isoToUS(rec.section2Date));
  const docSummary = [
    rec.documentTitle,
    rec.documentNumber && `#${rec.documentNumber}`,
    rec.issuingAuthority,
    rec.documentExpiry && `exp ${isoToUS(rec.documentExpiry)}`,
  ].filter(Boolean).join(' · ');
  if (docSummary) text('Additional Information', `Document on file: ${docSummary}`);

  // Leave fields editable so the record can be reviewed, corrected, and signed.
  return pdf.save();
}
