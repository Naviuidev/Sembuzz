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
 * List all Super Admin accounts (id, name, email).
 * Use this to see which email to use for login. Passwords are hashed and cannot be shown.
 * Run: npm run list:super-admins
 */
const client_1 = require("@prisma/client");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new client_1.PrismaClient();
async function main() {
    const admins = await prisma.superAdmin.findMany({
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    if (admins.length === 0) {
        console.log('No Super Admin accounts found.');
        console.log('Create one with: npm run seed:super-admin');
        return;
    }
    console.log('Super Admin accounts (use email + your password to login at /super-admin):\n');
    admins.forEach((a, i) => {
        console.log(`  ${i + 1}. Email: ${a.email}`);
        console.log(`     Name: ${a.name}`);
        console.log(`     ID:   ${a.id}`);
        console.log(`     Created: ${a.createdAt.toISOString()}`);
        console.log('');
    });
    console.log('Password is not stored in plain text. If you forgot it, run: npm run seed:super-admin (use a new email).');
}
main()
    .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=list-super-admins.js.map