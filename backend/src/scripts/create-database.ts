import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createDatabase() {
  // Parse DATABASE_URL or use defaults
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('\nPlease create a .env file in the backend directory with:');
    console.log('DATABASE_URL="mysql://username:password@localhost:3306/sembuzz"');
    process.exit(1);
  }

  // Parse connection string
  // Format: mysql://username:password@host:port/database
  const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    console.error('❌ Invalid DATABASE_URL format');
    console.log('Expected format: mysql://username:password@host:port/database');
    process.exit(1);
  }

  const [, username, password, host, port, databaseName] = urlMatch;

  console.log('📦 Creating database...');
  console.log(`   Host: ${host}:${port}`);
  console.log(`   Database: ${databaseName}`);
  console.log(`   User: ${username}\n`);

  try {
    // Connect without specifying database (to create it)
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user: username,
      password,
    });

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Database '${databaseName}' created successfully!`);
    
    await connection.end();
    
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run prisma:generate');
    console.log('   2. Run: npm run prisma:migrate');
    console.log('   3. Run: npm run prisma:seed');
    console.log('   4. Run: npm run seed:super-admin');
    
  } catch (error: any) {
    console.error('❌ Error creating database:');
    console.error(error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Tip: Check your MySQL username and password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure MySQL server is running');
    }
    
    process.exit(1);
  }
}

createDatabase();
