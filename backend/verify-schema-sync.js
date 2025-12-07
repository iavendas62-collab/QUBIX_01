const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySchema() {
  console.log('🔍 Verificando sincronização do schema...\n');

  try {
    // Verificar tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('User', 'Provider', 'Job', 'Transaction', 'ProviderMetric', 'JobLog', 'JobMetric', 'Benchmark')
      ORDER BY table_name;
    `;

    console.log('📊 TABELAS QUBIX:');
    const requiredTables = ['User', 'Provider', 'Job', 'Transaction', 'ProviderMetric', 'JobLog', 'JobMetric', 'Benchmark'];
    const existingTables = tables.map(t => t.table_name);
    
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    });

    // Verificar colunas da tabela Job
    console.log('\n📋 COLUNAS DA TABELA JOB:');
    const jobColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'Job'
      ORDER BY column_name;
    `;

    const requiredJobColumns = [
      'id', 'userId', 'providerId', 'jobType', 'framework', 'fileName', 'fileUrl',
      'modelType', 'computeNeeded', 'inputData', 'requiredVRAM', 'requiredCompute', 
      'requiredRAM', 'advancedConfig', 'status', 'progress', 'currentOperation',
      'result', 'error', 'estimatedCost', 'estimatedDuration', 'actualCost', 
      'actualDuration', 'escrowTxHash', 'releaseTxHash', 'createdAt', 'startedAt', 'completedAt'
    ];

    const existingJobColumns = jobColumns.map(c => c.column_name);
    
    requiredJobColumns.forEach(col => {
      const exists = existingJobColumns.includes(col);
      console.log(`${exists ? '✅' : '❌'} ${col}`);
    });

    // Verificar colunas da tabela Transaction
    console.log('\n📋 COLUNAS DA TABELA TRANSACTION:');
    const transactionColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'Transaction'
      ORDER BY column_name;
    `;

    const requiredTransactionColumns = [
      'id', 'userId', 'jobId', 'type', 'amount', 'status', 
      'qubicTxHash', 'confirmations', 'createdAt', 'completedAt'
    ];

    const existingTransactionColumns = transactionColumns.map(c => c.column_name);
    
    requiredTransactionColumns.forEach(col => {
      const exists = existingTransactionColumns.includes(col);
      console.log(`${exists ? '✅' : '❌'} ${col}`);
    });

    // Verificar índices
    console.log('\n🔍 ÍNDICES IMPORTANTES:');
    const indexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('Job', 'Transaction', 'ProviderMetric', 'JobLog', 'JobMetric', 'Benchmark')
      ORDER BY indexname;
    `;

    const requiredIndexes = [
      'Transaction_userId_createdAt_idx',
      'Transaction_qubicTxHash_idx',
      'ProviderMetric_providerId_timestamp_idx',
      'JobLog_jobId_timestamp_idx',
      'JobMetric_jobId_timestamp_idx',
      'Benchmark_jobType_idx',
      'Benchmark_gpuModel_idx'
    ];

    const existingIndexes = indexes.map(i => i.indexname);
    
    requiredIndexes.forEach(idx => {
      const exists = existingIndexes.includes(idx);
      console.log(`${exists ? '✅' : '❌'} ${idx}`);
    });

    // Resumo final
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    const missingJobColumns = requiredJobColumns.filter(c => !existingJobColumns.includes(c));
    const missingTransactionColumns = requiredTransactionColumns.filter(c => !existingTransactionColumns.includes(c));
    const missingIndexes = requiredIndexes.filter(i => !existingIndexes.includes(i));

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO:');
    console.log('='.repeat(50));
    
    if (missingTables.length === 0 && missingJobColumns.length === 0 && 
        missingTransactionColumns.length === 0 && missingIndexes.length === 0) {
      console.log('✅ Schema 100% sincronizado!');
      console.log('✅ Todas as tabelas, colunas e índices estão presentes.');
    } else {
      console.log('⚠️  Schema NÃO está completamente sincronizado:\n');
      
      if (missingTables.length > 0) {
        console.log(`❌ Tabelas faltando (${missingTables.length}):`);
        missingTables.forEach(t => console.log(`   - ${t}`));
      }
      
      if (missingJobColumns.length > 0) {
        console.log(`\n❌ Colunas faltando na tabela Job (${missingJobColumns.length}):`);
        missingJobColumns.forEach(c => console.log(`   - ${c}`));
      }
      
      if (missingTransactionColumns.length > 0) {
        console.log(`\n❌ Colunas faltando na tabela Transaction (${missingTransactionColumns.length}):`);
        missingTransactionColumns.forEach(c => console.log(`   - ${c}`));
      }
      
      if (missingIndexes.length > 0) {
        console.log(`\n❌ Índices faltando (${missingIndexes.length}):`);
        missingIndexes.forEach(i => console.log(`   - ${i}`));
      }

      console.log('\n📝 Execute o SQL de sincronização:');
      console.log('   backend/sync-missing-columns-and-tables.sql');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
