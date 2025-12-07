const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('QUBIX Database Verification');
console.log('========================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('Please create a .env file based on .env.example\n');
    process.exit(1);
}

console.log('✓ .env file found');

// Load environment variables
require('dotenv').config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set in .env file!\n');
    process.exit(1);
}

console.log('✓ DATABASE_URL configured');
console.log(`  ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

// Check if Prisma schema exists
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema not found!\n');
    process.exit(1);
}

console.log('✓ Prisma schema found\n');

// Try to connect to database
console.log('Testing database connection...');
try {
    execSync('npx prisma db pull --force', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
    });
    console.log('✓ Database connection successful!\n');
} catch (error) {
    console.error('❌ Cannot connect to database');
    console.log('\nPossible solutions:');
    console.log('1. Start PostgreSQL with Docker:');
    console.log('   docker-compose up -d postgres');
    console.log('\n2. Install PostgreSQL locally (see DATABASE_SETUP.md)');
    console.log('\n3. Check if PostgreSQL is running:');
    console.log('   docker ps | grep postgres');
    console.log('   OR');
    console.log('   sudo systemctl status postgresql\n');
    process.exit(1);
}

// Check if migrations are up to date
console.log('Checking migration status...');
try {
    const output = execSync('npx prisma migrate status', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8'
    });
    
    if (output.includes('Database schema is up to date')) {
        console.log('✓ Database migrations are up to date\n');
    } else if (output.includes('following migrations have not yet been applied')) {
        console.log('⚠ Pending migrations detected');
        console.log('\nRun migrations with:');
        console.log('  npm run migrate\n');
    } else {
        console.log('⚠ Migration status unclear');
        console.log('\nRun migrations with:');
        console.log('  npm run migrate\n');
    }
} catch (error) {
    console.log('⚠ Could not check migration status');
    console.log('\nRun migrations with:');
    console.log('  npm run migrate\n');
}

console.log('========================================');
console.log('Verification Complete');
console.log('========================================\n');
console.log('Next steps:');
console.log('1. Run migrations: npm run migrate');
console.log('2. Start the server: npm run dev');
console.log('3. View database: npx prisma studio\n');
