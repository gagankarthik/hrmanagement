import 'server-only';
import { bulkCreatePartners } from '@/lib/bulk-import/server';
import { ValidationError } from '@/shared/server/errors';
import { endClientRepository } from './endclient.repository';
import type { EndClient, EndClientFormData } from '../domain/endclient.types';

export const endClientService = {
  list(): Promise<EndClient[]> {
    return endClientRepository.list();
  },
  get(id: string): Promise<EndClient> {
    return endClientRepository.getOrThrow(id);
  },
  create(input: EndClientFormData): Promise<EndClient> {
    return endClientRepository.create(normalize(input));
  },
  update(id: string, input: Partial<EndClientFormData>): Promise<EndClient> {
    return endClientRepository.update(id, input);
  },
  remove(id: string): Promise<void> {
    return endClientRepository.remove(id);
  },
  bulkImport(rows: unknown[]) {
    return bulkCreatePartners('ENDCLIENT', rows as Record<string, unknown>[]);
  },
};

function normalize(input: EndClientFormData): Omit<EndClient, 'id' | 'createdAt' | 'updatedAt'> {
  if (!input?.name?.trim()) throw new ValidationError('End client name is required');
  return {
    name: input.name,
    contactPerson: input.contactPerson || '',
    email: input.email || '',
    phone: input.phone || '',
    address: input.address || '',
    status: input.status || 'Active',
  };
}
