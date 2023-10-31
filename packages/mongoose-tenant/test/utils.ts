/**
 * mongo-tenant - Multi-tenancy for mongoose on document level.
 *
 * @copyright   Copyright (c) 2016-2017, craftup
 * @copyright   Copyright (c) 2022, dvprrsh
 * @copyright   Copyright (c) 2023, Joabesv
 * @license     https://github.com/ufabc-next/ufabc-next-backend/blob/main/LICENSE MIT
 */

import mongoose, {
  type Model,
  Schema,
  type SchemaDefinition,
  type SchemaOptions,
} from 'mongoose';
import { mongoTenantPlugin } from '../src/plugin.js';
import type { MongooseTenantOptions, ScopedModel } from '../src/lib/types.js';

mongoose.set('returnOriginal', false);

let testModelUnifier = 0;

export function createTestModel<T extends boolean = true>(
  schemaDefinition: SchemaDefinition,
  options?: {
    applyOnSchema?(schema: Schema): void;
    withPlugin?: T;
    mongoTenant?: MongooseTenantOptions;
    schemaOptions?: SchemaOptions;
  },
) {
  options = { withPlugin: true as T, ...options };

  const schema = new Schema(schemaDefinition, options.schemaOptions);

  if (typeof options.applyOnSchema === 'function') {
    options.applyOnSchema(schema);
  }

  if (options.withPlugin) {
    schema.plugin(mongoTenantPlugin, options.mongoTenant);
  }

  return mongoose.model(
    `mongoTenantTestModel${++testModelUnifier}`,
    schema,
  ) as T extends true ? ScopedModel<unknown> : Model<unknown>;
}

export async function connect() {
  await mongoose.connect('mongodb://localhost:27017/mongo-tenant');
}

export async function clearDatabase() {
  for (const collection in mongoose.connection.collections) {
    await mongoose.connection.dropCollection(collection);
  }
  await mongoose.disconnect();
}
