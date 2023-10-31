/**
 * mongo-tenant - Multi-tenancy for mongoose on document level.
 *
 * @copyright   Copyright (c) 2016-2017, craftup
 * @copyright   Copyright (c) 2022, dvprrsh
 * @copyright   Copyright (c) 2023, Joabesv
 * @license     https://github.com/ufabc-next/ufabc-next-backend/blob/main/LICENSE MIT
 */

import assert from 'node:assert/strict';
import { Schema } from 'mongoose';
import { describe, it } from 'vitest';
import { MongooseTenant } from '../src/lib/tenant.js';

describe('Plugin Options', () => {
  it('should be enabled by default.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}));
    assert(mongoTenant.isEnabled() === true);
  });

  it('should be capable of being disabled.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}), { enabled: false });
    assert(mongoTenant.isEnabled() === false);
  });

  it('should have a default tenant id key of `tenant`.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}));
    assert.strictEqual(mongoTenant.getTenantIdKey(), 'tenant');
  });

  it('should be capable of setting a custom tenant id key.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}), {
      tenantIdKey: 'tenant_id',
    });
    assert.strictEqual(mongoTenant.getTenantIdKey(), 'tenant_id');
  });

  it('should have a default tenant id field type of `String`.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}));
    assert.strictEqual(mongoTenant.getTenantIdType(), String);
  });

  it('should be capable of setting a custom tenant id field type.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}), {
      tenantIdType: Number,
    });
    assert.strictEqual(mongoTenant.getTenantIdType(), Number);
  });

  it('should not require tenant id field by default.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}));
    assert.strictEqual(mongoTenant.isTenantIdRequired(), false);
  });

  it('should be possible to set tenant id field required.', () => {
    const mongoTenant = new MongooseTenant(new Schema({}), {
      requireTenantId: true,
    });
    assert.strictEqual(mongoTenant.isTenantIdRequired(), true);
  });
});
