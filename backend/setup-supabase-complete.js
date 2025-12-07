const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function setupSupabase() {
  console.log('🚀 Configurando Supabase - Schema Completo\n');
  console.log('='.repeat(60));

  try {
    // 1. Conectar
    console.log('\n📡 1. CONECTANDO AO SUPABASE');
    console.log('-'.repeat(60));
    await prisma.$connect();
    console.log('✅ Conectado com sucesso!');

    // 2. Ler o SQL de setup
    console.log('\n📄 2. LENDO SQL DE SETUP');
    console.log('-'.repeat(60));
    
    const sqlPath = path.join(__dirname, 'supabase-setup.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Arquivo supabase-setup.sql não encontrado!');
    }
    
    const setupSQL = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ SQL carregado:', setupSQL.length, 'caracteres');

    // 3. Executar SQL de setup (ENUMs e tabelas básicas)
    console.log('\n🔧 3. CRIANDO ENUMS E TABELAS BÁSICAS');
    console.log('-'.repeat(60));
    
    try {
      await prisma.$executeRawUnsafe(setupSQL);
      console.log('✅ ENUMs e tabelas básicas criadas!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Algumas estruturas já existem (normal)');
      } else {
        throw error;
      }
    }

    // 4. Ler SQL de sincronização
    console.log('\n📄 4. LENDO SQL DE SINCRONIZAÇÃO');
    console.log('-'.repeat(60));
    
    const syncPath = path.join(__dirname, 'sync-missing-columns-and-tables.sql');
    if (!fs.existsSync(syncPath)) {
      throw new Error('Arquivo sync-missing-columns-and-tables.sql não encontrado!');
    }
    
    const syncSQL = fs.readFileSync(syncPath, 'utf8');
    console.log('✅ SQL carregado:', syncSQL.length, 'caracteres');

    // 5. Executar SQL de sincronização
    console.log('\n🔧 5. SINCRONIZANDO SCHEMA');
    console.log('-'.repeat(60));
    
    try {
      await prisma.$executeRawUnsafe(syncSQL);
      console.log('✅ Schema sincronizado!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Algumas estruturas já existem (normal)');
      } else {
        throw error;
      }
    }

    // 6. Verificar tabelas criadas
    console.log('\n📊 6. VERIFICANDO TABELAS');
    console.log('-'.repeat(60));
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('User', 'Provider', 'Job', 'Transaction', 'ProviderMetric', 'JobLog', 'JobMetric', 'Benchmark')
      ORDER BY table_name;
    `;
    
    console.log(`✅ ${tables.length}/8 tabelas criadas:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    // 7. Verificar índices
    console.log('\n🔍 7. VERIFICANDO ÍNDICES');
    console.log('-'.repeat(60));
    
    const indexes = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('User', 'Provider', 'Job', 'Transaction', 'ProviderMetric', 'JobLog', 'JobMetric', 'Benchmark');
    `;
    
    console.log(`✅ ${indexes[0].total} índices criados`);

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SETUP COMPLETO!');
    console.log('='.repeat(60));
    console.log('✅ Conexão estabelecida');
    console.log(`✅ ${tables.length}/8 tabelas criadas`);
    console.log(`✅ ${indexes[0].total} índices criados`);
    console.log('\n📝 Próximo passo: Execute o teste de integração');
    console.log('   node test-supabase-integration.js');
    console.log('='.repeat(60));

  } catch (error) {
    console.log('\n❌ ERRO:', error.message);
    console.log('\n📋 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Desconectado\n');
  }
}

setupSupabase();
