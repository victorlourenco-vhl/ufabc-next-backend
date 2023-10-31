import type {
  Aggregate,
  AggregateOptions,
  AnyKeys,
  AnyObject,
  Callback,
  Connection,
  HydratedDocument,
  InsertManyOptions,
  InsertManyResult,
  Model,
  PipelineStage,
} from 'mongoose';

import type { ScopedModel } from './types.js';

type AggregateParams<AggregateResult> = [
  pipeline?: PipelineStage[],
  options?: AggregateOptions,
  callback?: Callback<AggregateResult[]>,
];

type GenericDocument<Doc> =
  | AnyKeys<Doc>
  | AnyObject
  | Array<AnyKeys<Doc> | AnyObject>;

type TenantInsertManyOptions<Doc, TMethodsAndOverrides, TVirtuals> =
  | InsertManyOptions
  | Callback<
      | Array<HydratedDocument<Doc, TMethodsAndOverrides, TVirtuals>>
      | InsertManyResult<Doc>
    >;

export function createScopedModel<
  TBase extends Model<T, TQueryHelpers, TMethodsAndOverrides, TVirtuals>,
  T = unknown,
  TQueryHelpers = Record<string, unknown>,
  TMethodsAndOverrides = Record<string, unknown>,
  TVirtuals = Record<string, unknown>,
>(BaseModel: TBase, tenantId: unknown, tenantKey: string, db: Connection) {
  // Define _ScopedModel as a class extending BaseModel
  return class _ScopedModel extends (BaseModel as Model<
    any,
    TQueryHelpers,
    TMethodsAndOverrides,
    TVirtuals
  >) {
    public static readonly db = db;
    public static readonly hasTenantContext = true as const;

    public static getTenant() {
      return tenantId as T[keyof T];
    }

    constructor(...args: unknown[]) {
      super(...args);
      this.db = _ScopedModel.db;
      this.hasTenantContext = _ScopedModel.hasTenantContext;
      this.getTenant = _ScopedModel.getTenant;
    }

    static aggregate<AggregateResult>(
      ...args: AggregateParams<AggregateResult>
    ): Aggregate<AggregateResult[]> {
      const [pipeline] = args;
      const tenantId = this.getTenant();

      if (!pipeline) {
        args[0] = [{ $match: { [tenantKey]: tenantId } }];
      } else if ((pipeline[0] as PipelineStage.Match).$match) {
        (pipeline[0] as PipelineStage.Match).$match[tenantKey] = tenantId;
      } else {
        pipeline.unshift({ $match: { [tenantKey]: tenantId } });
      }

      return super.aggregate.apply(this, args as any) as Aggregate<
        AggregateResult[]
      >;
    }

    static async insertMany(
      docs: GenericDocument<T>,
      options?: TenantInsertManyOptions<T, TQueryHelpers, TVirtuals>,
    ) {
      const tenantId = this.getTenant();
      // Model.insertMany supports a single document as a parameter
      if (!Array.isArray(docs)) {
        docs[tenantKey as keyof typeof docs] = tenantId;
      } else {
        docs.forEach((doc) => {
          doc[tenantKey as keyof typeof doc] = tenantId;
        });
      }

      // Ensure the returned docs are instances of the scoped multi-tenant model

      const res = await super.insertMany(docs, options as InsertManyOptions);
      return res.map((doc) => new this(doc));
    }
  } as ScopedModel<T, TQueryHelpers, TMethodsAndOverrides, TVirtuals>;
}
