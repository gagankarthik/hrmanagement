'use client';

import { use } from 'react';
import { Clock } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import TimesheetForm from '@/components/dashboard/TimesheetForm';
import { useTimesheets } from '@/context/TimesheetContext';

export default function EditTimesheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTimesheetById, isLoading } = useTimesheets();
  const timesheet = getTimesheetById(id);

  return (
    <FormPageShell
      icon={Clock}
      eyebrow="Billing"
      title="Edit timesheet"
      description="Update logged hours, rates, or status"
      tone="brand"
      backHref="/dashboard/timesheets"
      backLabel="Back to Timesheets"
    >
      {timesheet ? (
        <TimesheetForm mode="edit" timesheet={timesheet} />
      ) : (
        <div className="surface p-10 text-center text-sm text-slate-500">
          {isLoading ? 'Loading timesheet…' : 'Timesheet not found.'}
        </div>
      )}
    </FormPageShell>
  );
}
