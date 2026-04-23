'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Printer,
  Briefcase,
  Globe,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

const typeBadge: Record<string, string> = {
  W2: 'bg-blue-100 text-blue-700',
  Contract: 'bg-purple-100 text-purple-700',
  '1099': 'bg-teal-100 text-teal-700',
  Offshore: 'bg-pink-100 text-pink-700',
};

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const router = useRouter();
  const { employees } = useEmployees();
  const { clients, isLoading } = useClients();
  const [clientId, setClientId] = React.useState<string>('');

  React.useEffect(() => {
    params.then((p) => setClientId(p.id));
  }, [params]);

  const client = useMemo(() => {
    if (!clientId) return undefined;
    return clients.find((c) => c.id === clientId);
  }, [clients, clientId]);

  const clientEmployees = useMemo(() => {
    if (!client) return [];
    return employees.filter((emp) => {
      const inAssignments = emp.clientAssignments?.some((a) => a.clientId === client.id);
      return inAssignments || emp.clientId === client.id || emp.client === client.name;
    });
  }, [employees, client]);

  const activeCount = useMemo(
    () => clientEmployees.filter((e) => 'status' in e && (e as { status: string }).status === 'Active').length,
    [clientEmployees]
  );

  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    clientEmployees.forEach((e) => { dist[e.type] = (dist[e.type] || 0) + 1; });
    return dist;
  }, [clientEmployees]);

  const handlePrint = () => {
    if (!client) return;
    const rows = clientEmployees.map((emp) => {
      const status = 'status' in emp ? (emp as { status: string }).status : '—';
      const workAuth = 'workAuthorization' in emp ? (emp as { workAuthorization?: string; expiryDate?: string }) : null;
      const isExpiring = workAuth?.expiryDate && new Date(workAuth.expiryDate) <= new Date(Date.now() + 90 * 86400000) && new Date(workAuth.expiryDate) >= new Date();
      return `<tr>
        <td>${emp.name}</td>
        <td>${emp.position || '—'}</td>
        <td>${emp.type}</td>
        <td>${status}</td>
        <td>${emp.hireDate ? format(new Date(emp.hireDate), 'MM/dd/yyyy') : '—'}</td>
        <td>${workAuth?.workAuthorization || '—'}${isExpiring ? ' ⚠' : ''}</td>
      </tr>`;
    }).join('');

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${client.name} — Client Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #10b981; margin-bottom: 24px; }
      .header h1 { font-size: 24px; font-weight: 700; color: #059669; }
      .header p { color: #64748b; margin-top: 4px; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .badge-active { background: #d1fae5; color: #065f46; }
      .badge-inactive { background: #f1f5f9; color: #64748b; }
      .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
      .stat-card .num { font-size: 28px; font-weight: 700; color: #1e293b; }
      .stat-card .lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #059669; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; margin-top: 24px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f8fafc; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
      td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      tr:hover td { background: #f8fafc; }
      .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; display: flex; justify-content: space-between; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div>
        <h1>${client.name}</h1>
        <p>${client.contactPerson ? `Contact: ${client.contactPerson}` : ''}${client.email ? ` · ${client.email}` : ''}${client.phone ? ` · ${client.phone}` : ''}</p>
        <p style="margin-top:6px;"><span class="badge ${client.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${client.status}</span></p>
      </div>
      <div style="text-align:right;color:#64748b;font-size:12px;">
        <strong>Client Report</strong><br/>
        Generated: ${format(new Date(), 'MMMM d, yyyy')}<br/>
        ${client.address ? client.address : ''}
      </div>
    </div>
    <div class="stats">
      <div class="stat-card"><div class="num">${clientEmployees.length}</div><div class="lbl">Total Employees</div></div>
      <div class="stat-card"><div class="num">${activeCount}</div><div class="lbl">Active</div></div>
      <div class="stat-card"><div class="num">${typeDistribution.W2 || 0}</div><div class="lbl">W2</div></div>
      <div class="stat-card"><div class="num">${typeDistribution.Offshore || 0}</div><div class="lbl">Offshore</div></div>
    </div>
    <div class="section-title">Employee Roster</div>
    <table>
      <thead><tr><th>Name</th><th>Position</th><th>Type</th><th>Status</th><th>Hire Date</th><th>Work Auth</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px;">No employees</td></tr>'}</tbody>
    </table>
    <div class="footer">
      <span>ZenHR Workforce Management</span>
      <span>Confidential — Internal Use Only</span>
    </div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}<\/script>
    </body></html>`);
    win.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Client Not Found</h2>
        <button onClick={() => router.push('/dashboard/clients')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/clients')}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
        >
          <Printer className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-3xl font-bold">
            {client.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{client.name}</h1>
            {client.address && (
              <p className="mt-0.5 flex items-center gap-1 text-white/80 truncate">
                <MapPin className="h-3.5 w-3.5" />{client.address}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                client.status === 'Active' ? 'bg-emerald-400/30 text-white' : 'bg-red-400/30 text-white'
              )}>
                {client.status === 'Active' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {client.status}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                <Users className="h-3 w-3" />{clientEmployees.length} Employees
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: clientEmployees.length, bg: 'bg-blue-100', color: 'text-blue-600', icon: Users },
          { label: 'Active', value: activeCount, bg: 'bg-emerald-100', color: 'text-emerald-600', icon: CheckCircle2 },
          { label: 'W2', value: typeDistribution.W2 || 0, bg: 'bg-indigo-100', color: 'text-indigo-600', icon: Briefcase },
          { label: 'Offshore', value: typeDistribution.Offshore || 0, bg: 'bg-pink-100', color: 'text-pink-600', icon: Globe },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', s.bg)}>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Info */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Client Information</h2>
          </div>
          <div className="space-y-4">
            {client.contactPerson && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Users className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Contact Person</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{client.contactPerson}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Email</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{client.email}</p>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Phone</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{client.phone}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <MapPin className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Address</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{client.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Type breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Employee Type Breakdown</h2>
          </div>
          {clientEmployees.length === 0 ? (
            <p className="text-sm text-slate-400">No employees assigned</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', typeBadge[type] || 'bg-slate-100 text-slate-600')}>
                    {type}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 rounded-full bg-slate-100 w-28">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${(count / clientEmployees.length) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
            {format(new Date(client.createdAt), 'MMM d, yyyy')} — {format(new Date(client.updatedAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Employees table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Employees</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{clientEmployees.length}</span>
          </div>
        </div>

        {clientEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Users className="h-7 w-7 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">No employees assigned to this client</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-[2fr_1.5fr_80px_90px_100px_80px] gap-3 px-5 py-3">
              {['Employee', 'Position', 'Type', 'Status', 'Hire Date', ''].map((h) => (
                <span key={h} className="text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</span>
              ))}
            </div>
            {clientEmployees.map((emp, idx) => {
              const status = 'status' in emp ? (emp as { status: string }).status : null;
              const workAuth = 'expiryDate' in emp ? (emp as { expiryDate?: string }) : null;
              const isExpiring = workAuth?.expiryDate &&
                new Date(workAuth.expiryDate) > new Date() &&
                new Date(workAuth.expiryDate) <= new Date(Date.now() + 90 * 86400000);
              return (
                <div
                  key={emp.id ?? idx}
                  className="grid cursor-pointer grid-cols-[2fr_1.5fr_80px_90px_100px_80px] items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                  onClick={() => router.push(`/dashboard/employees/${emp.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{emp.name}</p>
                      {emp.personalEmail && <p className="truncate text-xs text-slate-400">{emp.personalEmail}</p>}
                    </div>
                  </div>
                  <span className="truncate text-sm text-slate-600">{emp.position || '—'}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', typeBadge[emp.type] || 'bg-slate-100 text-slate-600')}>
                    {emp.type}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    status === 'Active' ? 'bg-emerald-100 text-emerald-700' : status ? 'bg-slate-100 text-slate-600' : 'text-slate-400'
                  )}>
                    {status || '—'}
                  </span>
                  <span className="text-sm text-slate-600">
                    {emp.hireDate ? format(new Date(emp.hireDate), 'MM/dd/yyyy') : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    {isExpiring && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/employees/${emp.id}`); }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">Showing {clientEmployees.length} employees</p>
        </div>
      </div>
    </div>
  );
}
