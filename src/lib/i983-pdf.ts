// SERVER-ONLY. Generates a Form I-983 PDF from our stored record.
//
// Two modes:
//  1. If ICE's fillable PDF is present at I983_FORM.templatePath AND I983_FIELD_MAP
//     is populated → fills the OFFICIAL form's AcroForm fields (OMB number &
//     expiration come from the template itself, so they're always current).
//  2. Otherwise → renders a clean "pre-fill worksheet" from our data that maps
//     1:1 onto the official form for transcription/review.
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { I983_FORM, I983_FIELD_MAP } from '@/config/i983Form';
import { I983Record } from '@/types/i983';

type Row = { label: string; value: string };
type Section = { heading: string; rows: Row[] };

const v = (s?: string | number | boolean) =>
  s === undefined || s === null || s === '' ? '—' : typeof s === 'boolean' ? (s ? 'Yes' : 'No') : String(s);

/** Flatten our record into the values that map onto the official form. */
export function i983PdfValues(r: I983Record): Record<string, string> {
  return {
    employeeName: v(r.employeeName),
    schoolName: v(r.schoolName),
    degreeLevel: v(r.degreeLevel),
    sevisId: v(r.sevisId),
    fieldOfStudy: v(r.fieldOfStudy),
    employerName: v(r.employerName),
    employerEIN: v(r.employerEIN),
    siteAddress: v(r.siteAddress),
    jobTitle: v(r.jobTitle),
    hoursPerWeek: v(r.hoursPerWeek),
    compensation: v(r.compensation),
    supervisorName: v(r.supervisorName),
    supervisorEmail: v(r.supervisorEmail),
    jobDuties: v(r.jobDuties),
    goalsObjectives: v(r.goalsObjectives),
    oversightMeasurement: v(r.oversightMeasurement),
    trainingStartDate: v(r.trainingStartDate),
    trainingEndDate: v(r.trainingEndDate),
    eval12Due: v(r.eval12?.dueDate),
    eval12Completed: v(r.eval12?.completedDate),
    eval24Due: v(r.eval24?.dueDate),
    eval24Completed: v(r.eval24?.completedDate),
  };
}

function sections(r: I983Record): Section[] {
  return [
    { heading: 'Student & school', rows: [
      { label: 'Student name', value: v(r.employeeName) },
      { label: 'School', value: v(r.schoolName) },
      { label: 'Degree level', value: v(r.degreeLevel) },
      { label: 'SEVIS ID', value: v(r.sevisId) },
      { label: 'Field of study', value: v(r.fieldOfStudy) },
    ] },
    { heading: 'Employer', rows: [
      { label: 'Employer name', value: v(r.employerName) },
      { label: 'Employer EIN', value: v(r.employerEIN) },
      { label: 'Training site', value: v(r.siteAddress) },
    ] },
    { heading: 'Training plan', rows: [
      { label: 'Job title', value: v(r.jobTitle) },
      { label: 'Hours / week', value: v(r.hoursPerWeek) },
      { label: 'Compensation', value: v(r.compensation) },
      { label: 'Supervisor', value: `${v(r.supervisorName)} · ${v(r.supervisorEmail)}` },
      { label: 'Duties', value: v(r.jobDuties) },
      { label: 'Goals & objectives', value: v(r.goalsObjectives) },
      { label: 'Oversight & measurement', value: v(r.oversightMeasurement) },
      { label: 'Training dates', value: `${v(r.trainingStartDate)} → ${v(r.trainingEndDate)}` },
    ] },
    { heading: 'Evaluations', rows: [
      { label: '12-month eval', value: `due ${v(r.eval12?.dueDate)} · completed ${v(r.eval12?.completedDate)}` },
      { label: '24-month eval', value: `due ${v(r.eval24?.dueDate)} · completed ${v(r.eval24?.completedDate)}` },
    ] },
    ...(r.materialChanges?.length
      ? [{ heading: 'Material changes', rows: r.materialChanges.map((c) => ({ label: v(c.date), value: `${v(c.description)} (reported ${v(c.reportedDate)})` })) }]
      : []),
  ];
}

/** Fill ICE's official fillable PDF using the configured field map. */
async function fillOfficialTemplate(r: I983Record, template: Buffer): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(template, { ignoreEncryption: true });
  const form = pdf.getForm();
  const vals = i983PdfValues(r);
  for (const [ourKey, pdfField] of Object.entries(I983_FIELD_MAP)) {
    const val = vals[ourKey];
    if (val === undefined) continue;
    try {
      form.getTextField(pdfField).setText(val === '—' ? '' : val);
    } catch {
      // field not a text field / not found — skip
    }
  }
  form.flatten();
  return pdf.save();
}

/** Generate a clean pre-fill worksheet from our data (no official template needed). */
async function buildWorksheet(r: I983Record): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.063, 0.18, 0.157); // forest
  const grey = rgb(0.42, 0.45, 0.5);

  let page = pdf.addPage([612, 792]); // US Letter
  const M = 54;
  let y = 792 - M;

  const wrap = (text: string, size: number, f = font, max = 612 - M * 2): string[] => {
    const out: string[] = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(test, size) > max && line) { out.push(line); line = word; } else line = test;
      }
      out.push(line);
    }
    return out;
  };
  const ensure = (h: number) => { if (y - h < M) { page = pdf.addPage([612, 792]); y = 792 - M; } };
  const text = (s: string, size: number, f = font, color = ink) => {
    for (const ln of wrap(s, size, f)) { ensure(size + 4); page.drawText(ln, { x: M, y: y - size, size, font: f, color }); y -= size + 4; }
  };

  text('Form I-983 — Training Plan (pre-fill worksheet)', 16, bold);
  y -= 2;
  text(`Maps onto official Form I-983 · OMB No. ${I983_FORM.ombNumber} · exp. ${I983_FORM.ombExpiration}. Transcribe onto the official form and obtain required signatures.`, 8.5, font, grey);
  y -= 10;

  for (const sec of sections(r)) {
    ensure(26);
    page.drawText(sec.heading.toUpperCase(), { x: M, y: y - 11, size: 11, font: bold, color: ink });
    y -= 22;
    for (const row of sec.rows) {
      ensure(16);
      page.drawText(row.label, { x: M, y: y - 9, size: 9, font: bold, color: grey });
      y -= 14;
      text(row.value, 10);
      y -= 4;
    }
    y -= 8;
  }
  return pdf.save();
}

export async function buildI983Pdf(r: I983Record): Promise<{ bytes: Uint8Array; official: boolean }> {
  const abs = path.join(process.cwd(), I983_FORM.templatePath);
  // The current ICE I-983 is an encrypted XFA PDF that pdf-lib cannot fill, so
  // we only try the official template when a field map is configured, and fall
  // back to the worksheet if anything throws (rather than failing the request).
  if (Object.keys(I983_FIELD_MAP).length > 0 && fs.existsSync(abs)) {
    try {
      return { bytes: await fillOfficialTemplate(r, fs.readFileSync(abs)), official: true };
    } catch (err) {
      console.error('Official I-983 fill failed (likely XFA) — using worksheet:', err);
    }
  }
  return { bytes: await buildWorksheet(r), official: false };
}
