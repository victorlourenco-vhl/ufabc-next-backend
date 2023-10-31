/**
 * mongo-tenant - Multi-tenancy for mongoose on document level.
 *
 * @copyright   Copyright (c) 2016-2017, craftup
 * @copyright   Copyright (c) 2022, dvprrsh
 * @copyright   Copyright (c) 2023, Joabesv
 * @license     https://github.com/ufabc-next/ufabc-next-backend/blob/main/LICENSE MIT
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearDatabase, connect, createTestModel } from './utils.js';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await clearDatabase();
});

describe('Opt-Out', () => {
  it('accessor method should deliver default mongoose model when mongoTenant is disabled.', () => {
    const Model = createTestModel({}, { mongoTenant: { enabled: false } });
    expect(typeof Model.byTenant).toBe('function');
    expect(Model.byTenant(1).getTenant).toBeUndefined();
  });
});
