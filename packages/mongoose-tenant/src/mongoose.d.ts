/// <reference types="mongoose" />
import type { ScopedFields } from './lib/types.js';
import type { MongooseTenant } from './lib/tenant.js';

declare module 'mongoose' {
  interface Model extends Partial<ScopedFields<T>> {
    mongoTenant?: MongooseTenant<Schema<T>, {}>;
  }

  interface IndexOptions {
    /**
     * For mongoose-tenant, disables compound unique key with the tenant field for this index
     */
    preserveUniqueKey?: boolean;
  }

  interface Document<T = any, TQueryHelpers = any, DocType = any> {
    constructor: Model<DocType, TQueryHelpers>;
  }
}
