'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderArchive, Search, Download, ChevronRight, Files, Users, UserX } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useEmployees } from '@/context/EmployeeContext';
import { useEmployeeDocs } from '@/context/EmployeeDocsContext';
import { exportToCsv } from '@/lib/export';
import type { Employee } from '@/types/employee';

export default function EmployeeDocumentsPage() {
  const router = useRouter();
  const { employees } = useEmployees();
  const { records, isLoading } = useEmployeeDocs();
  const [search, setSearch] = useState('');

  const recByEmp = useMemo(() => {
    const m: Record<string, (typeof records)[number]> = {};
    records.forEach((r) => { m[r.employeeId] = r; });
    return m;
  }, [records]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees
      .filter((e) => e && e.id && (!('status' in e) || (e as { status?: string }).status !== 'Terminated'))
      .filter((e) => !q || e.name?.toLowerCase().includes(q))
      .map((e: Employee) => {
        const rec = recByEmp[e.id];
        const docCount = rec?.documents?.length || 0;
        return { e, docCount };
      });
  }, [employees, recByEmp, search]);

  const totalDocuments = rows.reduce((sum, r) => sum + r.docCount, 0);
  const withDocsCount = rows.filter((r) => r.docCount > 0).length;
  const missingDocsCount = rows.filter((r) => r.docCount === 0).length;

  const handleExport = () => {
    exportToCsv('employee-documents', rows as unknown as Record<string, unknown>[], [
      { key: 'name', label: 'Employee', value: (r) => ((r as unknown as (typeof rows)[number]).e.name as string) || '' },
      { key: 'type', label: 'Type', value: (r) => (r as unknown as (typeof rows)[number]).e.type as string },
      { key: 'documents', label: '# Documents', value: (r) => (r as unknown as (typeof rows)[number]).docCount },
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderArchive}
        eyebrow="People"
        title="Employee Documents"
        description="A per-employee home for every document — identity, work authorization, contracts, certifications & more."
        tone="brand"
        actions={
          <button onClick={handleExport} disabled={!rows.length} className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" strokeWidth={1.75} /> Export CSV
          </button>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Total documents" value={totalDocuments} icon={Files} tone="brand" hint={`across ${rows.length} active employees`} />
        <StatCard label="Employees with docs" value={withDocsCount} icon={Users} tone="emerald" />
        <StatCard label="Employees missing docs" value={missingDocsCount} icon={UserX} tone="amber" />
      </StatGrid>

      <div className="surface">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>

        {isLoading && employees.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">No active employees.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Employee', 'Type', '# Documents', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ e, docCount }) => (
                  <tr key={e.id} onClick={() => router.push(`/dashboard/documents/${e.id}`)} className="group cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">{e.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                        <p className="text-sm font-semibold text-slate-900">{e.name || 'Unnamed'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{e.type}</td>
                    <td className="px-5 py-3.5">
                      <span className={docCount > 0 ? 'inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200' : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'}>
                        {docCount} {docCount === 1 ? 'document' : 'documents'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">Manage <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={1.75} /></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3"><p className="text-xs text-slate-400">Documents are stored securely in S3 and organized per employee with categories.</p></div>
      </div>
    </div>
  );
}
