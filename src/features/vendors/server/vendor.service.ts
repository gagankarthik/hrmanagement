import 'server-only';
import { bulkCreatePartners } from '@/lib/bulk-import/server';
import { ValidationError } from '@/shared/server/errors';
import { vendorRepository } from './vendor.repository';
import type { Vendor, VendorFormData } from '../domain/vendor.types';

export const vendorService = {
  list(): Promise<Vendor[]> {
    return vendorRepository.list();
  },
  get(id: string): Promise<Vendor> {
    return vendorRepository.getOrThrow(id);
  },
  create(input: VendorFormData): Promise<Vendor> {
    return vendorRepository.create(normalize(input));
  },
  update(id: string, input: Partial<VendorFormData>): Promise<Vendor> {
    return vendorRepository.update(id, input);
  },
  remove(id: string): Promise<void> {
    return vendorRepository.remove(id);
  },
  bulkImport(rows: unknown[]) {
    return bulkCreatePartners('VENDOR', rows as Record<string, unknown>[]);
  },
};

function normalize(input: VendorFormData): Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> {
  if (!input?.name?.trim()) throw new ValidationError('Vendor name is required');
  return {
    name: input.name,
    contactPerson: input.contactPerson || '',
    email: input.email || '',
    phone: input.phone || '',
    address: input.address || '',
    status: input.status || 'Active',
  };
}
