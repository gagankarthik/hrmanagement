'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatabaseBackup, Download, HardDriveDownload, Archive, Clock, Loader2,
  ShieldAlert, ShieldCheck, FileJson,
} from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageContainer } from '@/components/dashboard/page-container';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { useToast } from '@/components/ui/toast';
import { useAccess } from '@/hooks/useAccess';
import { friendlyError } from '@/lib/errors';
import { BRAND } from '@/config/brand';

interface BackupObject {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
}

/** Human-readable file size. */
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${val >= 100 || i === 0 ? Math.round(val) : val.toFixed(1)} ${units[i]}`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : format(d, "MMM d, yyyy · h:mm a");
}

export default function BackupPage() {
  const toast = useToast();
  const { admin } = useAccess();
  const [backups, setBackups] = useState<BackupObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/backups');
      const result = await res.json();
      if (result.success) setBackups(result.data as BackupObject[]);
      else {
        setError(result.error || 'Could not load backups.');
        setBackups([]);
      }
    } catch {
      setError('Could not load backups. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) fetchBackups();
    else setIsLoading(false);
  }, [admin, fetchBackups]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Export failed');
      toast.success(
        'Backup created',
        `${result.data.name} · ${result.data.count.toLocaleString()} records saved to S3.`,
      );
      fetchBackups();
    } catch (err) {
      toast.error('Could not export data', friendlyError(err));
    } finally {
      setExporting(false);
    }
  };

  const totalSize = useMemo(() => backups.reduce((s, b) => s + b.size, 0), [backups]);
  const latest = backups[0]; // API returns newest first

  const columns: DataTableColumn<BackupObject>[] = [
    {
      id: 'name',
      header: 'Backup file',
      sortValue: (b) => b.name,
      cell: (b) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <FileJson className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{b.name}</p>
            <p className="truncate text-xs text-slate-400">DynamoDB snapshot (JSON)</p>
          </div>
        </div>
      ),
    },
    {
      id: 'size',
      header: 'Size',
      align: 'right',
      sortValue: (b) => b.size,
      cell: (b) => <span className="tnum text-slate-600">{formatBytes(b.size)}</span>,
    },
    {
      id: 'created',
      header: 'Created',
      sortValue: (b) => b.lastModified ?? '',
      cell: (b) => <span className="text-slate-600">{formatWhen(b.lastModified)}</span>,
    },
  ];

  // ── Admin-only surface ──────────────────────────────────────────────────
  if (!admin) {
    return (
      <PageContainer>
        <div className="surface flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-xl font-bold text-brand-900">Admins only</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            Data backups are restricted to administrators. If you need a backup, ask an admin on your team.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        icon={DatabaseBackup}
        eyebrow="Administration"
        title="Backups"
        description={`Export a full snapshot of the ${BRAND.name} database to secure S3 storage and download any previous backup. Backups are read-only once created — they can be downloaded but never edited or deleted here.`}
        tone="brand"
        actions={
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Export data to S3'}
          </button>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Total backups" value={backups.length} icon={Archive} tone="brand" hint="in S3 storage" />
        <StatCard
          label="Latest backup"
          value={latest ? formatWhen(latest.lastModified).split(' · ')[0] : '—'}
          icon={Clock}
          tone="emerald"
          hint={latest ? formatWhen(latest.lastModified).split(' · ')[1] : 'none yet'}
        />
        <StatCard label="Storage used" value={formatBytes(totalSize)} icon={ShieldCheck} tone="sky" hint="across all backups" />
      </StatGrid>

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900">All backups</h2>
            <p className="text-xs text-slate-400">Newest first · download only</p>
          </div>
        </div>

        <DataTable<BackupObject>
          columns={columns}
          data={backups}
          getRowId={(b) => b.key}
          caption="Database backups stored in S3"
          tableId="backups"
          isLoading={isLoading}
          error={error}
          onRetry={fetchBackups}
          minWidth="min-w-[640px]"
          initialSort={{ columnId: 'created', dir: 'desc' }}
          rowActions={(b) => (
            <a
              href={`/api/admin/backups/download?key=${encodeURIComponent(b.key)}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              // Native download — the endpoint 302s to a presigned S3 URL with an
              // attachment disposition, so no new tab is needed.
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} /> Download
            </a>
          )}
          empty={{
            icon: DatabaseBackup,
            tone: 'default',
            title: 'No backups yet',
            description: 'Export your first snapshot to save a full copy of the database to S3.',
            action: (
              <button onClick={handleExport} disabled={exporting} className="btn-primary">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveDownload className="h-4 w-4" />}
                Export data to S3
              </button>
            ),
          }}
        />

        {!isLoading && !error && backups.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              {backups.length} backup{backups.length !== 1 ? 's' : ''} · {formatBytes(totalSize)} total
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
