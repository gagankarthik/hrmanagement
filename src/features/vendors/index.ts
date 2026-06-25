/** Public surface of the Vendors feature module (server code not re-exported). */
export type { Vendor, VendorFormData, VendorWithCount } from './domain/vendor.types';
export { VendorProvider, useVendors } from './state/vendor.context';
export { vendorApi } from './api/vendor.client';
