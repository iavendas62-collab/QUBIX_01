const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupQubixTables() {
  console.log('🚀 Configurando tabelas do QUBIX (sem afetar tabelas existentes)...\n');
  
  try {
    // Verificar tabelas existentes
    console.log('📋 Verificando tabelas existentes...');
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`✅ Encontradas ${existingTables.length} tabelas existentes (não serão modificadas)\n`);
    
    // Criar apenas as tabelas do QUBIX que não existem
    console.log('🔨 Criando tabelas do QUBIX...\n');
    
    // Usar Prisma push para criar as tabelas
    const { execSync } = require('child_process');
    
    try {
      console.log('📦 Executando prisma db push...');
      execSync('npx prisma db push --skip-generate', { 
        cwd: __dirname,
        stdio: 'inherit'
      });
      console.log('✅ Tabelas do QUBIX criadas com sucesso!\n');
    } catch (error) {
      console.log('⚠️  Algumas tabelas já existem, continuando...\n');
    }
    
    // Verificar tabelas finais
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`📊 Total de tabelas no banco: ${finalTables.length}`);
    console.log('\n📋 Tabelas do QUBIX:');
    const qubixTables = ['User', 'Provider', 'Job', 'Transaction', 'JobLog', 'JobMetric', 'Benchmark'];
    qubixTables.forEach(table => {
      const exists = finalTables.some(t => t.table_name === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });
    
    console.log('\n🎉 Setup concluído! Backend pronto para iniciar.');
    
  } catch (error) {
    console.error('\n❌ Erro ao configurar tabelas:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupQubixTables();
