/**
 * mongo-tenant - Multi-tenancy for mongoose on document level.
 *
 * @copyright   Copyright (c) 2016-2017, craftup
 * @copyright   Copyright (c) 2022, dvprrsh
 * @copyright   Copyright (c) 2023, Joabesv
 * @license     https://github.com/ufabc-next/ufabc-next-backend/blob/main/LICENSE MIT
 */

import assert from 'node:assert/strict';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { clearDatabase, connect, createTestModel } from './utils.js';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await clearDatabase();
});

describe('Indexes', () => {
  it('should consider the tenant id field in schema level unique indexes.', () => {
    const indexesFound: Record<string, boolean> = {};
    const Model = createTestModel(
      { field1: String, field2: Number },
      {
        applyOnSchema: (schema) => {
          schema.index({ field1: 'asc' }, { unique: true, name: 'index1' });
          schema.index({ field2: 'asc' }, { name: 'index2' });
          schema.index(
            { field1: 'asc', field2: 'asc' },
            { unique: true, name: 'index3' },
          );
        },
      },
    );

    for (const [def, options] of Model.schema.indexes()) {
      if (!options?.name) {
        continue;
      }

      indexesFound[options.name] = true;
      switch (options.name) {
        case 'index1':
          expect(def).toHaveProperty('tenant');
          expect(def).toHaveProperty('field1');
          break;
        case 'index2':
          expect(def).not.toHaveProperty('tenant');
          expect(def).toHaveProperty('field2');
          break;
        case 'index3':
          expect(def).toHaveProperty('tenant');
          expect(def).toHaveProperty('field1');
          expect(def).toHaveProperty('field2');
          break;
      }
    }

    assert(indexesFound.index1);
    assert(indexesFound.index2);
    assert(indexesFound.index3);
  });

  it('should consider the tenant id field in field level unique indexes.', () => {
    const indexesFound: Record<string, boolean> = {};
    const Model = createTestModel({
      field1: {
        type: String,
        unique: true,
      },
      field2: {
        type: Number,
        index: true,
      },
    });

    for (const [def] of Model.schema.indexes()) {
      if ('field1' in def) {
        indexesFound.field1 = true;
        expect(def).toHaveProperty('tenant');
        expect(def).not.toHaveProperty('field2');
      }

      if ('field2' in def) {
        indexesFound.field2 = true;
        expect(def).not.toHaveProperty('tenant');
        expect(def).not.toHaveProperty('field1');
      }
    }

    assert(indexesFound.field1);
    assert(indexesFound.field2);
  });

  it('should consider the sparse property in field level unique indexes.', () => {
    const indexesFound: Record<string, boolean> = {};
    const Model = createTestModel({
      field1: {
        type: String,
        unique: true,
        sparse: true,
      },
      field2: {
        type: Number,
        index: true,
      },
    });

    for (const [def, options] of Model.schema.indexes()) {
      if ('field1' in def) {
        indexesFound.field1 = true;
        expect(options).toHaveProperty('sparse');
        expect(def).toHaveProperty('tenant');
        expect(def).not.toHaveProperty('field2');
      }

      if ('field2' in def) {
        indexesFound.field2 = true;
        expect(def).not.toHaveProperty('tenant');
        expect(def).not.toHaveProperty('field1');
      }
    }

    assert(indexesFound.field1);
    assert(indexesFound.field2);
  });

  it('should consider the partialFilterExpression property in field level unique indexes.', () => {
    const indexesFound: Record<string, boolean> = {};
    const Model = createTestModel({
      field1: {
        type: String,
        unique: true,
        partialFilterExpression: { field2: { $exists: true } },
      },
      field2: {
        type: Number,
        index: true,
      },
    });

    for (const [def, options] of Model.schema.indexes()) {
      if ('field1' in def) {
        indexesFound.field1 = true;
        expect(options).toHaveProperty('partialFilterExpression');
        expect(def).toHaveProperty('tenant');
        expect(def).not.toHaveProperty('field2');
      }

      if ('field2' in def) {
        indexesFound.field2 = true;
        expect(def).not.toHaveProperty('tenant');
        expect(def).not.toHaveProperty('field1');
      }
    }

    assert(indexesFound.field1);
    assert(indexesFound.field2);
  });
});
