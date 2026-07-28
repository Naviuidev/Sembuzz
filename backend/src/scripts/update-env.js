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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function question(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}
async function updateEnv() {
    console.log('🔧 SemBuzz .env File Setup\n');
    console.log('This will help you create the correct MySQL connection string.\n');
    const username = await question('MySQL Username (usually "root"): ') || 'root';
    const password = await question('MySQL Password (press Enter if no password): ');
    const host = await question('MySQL Host (press Enter for localhost): ') || 'localhost';
    const port = await question('MySQL Port (press Enter for 3306): ') || '3306';
    const database = await question('Database Name (press Enter for sembuzz): ') || 'sembuzz';
    const jwtSecret = await question('JWT Secret (press Enter for default): ') || 'your-super-secret-jwt-key-change-in-production';
    const serverPort = await question('Server Port (press Enter for 3000): ') || '3000';
    // Build DATABASE_URL
    let databaseUrl;
    if (password) {
        databaseUrl = `mysql://${username}:${password}@${host}:${port}/${database}`;
    }
    else {
        databaseUrl = `mysql://${username}@${host}:${port}/${database}`;
    }
    // Create .env content
    const envContent = `# Database Connection
DATABASE_URL="${databaseUrl}"

# JWT Secret Key (change this to a random string in production)
JWT_SECRET="${jwtSecret}"

# Server Port
PORT=${serverPort}
`;
    const envPath = path.join(process.cwd(), '.env');
    console.log('\n📝 Generated .env content:');
    console.log('─'.repeat(50));
    console.log(envContent);
    console.log('─'.repeat(50));
    const confirm = await question('\n✅ Write this to .env file? (y/n): ');
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        try {
            fs.writeFileSync(envPath, envContent);
            console.log(`\n✅ .env file created successfully at: ${envPath}`);
            console.log('\n📝 Next steps:');
            console.log('   1. Run: npm run prisma:generate');
            console.log('   2. Run: npm run prisma:migrate');
            console.log('   3. Run: npm run prisma:seed');
            console.log('   4. Run: npm run seed:super-admin');
        }
        catch (error) {
            console.error(`\n❌ Error writing .env file: ${error.message}`);
        }
    }
    else {
        console.log('\n⚠️  .env file not updated. You can manually update it using the content above.');
    }
    rl.close();
}
updateEnv().catch((error) => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
});
//# sourceMappingURL=update-env.js.map