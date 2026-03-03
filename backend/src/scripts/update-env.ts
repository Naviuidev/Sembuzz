import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
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
  let databaseUrl: string;
  if (password) {
    databaseUrl = `mysql://${username}:${password}@${host}:${port}/${database}`;
  } else {
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
    } catch (error: any) {
      console.error(`\n❌ Error writing .env file: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  .env file not updated. You can manually update it using the content above.');
  }

  rl.close();
}

updateEnv().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
