/**
 * Public surface of the Subcontractors feature module.
 *
 * Other features and app routes should import from here, not from internal
 * paths. Server-only code (repository, service) is intentionally NOT re-exported
 * so it can never be pulled into a client bundle.
 */

// Domain
export type {
  Subcontractor,
  SubcontractorFormData,
  SubcontractorWithCount,
} from './domain/subcontractor.types';
export { coiStatus, COI_WARN_DAYS, type CoiState, type CoiStatus } from './domain/coi';

// State (client)
export { SubcontractorProvider, useSubcontractors } from './state/subcontractor.context';

// API (client)
export { subcontractorApi } from './api/subcontractor.client';

// UI
export { default as SubcontractorForm } from './ui/SubcontractorForm';
