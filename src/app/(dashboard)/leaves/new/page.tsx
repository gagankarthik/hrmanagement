'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import { LeaveForm } from '@/components/dashboard/LeaveForm';

export default function NewLeavePage() {
  return (
    <FormPageShell
      icon={CalendarDays}
      eyebrow="Time & Leave"
      title="Apply for leave"
      description="Submit a new leave request"
      tone="brand"
      backHref="/leaves"
      backLabel="Back to Leaves"
    >
      <LeaveForm mode="create" />
    </FormPageShell>
  );
}
