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
 * Run users table column migration (run_user_columns_update.sql).
 * Uses DATABASE_URL from .env.
 * Run: npx ts-node src/scripts/run-user-columns-migration.ts
 */
const mysql = __importStar(require("mysql2/promise"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || !dbUrl.startsWith('mysql://')) {
        console.error('DATABASE_URL (mysql://...) not set in .env');
        process.exit(1);
    }
    const urlMatch = dbUrl.match(/mysql:\/\/([^:@]+)(?::([^@]*))?@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (!urlMatch) {
        console.error('Invalid DATABASE_URL. Expected: mysql://user:password@host:port/database');
        process.exit(1);
    }
    const [, user, password, host, portStr, database] = urlMatch;
    const port = portStr ? parseInt(portStr, 10) : 3306;
    const sqlPath = path.resolve(process.cwd(), 'prisma', 'migrations', 'run_user_columns_update.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('SQL file not found:', sqlPath);
        process.exit(1);
    }
    let sql = fs.readFileSync(sqlPath, 'utf8');
    // Remove comments and empty lines, keep semicolons for splitting
    sql = sql
        .replace(/^--.*$/gm, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    const connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        multipleStatements: true,
    });
    try {
        console.log('Running users table column migration...');
        await connection.query(sql);
        console.log('Migration completed successfully.');
    }
    catch (err) {
        const e = err;
        console.error('Migration failed:', e?.message || e);
        process.exit(1);
    }
    finally {
        await connection.end();
    }
}
main();
//# sourceMappingURL=run-user-columns-migration.js.map