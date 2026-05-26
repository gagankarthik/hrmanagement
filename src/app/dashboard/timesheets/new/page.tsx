'use client';

import { Clock } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import TimesheetForm from '@/components/dashboard/TimesheetForm';

export default function NewTimesheetPage() {
  return (
    <FormPageShell
      icon={Clock}
      eyebrow="Billing"
      title="New timesheet"
      description="Log billable hours for a worker and period"
      tone="brand"
      backHref="/dashboard/timesheets"
      backLabel="Back to Timesheets"
    >
      <TimesheetForm mode="create" />
    </FormPageShell>
  );
}
