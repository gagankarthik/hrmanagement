import 'server-only';
import { BaseRepository } from '@/shared/server/db/base-repository';
import { KEY_PREFIX } from '@/shared/server/db/keys';
import type { Employee } from '@/types/employee';

/**
 * Employee data access. Unlike the partner entities, employees are listed via a
 * table scan filtered to `EMP#` keys (they have no single collection partition —
 * the GSI partitions them per employment type, `TYPE#<type>`).
 */
export const employeeRepository = new BaseRepository<Employee>({
  prefix: KEY_PREFIX.employee,
  list: { mode: 'scan', pkPrefix: `${KEY_PREFIX.employee}#` },
  decorate: (e) => ({ GSI1PK: `TYPE#${e.type}`, GSI1SK: `${KEY_PREFIX.employee}#${e.id}` }),
});
