/**
 * Run users table column migration (run_user_columns_update.sql).
 * Uses DATABASE_URL from .env.
 * Run: npx ts-node src/scripts/run-user-columns-migration.ts
 */
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string };
    console.error('Migration failed:', e?.message || e);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
