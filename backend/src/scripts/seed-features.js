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
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// For Prisma 7, we can pass the connection string via environment variable
// The client will read DATABASE_URL automatically
const prisma = new client_1.PrismaClient({
    // @ts-ignore - Prisma 7 internal API
    __internal: {
        engine: {
            connect: async () => {
                // Use direct connection
                return process.env.DATABASE_URL;
            }
        }
    }
});
async function main() {
    console.log('Seeding features...');
    const features = [
        { code: 'NEWS', name: 'News' },
        { code: 'EVENTS', name: 'Events' },
        { code: 'ADS', name: 'Advertisements' },
        { code: 'INSTAGRAM', name: 'Instagram Feed' },
        { code: 'ANALYTICS', name: 'Analytics' },
        { code: 'EMERGENCY', name: 'Emergency Notifications' },
        { code: 'GROUP_MESSAGING', name: 'Group messages' },
        { code: 'INDIVIDUAL_MESSAGING', name: 'Individual messages' },
    ];
    for (const feature of features) {
        const result = await prisma.feature.upsert({
            where: { code: feature.code },
            update: {},
            create: feature,
        });
        console.log(`✓ Feature ${result.code} (${result.name}) seeded`);
    }
    console.log('Features seeding completed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-features.js.map