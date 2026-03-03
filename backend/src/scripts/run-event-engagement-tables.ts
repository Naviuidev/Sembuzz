/**
 * Creates event_likes, event_comments, user_saved_events tables.
 * Run: npx ts-node src/scripts/run-event-engagement-tables.ts
 * (or: npm run db:event-tables if you add the script)
 */
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS event_likes (
    id VARCHAR(191) NOT NULL,
    eventId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX event_likes_eventId_userId_key (eventId, userId),
    INDEX event_likes_eventId_idx (eventId),
    INDEX event_likes_userId_idx (userId),
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS event_comments (
    id VARCHAR(191) NOT NULL,
    eventId VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    text TEXT NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX event_comments_eventId_idx (eventId),
    INDEX event_comments_userId_idx (userId),
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS user_saved_events (
    id VARCHAR(191) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    eventId VARCHAR(191) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX user_saved_events_userId_eventId_key (userId, eventId),
    INDEX user_saved_events_userId_idx (userId),
    INDEX user_saved_events_eventId_idx (eventId),
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
];

const FK_STATEMENTS = [
  'ALTER TABLE event_likes ADD CONSTRAINT event_likes_eventId_fkey FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'ALTER TABLE event_likes ADD CONSTRAINT event_likes_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'ALTER TABLE event_comments ADD CONSTRAINT event_comments_eventId_fkey FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'ALTER TABLE event_comments ADD CONSTRAINT event_comments_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'ALTER TABLE user_saved_events ADD CONSTRAINT user_saved_events_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'ALTER TABLE user_saved_events ADD CONSTRAINT user_saved_events_eventId_fkey FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE ON UPDATE CASCADE',
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith('mysql://')) {
    console.error('DATABASE_URL (mysql://...) not set in .env');
    process.exit(1);
  }
  // Parse mysql://user:password@host:port/database (password and port optional)
  const urlMatch = dbUrl.match(/mysql:\/\/([^:@]+)(?::([^@]*))?@([^:/]+)(?::(\d+))?\/([^?]+)/);
  if (!urlMatch) {
    console.error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    process.exit(1);
  }
  const [, user, password, host, portStr, database] = urlMatch;
  const port = portStr ? parseInt(portStr, 10) : 3306;
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });
  try {
    console.log('Creating event_likes, event_comments, user_saved_events...');
    for (const sql of SQL_STATEMENTS) {
      await connection.query(sql);
      console.log('  Table OK');
    }
    console.log('Adding foreign keys...');
    for (const sql of FK_STATEMENTS) {
      try {
        await connection.query(sql);
        console.log('  FK OK');
      } catch (e: unknown) {
        const msg = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : '';
        if (msg === 'ER_DUP_KEYNAME' || (typeof (e as Error).message === 'string' && (e as Error).message.includes('Duplicate'))) {
          console.log('  FK already exists, skip');
        } else {
          throw e;
        }
      }
    }
    console.log('Done. Like, comment, and save tables are ready.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
