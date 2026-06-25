/** Public surface of the End Clients feature module (server code not re-exported). */
export type { EndClient, EndClientFormData, EndClientWithCount } from './domain/endclient.types';
export { EndClientProvider, useEndClients } from './state/endclient.context';
export { endClientApi } from './api/endclient.client';
