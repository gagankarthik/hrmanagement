import 'server-only';
import { bulkCreatePartners } from '@/lib/bulk-import/server';
import { ValidationError } from '@/shared/server/errors';
import { subcontractorRepository } from './subcontractor.repository';
import type { Subcontractor, SubcontractorFormData } from '../domain/subcontractor.types';

/**
 * Subcontractor application service — the orchestration layer between the API
 * routes (controllers) and the repository (data access). Holds use-case logic
 * such as input validation and bulk import, keeping routes thin.
 */
export const subcontractorService = {
  list(): Promise<Subcontractor[]> {
    return subcontractorRepository.list();
  },

  get(id: string): Promise<Subcontractor> {
    return subcontractorRepository.getOrThrow(id);
  },

  create(input: SubcontractorFormData): Promise<Subcontractor> {
    const data = normalize(input);
    return subcontractorRepository.create(data);
  },

  update(id: string, input: Partial<SubcontractorFormData>): Promise<Subcontractor> {
    return subcontractorRepository.update(id, input);
  },

  remove(id: string): Promise<void> {
    return subcontractorRepository.remove(id);
  },

  bulkImport(rows: unknown[]) {
    return bulkCreatePartners('SUBCON', rows as Record<string, unknown>[]);
  },
};

/** Apply defaults + required-field validation, mirroring the previous POST handler. */
function normalize(input: SubcontractorFormData): Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt'> {
  if (!input?.name?.trim()) {
    throw new ValidationError('Subcontractor name is required');
  }
  return {
    name: input.name,
    contactPerson: input.contactPerson || '',
    email: input.email || '',
    phone: input.phone || '',
    address: input.address || '',
    status: input.status || 'Active',
    coiEffectiveDate: input.coiEffectiveDate || '',
    coiExpiryDate: input.coiExpiryDate || '',
  };
}
