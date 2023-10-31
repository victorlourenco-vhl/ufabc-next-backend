/**
 * mongo-tenant - Multi-tenancy for mongoose on document level.
 *
 * @copyright   Copyright (c) 2016-2017, craftup
 * @copyright   Copyright (c) 2022, dvprrsh
 * @copyright   Copyright (c) 2023, Joabesv
 * @license     https://github.com/ufabc-next/ufabc-next-backend/blob/main/LICENSE MIT
 */
import { Schema } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mongoTenantPlugin } from '../src/plugin.js';
import { clearDatabase, connect } from './utils.js';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await clearDatabase();
});

describe('Plugin', () => {
  it('should have correct mongoose plugin signature.', () => {
    expect(typeof mongoTenantPlugin).toBe('function');
  });

  it('should register as mongoose schema plugin.', () => {
    const testSchema = new Schema({});
    expect(() => testSchema.plugin(mongoTenantPlugin)).not.toThrow();
  });
});
