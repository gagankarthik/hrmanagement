/**
 * Form I-983 official-form registry.
 *
 * The OMB number and expiration date live HERE (and, when you fill the official
 * template, inside the template PDF itself) — never hardcoded into form output.
 * When ICE reissues Form I-983 (new OMB expiration):
 *   1. download the new fillable PDF from https://www.ice.gov/doclib/sevis/pdf/i983.pdf
 *   2. save it to `public/forms/i983.pdf`
 *   3. run `node scripts/inspect-i983-fields.mjs` and reconcile FIELD_MAP below
 *   4. bump `version` / `ombExpiration` here.
 */
export const I983_FORM = {
  version: '2024-05',
  ombNumber: '1653-0054',
  ombExpiration: '04/30/2029',
  sourceUrl: 'https://www.ice.gov/doclib/sevis/pdf/i983.pdf',
  /** Place ICE's fillable PDF here to switch from worksheet → official-form fill. */
  templatePath: 'public/forms/i983.pdf',
};

/**
 * Maps our record values → the official PDF's AcroForm field names.
 * Empty until the official PDF is added and field names are extracted with the
 * inspect script. While empty, the API generates a clean pre-fill worksheet
 * instead. Keys are the value keys produced by `i983PdfValues()`.
 */
export const I983_FIELD_MAP: Record<string, string> = {
  // employeeName: 'student_name',
  // schoolName: 'school_name',
  // ...fill in after running scripts/inspect-i983-fields.mjs
};
