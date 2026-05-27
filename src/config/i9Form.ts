/**
 * Form I-9 official-form registry. The edition date + OMB number live in the
 * template PDF and here — never hardcoded into output. When USCIS reissues the
 * I-9, save the new fillable PDF to public/forms/i-9.pdf and bump `edition`.
 */
export const I9_FORM = {
  edition: '08/01/23',
  ombNumber: '1615-0047',
  templatePath: 'public/forms/i-9.pdf',
  sourceUrl: 'https://www.uscis.gov/i-9',
};
