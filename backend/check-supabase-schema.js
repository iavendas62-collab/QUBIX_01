const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchema() {
  console.log('🔍 Verificando schema do Supabase...\n');
  
  try {
    // Verificar tabelas
    console.log('📊 TABELAS:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tableNames = tables.map(t => t.table_name);
    console.log('Existentes:', tableNames.join(', '));
    
    const qubixTables = ['User', 'Provider', 'Job', 'Transaction', 'ProviderMetric', 'Benchmark', 'JobLog', 'JobMetric'];
    console.log('\n📋 Tabelas do QUBIX necessárias:');
    qubixTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    // Verificar ENUMs
    console.log('\n🏷️  ENUMS:');
    const enums = await prisma.$queryRaw`
      SELECT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e'
      AND n.nspname = 'public'
      ORDER BY t.typname;
    `;
    
    const enumNames = enums.map(e => e.enum_name);
    console.log('Existentes:', enumNames.join(', '));
    
    const qubixEnums = ['Role', 'ProviderType', 'JobStatus', 'TransactionType', 'TransactionStatus'];
    console.log('\n📋 ENUMs do QUBIX necessários:');
    qubixEnums.forEach(enumName => {
      const exists = enumNames.includes(enumName);
      console.log(`   ${exists ? '✅' : '❌'} ${enumName}`);
    });
    
    // Gerar SQL apenas para o que falta
    console.log('\n📝 SQL NECESSÁRIO:\n');
    console.log('-- Cole este SQL no Supabase SQL Editor:\n');
    
    // ENUMs faltando
    qubixEnums.forEach(enumName => {
      if (!enumNames.includes(enumName)) {
        if (enumName === 'Role') {
          console.log(`CREATE TYPE "Role" AS ENUM ('CONSUMER', 'PROVIDER', 'BOTH');`);
        } else if (enumName === 'ProviderType') {
          console.log(`CREATE TYPE "ProviderType" AS ENUM ('BROWSER', 'NATIVE');`);
        } else if (enumName === 'JobStatus') {
          console.log(`CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');`);
        } else if (enumName === 'TransactionType') {
          console.log(`CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'EARNING', 'REFUND', 'ESCROW_LOCK', 'ESCROW_RELEASE');`);
        } else if (enumName === 'TransactionStatus') {
          console.log(`CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');`);
        }
        console.log('');
      }
    });
    
    console.log('-- Agora execute este comando no terminal:');
    console.log('-- cd backend && npx prisma db push --accept-data-loss\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
