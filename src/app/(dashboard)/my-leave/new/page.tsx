'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { FormPageShell } from '@/components/dashboard/FormPageShell';
import { LeaveForm } from '@/components/dashboard/LeaveForm';
import { useSelfEmployee } from '@/hooks/useSelfEmployee';
import { useAuth } from '@/context/AuthContext';

export default function NewMyLeavePage() {
  const { user } = useAuth();
  const self = useSelfEmployee();

  const email = user?.email || '';
  const name = self?.name || user?.name || email.split('@')[0] || 'You';

  return (
    <FormPageShell
      icon={CalendarDays}
      eyebrow="Time & Leave"
      title="Apply for leave"
      description="Submit a new leave request"
      tone="brand"
      backHref="/my-leave"
      backLabel="Back to My Leave"
    >
      <LeaveForm
        mode="create"
        selfApply={{ employeeId: self?.id, name, email }}
        redirectTo="/my-leave"
      />
    </FormPageShell>
  );
}
