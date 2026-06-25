/**
 * Generic "print to PDF" for a tabular dataset — mirrors the Reports page
 * mechanism (open a window, write styled HTML, auto-invoke print) so the user
 * gets a clean PDF via the browser's print dialog without a new dependency.
 */
function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

export function printTablePdf(title: string, subtitle: string, headers: string[], rows: (string | number)[][]): void {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return;

  const thead = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const tbody = rows.length
    ? rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}" class="empty">No rows</td></tr>`;

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8" /><title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 32px; }
  header { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #15847a; padding-bottom: 12px; margin-bottom: 18px; }
  h1 { font-size: 18px; margin: 0; color: #134e48; }
  .sub { font-size: 12px; color: #64748b; }
  .meta { font-size: 11px; color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th { text-align: left; background: #f1f5f9; color: #475569; font-weight: 700; padding: 7px 9px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 6px 9px; border-bottom: 1px solid #f1f5f9; }
  tr:nth-child(even) td { background: #fafafa; }
  td.empty { text-align: center; color: #94a3b8; padding: 24px; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <header>
    <div><h1>${esc(title)}</h1><div class="sub">${esc(subtitle)}</div></div>
    <div class="meta">Generated ${esc(new Date().toLocaleString())}</div>
  </header>
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <script>window.onload = () => { setTimeout(() => window.print(), 220); };</script>
</body></html>`);
  win.document.close();
}
