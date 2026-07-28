import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class.js";
import * as Prisma from "./internal/prismaNamespace.js";
export * as $Enums from './enums.js';
export * from "./enums.js";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more SuperAdmins
 * const superAdmins = await prisma.superAdmin.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model SuperAdmin
 *
 */
export type SuperAdmin = Prisma.SuperAdminModel;
/**
 * Model School
 *
 */
export type School = Prisma.SchoolModel;
/**
 * Model SchoolAdmin
 *
 */
export type SchoolAdmin = Prisma.SchoolAdminModel;
/**
 * Model Feature
 *
 */
export type Feature = Prisma.FeatureModel;
/**
 * Model SchoolFeature
 *
 */
export type SchoolFeature = Prisma.SchoolFeatureModel;
