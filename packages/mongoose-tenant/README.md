<p align="center">
  <a href="https://github.com/ufabc-next"><img src="https://raw.githubusercontent.com/ufabc-next/ufabc-next-web/master/public/assets/images/logo.png" height="90px"></a>
</p>
<h1 align="center">
  Mongoose Tenant
</h1>

<div align="center">

A document-based multi-tenancy plugin for [Mongoose](https://github.com/Automattic/mongoose).

[![npm (scoped)](https://img.shields.io/npm/v/@next/mongoose-tenant?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/@next/mongoose-tenant) [![npm](https://img.shields.io/npm/dm/@next/mongoose-tenant?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/@next/mongoose-tenant) ![GitHub](https://img.shields.io/github/license/ufabc-next/ufabc-next-backend?style=for-the-badge) [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ufabc-next/ufabc-next-backend/ci.yml?branch=main&logo=github&style=for-the-badge)](https://github.com/ufabc-next/ufabc-next-backend/packages/mongoose-tenant)

</div>


**Credits**

All credits go to the original creator of the [node-tenant-plugin](https://github.com/craftup/node-mongo-tenant)
[Alrik](https://github.com/craftup/node-mongo-tenant)

**Prelude**

There are 3 ways of implementing multi-tenancy in mongoDB:

- document-level (cheap and easy to administer but only secured by app logic)
- collection-level (not recommended, due to breaking mongoDB concepts)
- database-level (very flexible and secure but expensive)

**Contents**

- [About](#about)
- [Installation](#installation)
- [Usage](#usage)
  - [Indexes](#indexes)
  - [Scoped Models & Populate](#scoped-models--populate)
  - [Configuration](#configuration)

### About

Forked from [mongo-tenant](https://github.com/craftup/node-mongo-tenant), this version of the plugin has been refactored and is built with TypeScript for more recent Mongoose versions. It is also intended to be maintained for the foreseeable future.

Mongoose Tenant is a highly configurable plugin solving multi-tenancy problems on a document level.

It creates a tenant-reference field while also taking care of unique indexes. Furthermore, a model scoped to a tenant can be created with ease. These "scoped models" limit access solely to documents of the specified tenant.

### Installation

```shell
pnpm install @next/mongoose-tenant

```

### Usage

Register the plugin on the relevant mongoose schema.

```ts
import { Schema, model } from "mongoose";
import { mongooseTenant } from "@next/mongoose-tenant";

const MySchema = new Schema({});
MySchema.plugin(mongooseTenant);

const MyModel = model("MyModel", MySchema);
```

Retrieve the scoped model with the static `byTenant` method. This will return a new model subclass that has guards in place to prevent access to documents from other tenants.

```ts
const MyScopedModel = MyModel.byTenant("some-tenant-id");

new MyScopedModel().getTenant() === "some-tenant-id"; // true

// silently ignore other tenant scope
new MyScopedModel({
  tenantId: "some-other-tenant-id",
}).getTenant() === "some-tenant-id"; // true
```

You can check for tenant context of a model class or instance by checking the `hasTenantContext` property. If this is `truthy` you may want to retrieve the tenant, this can be done via the `getTenant()` method.

```ts
// When Mongoose Tenant is enabled on a schema, all scoped models
// and there instances provide the `hasTenantContext` flag
if (SomeModelClassOrInstance.hasTenantContext) {
  const tenantId = SomeModelClassOrInstance.getTenant();
  ...
}
```

#### Indexes

The Mongoose Tenant takes care of the tenant-reference field, so that you will be able to use your existing schema definitions and just plugin the Mongoose Tenant without changing a single line of the schema definition.

But under the hood the Mongoose Tenant creates an indexed field _(tenant by default)_ and includes this in all defined unique indexes. So, by default, all unique fields (and compound indexes) are unique for a single tenant id.

You may have use-cases where you want to maintain global uniqueness. To skip the automatic unique key extension of the plugin, for a specific index, you can set the `preserveUniqueKey` config option to `true`.

```ts
import { Schema } from 'mongoose'

const MySchema = new Schema({
  someField: {
    unique: true,
    preserveUniqueKey: true,
  },
  anotherField: String,
  yetAnotherField: String,
});

MySchema.index(
  {
    anotherField: 1,
    yetAnotherField: 1,
  },
  {
    unique: true,
    preserveUniqueKey: true,
  },
);
```

#### Scoped Models & Populate

Once a scoped model is created it will try to keep the context for other models created via it. Whenever it detects that a subsequent models tenant configuration is compatible to its own, it will return that model scoped to the same tenant context.

```ts
import { Schema, Types, model } from 'mongoose'

const AuthorSchema = new Schema({});
AuthorSchema.plugin(mongooseTenant);
const AuthorModel = model("author", AuthorSchema);

const BookSchema = new Schema({
  author: { type: Types.ObjectId, ref: "author" },
});
BookSchema.plugin(mongooseTenant);
const BookModel = model("book", BookSchema);

const ScopedBookModel = BookModel.byTenant("some-tenant-id");
ScopedBookModel.model("author"); // return author model scoped to "some-tenant-id"
ScopedBookModel.db.model("author"); // return author model scoped to "some-tenant-id"
```

#### Configuration

Mongoose Tenant works out of the box. All config options are optional. But, you have the ability to adjust the behaviour and api of the plugin to fit your needs.

```ts
const config = {
  /**
   * Whether the Mongoose Tenant plugin MAGIC is enabled. Default: true
   */
  enabled: false,

  /**
   * The name of the tenant id field. Default: tenant
   */
  tenantIdKey: "customer",

  /**
   * The type of the tenant id field. Default: String
   */
  tenantIdType: Number,

  /**
   * Enforce tenantId field to be set. Default: false
   */
  requireTenantId: true,
};

SomeSchema.plugin(mongooseTenant, config);
```
