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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const readline = __importStar(require("readline"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new client_1.PrismaClient({});
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function question(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}
async function main() {
    console.log('=== Super Admin Account Creation ===\n');
    const name = await question('Enter Super Admin name: ');
    const email = await question('Enter Super Admin email: ');
    const password = await question('Enter Super Admin password: ');
    // Check if email already exists
    const existing = await prisma.superAdmin.findUnique({
        where: { email },
    });
    if (existing) {
        console.error(`\n❌ Super Admin with email ${email} already exists!`);
        rl.close();
        process.exit(1);
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create super admin
    const superAdmin = await prisma.superAdmin.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });
    console.log(`\n✅ Super Admin created successfully!`);
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Created: ${superAdmin.createdAt}`);
    rl.close();
}
main()
    .catch((e) => {
    console.error('Error:', e);
    rl.close();
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-super-admin.js.map