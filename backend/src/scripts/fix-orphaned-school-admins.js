"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Find and optionally remove SchoolAdmin rows whose school no longer exists.
 * Fixes: "Inconsistent query result: Field `school` is required to return data, got `null`"
 *
 * Run:
 *   npx tsx src/scripts/fix-orphaned-school-admins.ts        # list only
 *   npx tsx src/scripts/fix-orphaned-school-admins.ts --fix  # list and delete
 */
const client_1 = require("@prisma/client");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new client_1.PrismaClient();
async function main() {
    const doFix = process.argv.includes('--fix');
    const orphans = await prisma.$queryRaw `
    SELECT sa.id, sa.name, sa.email, sa.schoolId, sa.createdAt
    FROM school_admins sa
    LEFT JOIN schools s ON s.id = sa.schoolId
    WHERE s.id IS NULL
  `;
    if (orphans.length === 0) {
        console.log('No orphaned SchoolAdmin records found. Prisma Studio should work.');
        return;
    }
    console.log(`Found ${orphans.length} SchoolAdmin record(s) with missing school:\n`);
    orphans.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.email} (id: ${r.id}, schoolId: ${r.schoolId})`);
    });
    if (!doFix) {
        console.log('\nTo remove these records, run: npx tsx src/scripts/fix-orphaned-school-admins.ts --fix');
        return;
    }
    const deleted = await prisma.$executeRaw `
    DELETE sa FROM school_admins sa
    LEFT JOIN schools s ON s.id = sa.schoolId
    WHERE s.id IS NULL
  `;
    console.log(`\nDeleted ${deleted} orphaned record(s). Re-open SchoolAdmin in Prisma Studio.`);
}
main()
    .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=fix-orphaned-school-admins.js.map