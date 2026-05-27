// Lists every AcroForm field name in the official ICE Form I-983 PDF so you can
// build the FIELD_MAP in src/config/i983Form.ts.
//
// 1. Download https://www.ice.gov/doclib/sevis/pdf/i983.pdf
// 2. Save it to public/forms/i983.pdf
// 3. Run:  node scripts/inspect-i983-fields.mjs
import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFName } from 'pdf-lib';

const file = path.join(process.cwd(), process.argv[2] || 'public/forms/i983.pdf');
if (!fs.existsSync(file)) {
  console.error(`Not found: ${file}\nDownload the fillable PDF and save it there first.`);
  process.exit(1);
}

const pdf = await PDFDocument.load(fs.readFileSync(file), { ignoreEncryption: true });
let fields = [];
try { fields = pdf.getForm().getFields(); } catch (e) { console.error('getForm error:', e.message); }

let hasXFA = false;
try {
  const acro = pdf.catalog.lookup(PDFName.of('AcroForm'));
  hasXFA = !!(acro && acro.get && acro.get(PDFName.of('XFA')));
} catch { /* ignore */ }

console.log(`pages: ${pdf.getPageCount()} | AcroForm fields: ${fields.length} | XFA: ${hasXFA ? 'YES (pdf-lib cannot fill XFA)' : 'no'}\n`);
for (const f of fields) console.log(`${f.constructor.name.padEnd(16)}  ${f.getName()}`);
if (fields.length === 0) console.log('(no fillable AcroForm fields — flat or XFA PDF; use coordinate-overlay or the worksheet)');
