/**
 * Printable partner report (client, end client, vendor, subcontractor).
 * One implementation for all four so the roster, header and footer can't drift
 * apart per entity. Opens a print window; returns false if the popup was blocked.
 */
import { formatDate } from '@/lib/format';

export interface ReportPartner {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
}

export interface ReportEmployee {
  name: string;
  position?: string;
  type: string;
  status?: string;
  hireDate?: string;
  workAuthorization?: string;
  expiryDate?: string;
}

const escape = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

const WARN_WINDOW_MS = 90 * 86_400_000;

export function printPartnerReport({
  partner,
  employees,
  singular,
  accent = '#1f6feb',
}: {
  partner: ReportPartner;
  employees: ReportEmployee[];
  /** e.g. "Vendor" — used in the report title. */
  singular: string;
  /** Heading / rule colour. */
  accent?: string;
}): boolean {
  const counts = employees.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const activeCount = employees.filter((e) => e.status === 'Active').length;

  const rows = employees
    .map((emp) => {
      const expiring =
        emp.expiryDate &&
        new Date(emp.expiryDate) >= new Date() &&
        new Date(emp.expiryDate) <= new Date(Date.now() + WARN_WINDOW_MS);
      return `<tr>
        <td>${escape(emp.name)}</td>
        <td>${escape(emp.position || '—')}</td>
        <td>${escape(emp.type)}</td>
        <td>${escape(emp.status || '—')}</td>
        <td>${emp.hireDate ? escape(formatDate(emp.hireDate)) : '—'}</td>
        <td>${escape(emp.workAuthorization || '—')}${expiring ? ' ⚠' : ''}</td>
      </tr>`;
    })
    .join('');

  const meta = [
    partner.contactPerson ? `Contact: ${partner.contactPerson}` : '',
    partner.email,
    partner.phone,
  ]
    .filter(Boolean)
    .map((v) => escape(v))
    .join(' · ');

  const win = window.open('', '_blank');
  if (!win) return false;

  win.document.write(`<!DOCTYPE html><html><head><title>${escape(partner.name)} — ${escape(singular)} Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${accent}; margin-bottom: 24px; }
    .header h1 { font-size: 24px; font-weight: 700; color: ${accent}; }
    .header p { color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .stat-card .num { font-size: 28px; font-weight: 700; color: #1e293b; }
    .stat-card .lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${accent}; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style></head><body>
  <div class="header">
    <div>
      <h1>${escape(partner.name)}</h1>
      <p>${meta}</p>
      <p style="margin-top:6px;"><span class="badge ${partner.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${escape(partner.status)}</span></p>
    </div>
    <div style="text-align:right;color:#64748b;font-size:12px;">
      <strong>${escape(singular)} Report</strong><br/>
      Generated: ${escape(formatDate(new Date(), { long: true }))}<br/>
      ${escape(partner.address || '')}
    </div>
  </div>
  <div class="stats">
    <div class="stat-card"><div class="num">${employees.length}</div><div class="lbl">Total Employees</div></div>
    <div class="stat-card"><div class="num">${activeCount}</div><div class="lbl">Active</div></div>
    <div class="stat-card"><div class="num">${counts.W2 || 0}</div><div class="lbl">W2</div></div>
    <div class="stat-card"><div class="num">${counts.Contract || 0}</div><div class="lbl">Contract</div></div>
  </div>
  <div class="section-title">Employee Roster</div>
  <table>
    <thead><tr><th>Name</th><th>Position</th><th>Type</th><th>Status</th><th>Hire Date</th><th>Work Auth</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px;">No employees</td></tr>'}</tbody>
  </table>
  <div class="footer">
    <span>Ocean Blue Workforce Management</span>
    <span>Confidential — Internal Use Only</span>
  </div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>
  </body></html>`);
  win.document.close();
  return true;
}
