import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: any;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: any;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: any;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: any;
export declare const ModelName: {
    readonly SuperAdmin: "SuperAdmin";
    readonly School: "School";
    readonly SchoolAdmin: "SchoolAdmin";
    readonly Feature: "Feature";
    readonly SchoolFeature: "SchoolFeature";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const SuperAdminScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly password: "password";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SuperAdminScalarFieldEnum = (typeof SuperAdminScalarFieldEnum)[keyof typeof SuperAdminScalarFieldEnum];
export declare const SchoolScalarFieldEnum: {
    readonly id: "id";
    readonly refNum: "refNum";
    readonly name: "name";
    readonly city: "city";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SchoolScalarFieldEnum = (typeof SchoolScalarFieldEnum)[keyof typeof SchoolScalarFieldEnum];
export declare const SchoolAdminScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly password: "password";
    readonly schoolId: "schoolId";
    readonly isActive: "isActive";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SchoolAdminScalarFieldEnum = (typeof SchoolAdminScalarFieldEnum)[keyof typeof SchoolAdminScalarFieldEnum];
export declare const FeatureScalarFieldEnum: {
    readonly id: "id";
    readonly code: "code";
    readonly name: "name";
    readonly createdAt: "createdAt";
};
export type FeatureScalarFieldEnum = (typeof FeatureScalarFieldEnum)[keyof typeof FeatureScalarFieldEnum];
export declare const SchoolFeatureScalarFieldEnum: {
    readonly id: "id";
    readonly schoolId: "schoolId";
    readonly featureId: "featureId";
    readonly isEnabled: "isEnabled";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type SchoolFeatureScalarFieldEnum = (typeof SchoolFeatureScalarFieldEnum)[keyof typeof SchoolFeatureScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const SuperAdminOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly password: "password";
};
export type SuperAdminOrderByRelevanceFieldEnum = (typeof SuperAdminOrderByRelevanceFieldEnum)[keyof typeof SuperAdminOrderByRelevanceFieldEnum];
export declare const SchoolOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly refNum: "refNum";
    readonly name: "name";
    readonly city: "city";
};
export type SchoolOrderByRelevanceFieldEnum = (typeof SchoolOrderByRelevanceFieldEnum)[keyof typeof SchoolOrderByRelevanceFieldEnum];
export declare const SchoolAdminOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly email: "email";
    readonly password: "password";
    readonly schoolId: "schoolId";
};
export type SchoolAdminOrderByRelevanceFieldEnum = (typeof SchoolAdminOrderByRelevanceFieldEnum)[keyof typeof SchoolAdminOrderByRelevanceFieldEnum];
export declare const FeatureOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly code: "code";
    readonly name: "name";
};
export type FeatureOrderByRelevanceFieldEnum = (typeof FeatureOrderByRelevanceFieldEnum)[keyof typeof FeatureOrderByRelevanceFieldEnum];
export declare const SchoolFeatureOrderByRelevanceFieldEnum: {
    readonly id: "id";
    readonly schoolId: "schoolId";
    readonly featureId: "featureId";
};
export type SchoolFeatureOrderByRelevanceFieldEnum = (typeof SchoolFeatureOrderByRelevanceFieldEnum)[keyof typeof SchoolFeatureOrderByRelevanceFieldEnum];
