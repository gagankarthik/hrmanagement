/**
 * Public surface of the Clients feature module. Server code (repository,
 * service) is intentionally not re-exported so it can't reach a client bundle.
 */
export type { Client, ClientFormData, ClientWithCount } from './domain/client.types';
export { ClientProvider, useClients } from './state/client.context';
export { clientApi } from './api/client.client';
