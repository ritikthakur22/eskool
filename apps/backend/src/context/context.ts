import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
