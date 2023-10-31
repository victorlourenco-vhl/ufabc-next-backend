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

describe.only('require-tenant-id', () => {
  clearDatabase();

  it('should allow a nullable tenant id by default.', async () => {
    const TestModel = createTestModel({});
    const doc = await TestModel.byTenant(null).create({});
    expect(doc.getTenant()).toBeFalsy();
  });

  it('should allow an undefined tenant id by default.', async () => {
    const TestModel = createTestModel({});
    const doc = await TestModel.byTenant(undefined).create({});
    expect(doc.getTenant()).toBeFalsy();
  });

  it('should not allow a nullable tenant id when tenant id is required.', async () => {
    const TestModel = createTestModel(
      {},
      { mongoTenant: { requireTenantId: true } },
    );
    await expect(TestModel.byTenant(null).create({})).rejects.toThrow();
  });

  it('should not allow an undefined tenant id when tenant id is required.', async () => {
    const TestModel = createTestModel(
      {},
      { mongoTenant: { requireTenantId: true } },
    );
    await expect(TestModel.byTenant(undefined).create({})).rejects.toThrow();
  });
});
