import 'server-only';
import { bulkCreatePartners } from '@/lib/bulk-import/server';
import { ValidationError } from '@/shared/server/errors';
import { clientRepository } from './client.repository';
import type { Client, ClientFormData } from '../domain/client.types';

/** Client application service — orchestration between routes and the repository. */
export const clientService = {
  list(): Promise<Client[]> {
    return clientRepository.list();
  },
  get(id: string): Promise<Client> {
    return clientRepository.getOrThrow(id);
  },
  create(input: ClientFormData): Promise<Client> {
    return clientRepository.create(normalize(input));
  },
  update(id: string, input: Partial<ClientFormData>): Promise<Client> {
    return clientRepository.update(id, input);
  },
  remove(id: string): Promise<void> {
    return clientRepository.remove(id);
  },
  bulkImport(rows: unknown[]) {
    return bulkCreatePartners('CLIENT', rows as Record<string, unknown>[]);
  },
};

function normalize(input: ClientFormData): Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
  if (!input?.name?.trim()) throw new ValidationError('Client name is required');
  return {
    name: input.name,
    contactPerson: input.contactPerson || '',
    email: input.email || '',
    phone: input.phone || '',
    address: input.address || '',
    status: input.status || 'Active',
  };
}
