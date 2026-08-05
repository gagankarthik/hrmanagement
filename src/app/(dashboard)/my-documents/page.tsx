'use client';

import React, { useMemo } from 'react';
import { FolderOpen, FileText, ExternalLink, Download, Layers, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useEmployeeDocs } from '@/context/EmployeeDocsContext';
import { useSelfEmployee } from '@/hooks/useSelfEmployee';
import { useAuth } from '@/context/AuthContext';
import { DOC_CATEGORIES, DocCategory, EmployeeDocItem } from '@/types/employee-docs';

function fmtSize(n?: number) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

/**
 * Self-service document portal (ESS). Shows the signed-in user ONLY their own
 * documents/payslips, resolved by matching their login email to an employee
 * record (via useSelfEmployee). Read-only — download & view, no upload or edit.
 */
export default function MyDocumentsPage() {
  const { user } = useAuth();
  const self = useSelfEmployee();
  const { getByEmployee, isLoading } = useEmployeeDocs();

  const firstName = (self?.name || user?.name || user?.email?.split('@')[0] || 'there').split(' ')[0];
  const rec = self ? getByEmployee(self.id) : undefined;
  const docs: EmployeeDocItem[] = useMemo(() => rec?.documents ?? [], [rec]);

  // Group by category for a tidy library view.
  const grouped = useMemo(() => {
    const map = new Map<DocCategory, EmployeeDocItem[]>();
    for (const d of docs) {
      const cat = (d.category || 'Other') as DocCategory;
      const arr = map.get(cat) || [];
      arr.push(d);
      map.set(cat, arr);
    }
    return DOC_CATEGORIES.map((c) => ({ category: c, items: map.get(c) || [] })).filter((g) => g.items.length > 0);
  }, [docs]);

  const categoriesCount = grouped.length;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={3} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        icon={FolderOpen}
        eyebrow="My Portal"
        title="My Documents"
        description={`Your documents and payslips on file, ${firstName}. Download or view anytime.`}
        tone="brand"
      />

      <StatGrid cols={3}>
        <StatCard label="Documents" value={docs.length} icon={Layers} tone="brand" hint="on file for you" />
        <StatCard label="Categories" value={categoriesCount} icon={FolderOpen} tone="slate" hint="how they're grouped" />
        <StatCard label="Access" value="Private" icon={ShieldCheck} tone="emerald" hint="only you can see these" />
      </StatGrid>

      {docs.length === 0 ? (
        <div className="surface p-5">
          <EmptyState
            icon={FolderOpen}
            tone="brand"
            title={self ? 'No documents yet' : 'No documents linked to your account'}
            description={
              self
                ? 'When your HR team adds documents or payslips for you, they’ll appear here to view and download.'
                : 'We couldn’t match your login to an employee record yet. Once your HR team links your profile, your documents will show up here.'
            }
          />
        </div>
      ) : (
        <div className="surface p-5 sm:p-6">
          <div className="space-y-6">
            {grouped.map(({ category, items }) => (
              <div key={category}>
                <div className="mb-2.5 flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-700">{category}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7333rem] font-semibold text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.map((doc) => (
                    <div key={doc.key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                      <FileText className="h-5 w-5 shrink-0 text-brand-600" strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{doc.name}</p>
                        {doc.note ? (
                          <p className="truncate text-xs text-slate-500">{doc.note}</p>
                        ) : doc.size ? (
                          <p className="text-[0.7333rem] text-slate-400">{fmtSize(doc.size)}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-brand-600"
                          title="View in new tab"
                          aria-label={`View ${doc.name}`}
                        >
                          <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                        <a
                          href={`/api/uploads/view?key=${encodeURIComponent(doc.key)}&download=1&name=${encodeURIComponent(doc.name)}`}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-brand-600"
                          title="Download"
                          aria-label={`Download ${doc.name}`}
                        >
                          <Download className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
