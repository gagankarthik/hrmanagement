// Print-ready PDF (HTML) builder for the Workforce Report. Opened in a new
// window and printed via the browser. Moved verbatim from the original page.tsx.

import { format, differenceInDays } from 'date-fns';
import { resolveName } from '@/lib/names';
import type { Employee, EmployeeType } from '@/types/employee';
import { TYPE_LABEL, isActive, monthlyPay, compactCurrency, fullCurrency } from './shared';

export interface BuildPdfArgs {
  filtered: Employee[];
  clients: { id: string; name: string }[];
  vendors: { id: string; name: string }[];
  metrics: { total: number; active: number; terminated: number; revenue: number; billable: number; utilization: number; bench: number; expired: number; b30: number; b60: number; b90: number; avgTenureYears: number | null };
  filters: { type: string; status: string; revenue: string; state: string; client: string; vendor: string; hasFilters: boolean };
}

export function buildPdfHtml({ filtered, clients, vendors, metrics, filters }: BuildPdfArgs): string {
  const now = new Date();
  const dateStr = format(now, 'MMMM d, yyyy');
  const timeStr = format(now, 'HH:mm');

  // Aggregations
  const typeDist: Record<EmployeeType, number> = { W2: 0, Contract: 0, '1099': 0, Offshore: 0 };
  const stateDist: Record<string, number> = {};
  const authMix: Record<string, number> = {};
  filtered.forEach((e) => {
    typeDist[e.type] += 1;
    if (e.state) stateDist[e.state] = (stateDist[e.state] || 0) + 1;
    const wa = 'workAuthorization' in e ? (e as { workAuthorization?: string }).workAuthorization : undefined;
    if (wa) authMix[wa] = (authMix[wa] || 0) + 1;
  });
  const topStates = Object.entries(stateDist).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topAuth = Object.entries(authMix).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Expiring
  const in90 = new Date(now.getTime() + 90 * 86400000);
  const expiring = filtered.filter((e) => {
    if (!isActive(e)) return false;
    const exp = 'expiryDate' in e ? (e as { expiryDate?: string }).expiryDate : undefined;
    if (!exp) return false;
    const d = new Date(exp);
    return !Number.isNaN(d.getTime()) && d <= in90;
  }).sort((a, b) => new Date((a as { expiryDate?: string }).expiryDate!).getTime() - new Date((b as { expiryDate?: string }).expiryDate!).getTime());

  // Active filter chips
  const chipLabel = (k: string, v: string): string | null => {
    if (v === 'all') return null;
    if (k === 'Client') return `Client: ${resolveName(v, clients, { unknown: 'Unknown client' })}`;
    if (k === 'Vendor') return `Vendor: ${resolveName(v, vendors, { unknown: 'Unknown vendor' })}`;
    return `${k}: ${v}`;
  };
  const activeFilters = [
    chipLabel('Class', filters.type),
    chipLabel('Status', filters.status),
    chipLabel('Revenue', filters.revenue === 'B' ? 'Billable' : filters.revenue === 'NB' ? 'Non-Billable' : filters.revenue),
    chipLabel('State', filters.state),
    chipLabel('Client', filters.client),
    chipLabel('Vendor', filters.vendor),
  ].filter(Boolean);

  // Top placements
  const topClients = (() => {
    const m: Record<string, { name: string; count: number }> = {};
    filtered.forEach((e) => {
      const ids = e.clientAssignments?.map((a) => a.clientId).filter(Boolean) || (e.clientId ? [e.clientId] : []);
      Array.from(new Set(ids)).forEach((id) => {
        const known = clients.some((c) => c.id === id);
        const name = resolveName(id, clients, { unknown: 'Unknown client' });
        const key = known ? id : `name:${name.toLowerCase()}`;
        if (!m[key]) m[key] = { name, count: 0 };
        m[key].count += 1;
      });
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 10);
  })();
  const topVendors = (() => {
    const m: Record<string, { name: string; count: number }> = {};
    filtered.forEach((e) => {
      const ids = e.vendorAssignments?.map((a) => a.vendorId).filter(Boolean) || (e.vendorId ? [e.vendorId] : []);
      Array.from(new Set(ids)).forEach((id) => {
        const known = vendors.some((vv) => vv.id === id);
        const name = resolveName(id, vendors, { unknown: 'Unknown vendor' });
        const key = known ? id : `name:${name.toLowerCase()}`;
        if (!m[key]) m[key] = { name, count: 0 };
        m[key].count += 1;
      });
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 10);
  })();

  const css = `
    @page { size: A4; margin: 14mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a; font-size: 11px; line-height: 1.45;
      background: #fff;
    }

    /* COVER */
    .cover { padding: 48px 32px; }
    .cover .brand {
      display: flex; align-items: center; gap: 12px;
      padding-bottom: 18px; border-bottom: 1px solid #cbd5e1;
    }
    .cover .brand-mark {
      width: 36px; height: 36px; border-radius: 8px;
      background: #4f46e5; display: inline-flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 14px; letter-spacing: 0.5px;
    }
    .cover .brand-info p:first-child { font-weight: 800; font-size: 16px; letter-spacing: -0.01em; color: #0f172a; }
    .cover .brand-info p:last-child  { font-size: 10px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.16em; }

    .cover-title {
      margin-top: 36px;
      font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; color: #0f172a;
    }
    .cover-sub {
      margin-top: 12px; font-size: 14px; color: #475569; max-width: 460px;
    }
    .cover-meta {
      margin-top: 28px; display: flex; flex-wrap: wrap; gap: 6px;
    }
    .cover-meta .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 999px;
      background: #eef2ff; color: #3730a3;
      font-size: 10px; font-weight: 700; letter-spacing: 0.02em;
    }
    .cover-grid {
      margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    }
    .cover-stat {
      padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px;
      page-break-inside: avoid;
    }
    .cover-stat .label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; }
    .cover-stat .value { margin-top: 6px; font-size: 24px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .cover-stat .sub   { margin-top: 2px; font-size: 10px; color: #64748b; }
    .cover-stat.alert .value { color: #b91c1c; }
    .cover-stat.warn  .value { color: #b45309; }
    .cover-stat.good  .value { color: #047857; }

    .cover-footer {
      margin-top: 44px; padding-top: 14px; border-top: 1px solid #cbd5e1;
      display: flex; justify-content: space-between; font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.16em; color: #94a3b8;
    }

    /* SECTIONS */
    .section { page-break-before: always; padding: 24px 32px; }
    .section .eyebrow {
      font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em;
      color: #4f46e5; padding-bottom: 4px;
    }
    .section h2 {
      font-size: 22px; font-weight: 800; letter-spacing: -0.015em; color: #0f172a;
      padding-bottom: 8px; border-bottom: 2px solid #0f172a;
    }
    .section .lede {
      margin-top: 10px; font-size: 11px; color: #475569; max-width: 540px;
    }

    table { width: 100%; border-collapse: collapse; margin-top: 16px; page-break-inside: auto; }
    table th {
      text-align: left; font-size: 8px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      padding: 8px 10px; color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    table td {
      padding: 8px 10px; border-bottom: 1px solid #f1f5f9;
      font-size: 11px; vertical-align: middle;
      page-break-inside: avoid;
    }
    table tr:nth-child(even) td { background: #fcfcfd; }
    table tr.tfoot td {
      font-weight: 700; border-top: 2px solid #0f172a; background: #f8fafc;
    }
    .tnum { font-variant-numeric: tabular-nums; }
    .num { text-align: right; }
    .badge {
      display: inline-block; padding: 1px 6px; border-radius: 4px;
      font-size: 9px; font-weight: 700; letter-spacing: 0.02em;
    }
    .badge-W2       { background: #dbeafe; color: #1e40af; }
    .badge-Contract { background: #f3e8ff; color: #6b21a8; }
    .badge-1099     { background: #ccfbf1; color: #115e59; }
    .badge-Offshore { background: #fce7f3; color: #9d174d; }
    .badge-active   { background: #d1fae5; color: #065f46; }
    .badge-term     { background: #fee2e2; color: #991b1b; }
    .pill-red    { background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .pill-amber  { background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .pill-yellow { background: #fef9c3; color: #854d0e; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .pill-sky    { background: #e0f2fe; color: #075985; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }

    .bar {
      width: 100%; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
    }
    .bar > div { height: 100%; }

    .footer {
      margin-top: 24px; padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px; color: #94a3b8;
      display: flex; justify-content: space-between;
      text-transform: uppercase; letter-spacing: 0.1em;
    }
  `;

  const sectionShell = (eyebrow: string, title: string, lede: string, body: string) => `
    <div class="section">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p class="lede">${lede}</p>
      ${body}
      <div class="footer">
        <span>Ocean Blue · Workforce Brief</span>
        <span>Filed ${dateStr} · ${timeStr}</span>
      </div>
    </div>
  `;

  // Workforce section content
  const workforceBody = `
    <table>
      <thead>
        <tr><th>Class</th><th class="num">Total</th><th class="num">Active</th><th class="num">Terminated</th><th class="num">Share</th></tr>
      </thead>
      <tbody>
        ${(Object.keys(typeDist) as EmployeeType[]).map((t) => {
          const total = typeDist[t];
          const a = filtered.filter((e) => e.type === t && isActive(e)).length;
          const x = total - a;
          const share = filtered.length ? (total / filtered.length) * 100 : 0;
          return `<tr>
            <td><span class="badge badge-${t}">${TYPE_LABEL[t]}</span></td>
            <td class="num tnum">${total}</td>
            <td class="num tnum">${a}</td>
            <td class="num tnum">${x}</td>
            <td class="num tnum">${share.toFixed(1)}%</td>
          </tr>`;
        }).join('')}
        <tr class="tfoot">
          <td>Total</td>
          <td class="num tnum">${filtered.length}</td>
          <td class="num tnum">${metrics.active}</td>
          <td class="num tnum">${metrics.terminated}</td>
          <td class="num tnum">100%</td>
        </tr>
      </tbody>
    </table>

    ${topStates.length > 0 ? `
      <h3 style="margin-top:24px; font-size: 13px; font-weight: 700; color: #0f172a;">Top States</h3>
      <table>
        <thead><tr><th>Rank</th><th>State</th><th class="num">Employees</th><th class="num">Share</th></tr></thead>
        <tbody>
          ${topStates.map(([state, count], i) => {
            const share = filtered.length ? (count / filtered.length) * 100 : 0;
            return `<tr>
              <td class="tnum" style="color:#64748b">#${String(i + 1).padStart(2, '0')}</td>
              <td>${state}</td>
              <td class="num tnum">${count}</td>
              <td class="num tnum">${share.toFixed(1)}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : ''}
  `;

  // Compliance
  const complianceBody = expiring.length === 0 ? `
    <p style="margin-top:18px; padding: 14px; background: #d1fae5; color: #065f46; border-radius: 8px; font-size: 11px;">
      ✓ No upcoming or expired work authorizations in the next 90 days for the filtered workforce.
    </p>
  ` : `
    <table>
      <thead>
        <tr><th>Employee</th><th>Class</th><th>Authorization</th><th>Expiry</th><th>Status</th><th>State</th></tr>
      </thead>
      <tbody>
        ${expiring.slice(0, 60).map((e) => {
          const exp = new Date((e as { expiryDate?: string }).expiryDate!);
          const wa = (e as { workAuthorization?: string }).workAuthorization;
          const days = differenceInDays(exp, now);
          const pill = days < 0 ? `<span class="pill-red">${Math.abs(days)}d overdue</span>`
            : days <= 30 ? `<span class="pill-amber">${days}d left</span>`
            : days <= 60 ? `<span class="pill-yellow">${days}d left</span>`
            : `<span class="pill-sky">${days}d left</span>`;
          return `<tr>
            <td>
              <div style="font-weight: 600;">${e.name}</div>
              <div style="font-size: 10px; color: #64748b;">${e.position || '—'}</div>
            </td>
            <td><span class="badge badge-${e.type}">${TYPE_LABEL[e.type]}</span></td>
            <td>${wa || '—'}</td>
            <td>${format(exp, 'MMM d, yyyy')}</td>
            <td>${pill}</td>
            <td>${e.state || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${expiring.length > 60 ? `<p style="margin-top:8px; font-size: 9px; color: #94a3b8;">Showing 60 of ${expiring.length}. Export CSV for the full list.</p>` : ''}

    ${topAuth.length > 0 ? `
      <h3 style="margin-top:24px; font-size: 13px; font-weight: 700; color: #0f172a;">Authorization Mix</h3>
      <table>
        <thead><tr><th>Authorization</th><th class="num">Count</th><th class="num">Share</th></tr></thead>
        <tbody>
          ${topAuth.map(([auth, count]) => {
            const share = filtered.length ? (count / filtered.length) * 100 : 0;
            return `<tr>
              <td>${auth}</td>
              <td class="num tnum">${count}</td>
              <td class="num tnum">${share.toFixed(1)}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : ''}
  `;

  // Financial
  const financialBody = `
    <table>
      <thead>
        <tr><th>Class</th><th class="num">Active</th><th class="num">Billable</th><th class="num">Monthly run-rate</th></tr>
      </thead>
      <tbody>
        ${(Object.keys(typeDist) as EmployeeType[]).map((t) => {
          const a = filtered.filter((e) => e.type === t && isActive(e));
          const billable = a.filter((e) => 'revenueStatus' in e && (e as { revenueStatus?: string }).revenueStatus === 'B');
          const rev = billable.reduce((s, e) => s + monthlyPay(e), 0);
          return `<tr>
            <td><span class="badge badge-${t}">${TYPE_LABEL[t]}</span></td>
            <td class="num tnum">${a.length}</td>
            <td class="num tnum">${billable.length}</td>
            <td class="num tnum" style="font-weight:700; color:#047857">${fullCurrency(rev)}</td>
          </tr>`;
        }).join('')}
        <tr class="tfoot">
          <td>Total · ${metrics.utilization}% utilization</td>
          <td class="num tnum">${metrics.active}</td>
          <td class="num tnum">${metrics.billable}</td>
          <td class="num tnum" style="color:#047857">${fullCurrency(metrics.revenue)}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Network
  const networkBody = `
    ${topClients.length > 0 ? `
      <h3 style="margin-top:8px; font-size: 13px; font-weight: 700; color: #0f172a;">Top Clients</h3>
      <table>
        <thead><tr><th>Rank</th><th>Client</th><th class="num">Placements</th></tr></thead>
        <tbody>
          ${topClients.map((c, i) => `<tr>
            <td class="tnum" style="color:#64748b">#${String(i + 1).padStart(2, '0')}</td>
            <td>${c.name}</td>
            <td class="num tnum">${c.count}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}
    ${topVendors.length > 0 ? `
      <h3 style="margin-top:18px; font-size: 13px; font-weight: 700; color: #0f172a;">Top Vendors</h3>
      <table>
        <thead><tr><th>Rank</th><th>Vendor</th><th class="num">Placements</th></tr></thead>
        <tbody>
          ${topVendors.map((v, i) => `<tr>
            <td class="tnum" style="color:#64748b">#${String(i + 1).padStart(2, '0')}</td>
            <td>${v.name}</td>
            <td class="num tnum">${v.count}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    ` : ''}
    ${topClients.length === 0 && topVendors.length === 0 ? '<p style="margin-top:14px; color:#64748b; font-size:11px;">No client or vendor placements in the filtered scope.</p>' : ''}
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Ocean Blue · Workforce Report · ${dateStr}</title>
      <style>${css}</style>
    </head>
    <body>
      <!-- COVER -->
      <div class="cover">
        <div class="brand">
          <span class="brand-mark">C</span>
          <div class="brand-info">
            <p>Ocean Blue</p>
            <p>Workforce Operations Platform</p>
          </div>
        </div>

        <h1 class="cover-title">Workforce<br/>Report.</h1>
        <p class="cover-sub">
          A snapshot of headcount, compliance, financial standing and network exposure across
          ${filtered.length.toLocaleString()} ${filtered.length === 1 ? 'employee' : 'employees'} on the books as of ${dateStr}.
        </p>

        <div class="cover-meta">
          <span class="chip">As of ${dateStr}</span>
          <span class="chip">${filtered.length.toLocaleString()} records</span>
          ${activeFilters.map((f) => `<span class="chip">${f}</span>`).join('')}
        </div>

        <div class="cover-grid">
          <div class="cover-stat"><div class="label">Headcount</div><div class="value">${metrics.total.toLocaleString()}</div><div class="sub">${metrics.active} active · ${metrics.terminated} terminated</div></div>
          <div class="cover-stat good"><div class="label">Monthly run-rate</div><div class="value">${compactCurrency(metrics.revenue)}</div><div class="sub">${metrics.billable} billable employees</div></div>
          <div class="cover-stat"><div class="label">Utilization</div><div class="value">${metrics.utilization}%</div><div class="sub">billable ÷ active</div></div>
          <div class="cover-stat ${metrics.expired > 0 ? 'alert' : ''}"><div class="label">Expired auths</div><div class="value">${metrics.expired}</div><div class="sub">renew immediately</div></div>
          <div class="cover-stat ${metrics.b30 > 0 ? 'warn' : ''}"><div class="label">Expire in 30 days</div><div class="value">${metrics.b30}</div><div class="sub">${metrics.b60 + metrics.b90} more in 31–90d</div></div>
          <div class="cover-stat"><div class="label">Avg tenure</div><div class="value">${metrics.avgTenureYears !== null ? metrics.avgTenureYears + 'y' : '—'}</div><div class="sub">years of service</div></div>
        </div>

        <div class="cover-footer">
          <span>Filed ${dateStr} · ${timeStr}</span>
          <span>Confidential · Internal use only</span>
        </div>
      </div>

      ${sectionShell('Section I', 'Workforce composition', 'How your workforce breaks down by employment class and geography.', workforceBody)}
      ${sectionShell('Section II', 'Compliance & risk', 'Work authorization status and renewal pipeline for the next 90 days.', complianceBody)}
      ${sectionShell('Section III', 'Financial snapshot', 'Monthly billable run-rate by employment class.', financialBody)}
      ${sectionShell('Section IV', 'Client & vendor network', 'Where your placements are concentrated.', networkBody)}

      <script>window.onload = () => { setTimeout(() => window.print(), 220); };</script>
    </body>
    </html>
  `;
}
