/**
 * Script para verificar variáveis de ambiente no Railway
 * Execute: npm run check-env
 */

console.log('=== VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ===\n');

const requiredVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'NODE_ENV',
  'JWT_SECRET',
  'QUBIC_NETWORK',
  'QUBIC_RPC_URL',
  'QUBIC_PLATFORM_ADDRESS',
  'QUBIC_PLATFORM_SEED'
];

const optionalVars = [
  'PORT',
  'FRONTEND_URL',
  'LOG_LEVEL',
  'REDIS_PASSWORD',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD'
];

console.log('📋 VARIÁVEIS OBRIGATÓRIAS:\n');
let missingRequired = 0;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mascarar valores sensíveis
    const isSensitive = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('SEED');
    const displayValue = isSensitive 
      ? `${value.substring(0, 10)}...` 
      : (value.length > 50 ? `${value.substring(0, 50)}...` : value);
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NÃO ENCONTRADA`);
    missingRequired++;
  }
});

console.log('\n📋 VARIÁVEIS OPCIONAIS:\n');

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const isSensitive = varName.includes('PASSWORD');
    const displayValue = isSensitive 
      ? `${value.substring(0, 5)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`⚠️  ${varName}: não definida`);
  }
});

console.log('\n=== RESUMO ===\n');

if (missingRequired > 0) {
  console.log(`❌ ${missingRequired} variável(is) obrigatória(s) faltando!`);
  console.log('\n🔧 AÇÃO NECESSÁRIA:');
  console.log('1. Vá no Railway Dashboard');
  console.log('2. Selecione o serviço Backend');
  console.log('3. Vá na aba Variables');
  console.log('4. Adicione as variáveis faltantes');
  console.log('5. Force um redeploy\n');
  process.exit(1);
} else {
  console.log('✅ Todas as variáveis obrigatórias estão configuradas!');
  console.log('\n🚀 Pronto para iniciar o servidor\n');
  process.exit(0);
}
