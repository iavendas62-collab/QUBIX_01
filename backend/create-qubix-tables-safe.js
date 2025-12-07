const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createQubixTables() {
  console.log('🚀 Criando tabelas do QUBIX (preservando tabelas existentes)...\n');
  
  try {
    // Ler o arquivo SQL da migration
    const migrationPath = path.join(__dirname, 'prisma/migrations/20241130000000_init/migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Encontrados ${commands.length} comandos SQL\n`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const command of commands) {
      try {
        // Pular comentários
        if (command.startsWith('--')) continue;
        
        // Executar comando
        await prisma.$executeRawUnsafe(command + ';');
        
        // Identificar o tipo de comando
        if (command.includes('CREATE TABLE')) {
          const tableName = command.match(/CREATE TABLE "(\w+)"/)?.[1];
          console.log(`✅ Tabela criada: ${tableName}`);
          created++;
        } else if (command.includes('CREATE TYPE')) {
          const typeName = command.match(/CREATE TYPE "(\w+)"/)?.[1];
          console.log(`✅ Enum criado: ${typeName}`);
          created++;
        } else if (command.includes('CREATE INDEX') || command.includes('CREATE UNIQUE INDEX')) {
          skipped++; // Não mostrar índices
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipped++;
        } else {
          console.error(`⚠️  Erro: ${error.message.substring(0, 100)}`);
          errors++;
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   ✅ Criados: ${created}`);
    console.log(`   ⏭️  Ignorados (já existem): ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
    
    // Verificar tabelas finais
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`\n📋 Total de tabelas no banco: ${tables.length}`);
    
    const qubixTables = ['User', 'Provider', 'Job', 'Transaction', 'ProviderMetric'];
    console.log('\n🎯 Tabelas do QUBIX:');
    qubixTables.forEach(table => {
      const exists = tables.some(t => t.table_name === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    console.log('\n🎉 Setup concluído!');
    
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createQubixTables();
