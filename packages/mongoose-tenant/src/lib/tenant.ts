/**
 * mongo-tenant - Multi-tenancy for mongoose on document level.
 *
 * @copyright   Copyright (c) 2016-2017, craftup
 * @copyright   Copyright (c) 2022, dvprrsh
 * @copyright   Copyright (c) 2023, Joabesv
 * @license     https://github.com/ufabc-next/ufabc-next-backend/blob/main/LICENSE MIT
 */

import { createScopedModel } from './create-scoped-model.js';
import type {
  AnyObject,
  Connection,
  HydratedDocument,
  IndexDefinition,
  Model,
  MongooseDocumentMiddleware,
  MongooseQueryMiddleware,
  Schema,
} from 'mongoose';
import type { MongooseTenantOptions, ScopedModel } from './types.js';

/**
 * MongooseTenant is a class aimed for use in mongoose schema plugin scope.
 * It adds support for multi-tenancy on document level (adding a tenant reference field and include this in unique indexes).
 * Furthermore it xprovides an API for scoped models.
 */
export class MongooseTenant<
  TenantSchema extends Schema,
  TenantOpts extends MongooseTenantOptions,
> {
  public schema: TenantSchema;
  private options: Required<MongooseTenantOptions>;
  private _modelCache: Record<string, Record<string, ScopedModel<unknown>>>;

  /**
   * Create a new mongo tenant from a given schema.
   *
   * @param options - the configuration options.
   */
  constructor(schema: TenantSchema, options: TenantOpts) {
    this._modelCache = {};
    this.schema = schema;
    this.options = {
      enabled: true,
      tenantIdKey: 'tenant',
      tenantIdType: String,
      accessorMethod: 'byTenant',
      requireTenantId: false,
      ...options,
    };
  }

  /**
   * Apply the mongo tenant plugin to the given schema.
   */
  apply(): void {
    this.extendSchema().compoundIndexes().injectApi().installMiddleWare();
  }

  /**
   * Returns the boolean flag whether the mongo tenant is enabled.
   */
  isEnabled() {
    return this.options.enabled;
  }

  /**
   * Return the name of the tenant id field. Defaults to **tenantId**.
   */
  getTenantIdKey() {
    return this.options.tenantIdKey;
  }

  /**
   * Return the type of the tenant id field. Defaults to **String**.
   */
  getTenantIdType() {
    return this.options.tenantIdType;
  }

  /**
   * Check if tenant id is a required field.
   */
  isTenantIdRequired() {
    return this.options.requireTenantId;
  }

  /**
   * Checks if instance is compatible to other plugin instance
   *
   * For population of referenced models it's necessary to detect if the tenant
   * plugin installed in these models is compatible to the plugin of the host
   * model. If they are compatible they are one the same "level".
   *
   * @param {MongooseTenant} plugin
   */
  isCompatibleTo<
    T extends MongooseTenant<Schema<any>, Record<string, unknown>>,
  >(plugin?: T): boolean {
    return Boolean(
      plugin &&
        typeof plugin.getTenantIdKey === 'function' &&
        this.getTenantIdKey() === plugin.getTenantIdKey(),
    );
  }

  /**
   * Inject tenantId field into schema definition.
   */
  extendSchema(): this {
    const tenantKey = this.getTenantIdKey();

    if (!this.isEnabled() || tenantKey === '_id') {
      return this;
    }

    const tenant = {
      [tenantKey]: {
        index: true,
        type: this.getTenantIdType(),
        required: this.isTenantIdRequired(),
      },
    };

    this.schema.add(tenant);

    return this;
  }

  /**
   * Consider the tenant id field in all unique indexes (schema- and field level).
   * Take the optional **preserveUniqueKey** option into account for opting out the default behavior.
   */
  compoundIndexes(): this {
    if (!this.isEnabled()) {
      return this;
    }
    const schemaIndexes = this.schema.indexes();
    // apply tenancy awareness to schema level unique indexes

    schemaIndexes.forEach((idx) => {
      // skip if `preserveUniqueKey` of the index is set to true
      const isUniqueKeyPreserved = !idx[1].unique || idx[1].preserveUniqueKey;
      if (isUniqueKeyPreserved) {
        return;
      }

      const tenantAwareIndex: IndexDefinition = {
        [this.getTenantIdKey()]: 1,
      };

      for (const indexedField in idx[0]) {
        tenantAwareIndex[indexedField] = idx[0][indexedField];
      }

      idx[0] = tenantAwareIndex;
    });

    // apply tenancy awareness to field level unique indexes
    this.schema.eachPath((key, path) => {
      const isUniqueKeyPreserved =
        !path.options.unique || path.options.preserveUniqueKey;
      if (isUniqueKeyPreserved) {
        return;
      }
      // remove previous index
      (path as AnyObject)._index = null;
      path.options.unique = undefined;

      // create a new one that includes the tenant id field
      this.schema.index(
        {
          [this.getTenantIdKey()]: 1,
          [key]: 1,
        },
        { ...path.options, unique: true },
      );
    });

    return this;
  }

  /**
   * Inject the user-space entry point for mongo tenant.
   * This method adds a static Model method to retrieve tenant scoped sub-classes.
   */
  injectApi(): this {
    const isEnabled = this.isEnabled();
    const modelCache = this._modelCache;
    const createTenantAwareModel = this.createTenantAwareModel.bind(this);

    this.schema.static('byTenant', function (tenantId: unknown) {
      const baseModel: Model<any> = this.base.model(this.modelName);

      if (!isEnabled) {
        return baseModel;
      }
      if (!modelCache[this.modelName]) {
        modelCache[this.modelName] = {};
      }

      const strTenantId = String(tenantId);
      const cachedModels = modelCache[this.modelName];
      // lookup scoped model in cache
      if (!cachedModels[strTenantId]) {
        // cache the scoped model
        // @ts-expect-error I dont know what to do here either
        cachedModels[strTenantId] = createTenantAwareModel(baseModel, tenantId);
      }

      return cachedModels[strTenantId];
    });

    Object.assign(this.schema.statics, {
      mongoTenant: this,
    });

    return this;
  }

  /**
   * Create a model class that is scoped to the given tenant.
   * So that all operations on this model prohibit leaving the tenant scope.
   *
   * @param BaseModel
   * @param tenantId
   */
  createTenantAwareModel<T extends Model<any>>(
    BaseModel: T,
    tenantId: unknown,
  ) {
    const tenantIdKey = this.getTenantIdKey();
    const db = this.createTenantAwareDb(BaseModel.db, tenantId);

    const MongoTenantModel = createScopedModel(
      BaseModel,
      tenantId,
      tenantIdKey,
      db,
    );

    // inherit all static properties from the mongoose base model
    for (const staticProperty of Object.getOwnPropertyNames(BaseModel)) {
      if (
        Object.prototype.hasOwnProperty.call(
          MongoTenantModel,
          staticProperty,
        ) ||
        ['arguments', 'caller'].includes(staticProperty)
      ) {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(
        BaseModel,
        staticProperty,
      );
      if (descriptor) {
        Object.defineProperty(MongoTenantModel, staticProperty, descriptor);
      }
    }

    // create tenant models for discriminators if they exist
    if (BaseModel.discriminators) {
      MongoTenantModel.discriminators = {};

      for (const key in BaseModel.discriminators) {
        MongoTenantModel.discriminators[key] = this.createTenantAwareModel(
          BaseModel.discriminators[key],
          tenantId,
        );
      }
    }

    return MongoTenantModel;
  }

  /**
   * Create db connection scoped to a specific tenant
   *
   * @param {Connection} unawareDb
   * @param {*} tenantId
   */
  createTenantAwareDb(unawareDb: Connection, tenantId: unknown): Connection {
    const awareDb: Connection = Object.create(unawareDb);
    awareDb.model = (name: string) => {
      const unawareModel = unawareDb.model(name) as ScopedModel<unknown>;
      const otherPlugin = unawareModel.mongoTenant;
      if (!this.isCompatibleTo(otherPlugin)) {
        return unawareModel;
      }
      return unawareModel.byTenant(tenantId);
    };
    return awareDb;
  }

  /**
   * Install schema middleware to guard the tenant context of models.
   */
  installMiddleWare() {
    const tenantIdKey = this.getTenantIdKey();

    this.schema.pre(
      [
        'count',
        'countDocuments',
        'deleteMany',
        'deleteOne',
        'estimatedDocumentCount',
        'find',
        'findOne',
        'findOneAndDelete',
        'findOneAndRemove',
        'remove',
      ] as MongooseQueryMiddleware[],
      { document: false, query: true },

      function filterQueryMiddleware() {
        if (this.model.hasTenantContext) {
          this.setQuery({
            ...this.getQuery(),
            [tenantIdKey]: this.model.getTenant!(),
          });
        }
      },
    );

    this.schema.pre(
      [
        'findOneAndUpdate',
        'update',
        'updateMany',
        'updateOne',
      ] as MongooseQueryMiddleware[],
      { document: false, query: true },
      function updateQueryMiddleware() {
        if (this.model.hasTenantContext) {
          const tenantId = this.model.getTenant!();
          this.setQuery({ ...this.getQuery(), [tenantIdKey]: tenantId });
          const update = this.getUpdate();

          if (Object.hasOwnProperty.call(update, tenantIdKey)) {
            (update as { [key: typeof tenantIdKey]: unknown })[tenantIdKey] =
              undefined;
          }
          this.set(tenantIdKey, tenantId);
        }
      },
    );

    this.schema.pre(
      ['save', 'updateOne'] as MongooseDocumentMiddleware[],
      { document: true, query: false },
      function documentMiddleware(this: HydratedDocument<unknown>) {
        const model = this.constructor;
        if (model.hasTenantContext) {
          this.set(tenantIdKey, model.getTenant!());
        }
      },
    );

    return this;
  }
}

/**
 * The mongo tenant mongoose plugin.
 *
 * @param {mongoose.Schema} schema
 * @param {Object} options
 */
export function mongoTenantPlugin<T extends Schema>(
  schema: T,
  options: MongooseTenantOptions,
) {
  const mongoTenant = new MongooseTenant(schema, options);
  mongoTenant.apply();
}
