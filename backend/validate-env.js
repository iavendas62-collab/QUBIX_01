require('dotenv').config();

console.log('🔍 Validando Variáveis de Ambiente\n');
console.log('='.repeat(70));

const requiredVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'PORT',
];

const optionalVars = [
  'QUBIC_NETWORK',
  'QUBIC_RPC_URL',
  'QUBIC_WS_URL',
  'QUBIC_PLATFORM_SEED',
  'QUBIC_PLATFORM_ADDRESS',
  'FRONTEND_URL',
  'OPENAI_API_KEY',
];

console.log('\n📋 VARIÁVEIS OBRIGATÓRIAS:\n');

let allRequired = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const status = exists ? '✅' : '❌';
  
  console.log(`${status} ${varName}`);
  
  if (exists) {
    // Mostrar preview da variável (esconder senhas)
    if (varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('SEED')) {
      console.log(`   Preview: ${value.substring(0, 10)}...`);
    } else if (varName.includes('URL')) {
      // Verificar se há quebras de linha
      if (value.includes('\n') || value.includes('\r')) {
        console.log(`   ⚠️  ATENÇÃO: URL contém quebras de linha!`);
        console.log(`   Valor: "${value}"`);
        allRequired = false;
      } else {
        console.log(`   Preview: ${value.substring(0, 50)}...`);
      }
    } else {
      console.log(`   Valor: ${value}`);
    }
  } else {
    allRequired = false;
  }
  console.log('');
});

console.log('\n📋 VARIÁVEIS OPCIONAIS:\n');

optionalVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  const status = exists ? '✅' : '⚪';
  
  console.log(`${status} ${varName}`);
  
  if (exists) {
    if (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('SEED')) {
      console.log(`   Preview: ${value.substring(0, 10)}...`);
    } else {
      console.log(`   Valor: ${value}`);
    }
  }
  console.log('');
});

console.log('='.repeat(70));

if (allRequired) {
  console.log('✅ Todas as variáveis obrigatórias estão configuradas!');
} else {
  console.log('❌ Algumas variáveis obrigatórias estão faltando ou inválidas!');
  console.log('\n💡 Dicas:');
  console.log('   1. Verifique se o arquivo .env existe em backend/');
  console.log('   2. Certifique-se de que não há quebras de linha nas URLs');
  console.log('   3. Use aspas duplas para valores com caracteres especiais');
}

console.log('='.repeat(70));

// Teste específico de DATABASE_URL
console.log('\n🔍 ANÁLISE DETALHADA DA DATABASE_URL:\n');

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  console.log('Comprimento:', dbUrl.length);
  console.log('Contém \\n:', dbUrl.includes('\n'));
  console.log('Contém \\r:', dbUrl.includes('\r'));
  console.log('Primeiro caractere:', dbUrl.charCodeAt(0));
  console.log('Último caractere:', dbUrl.charCodeAt(dbUrl.length - 1));
  
  // Tentar extrair componentes
  try {
    const url = new URL(dbUrl.split('?')[0]);
    console.log('\n✅ URL Válida:');
    console.log('   Protocol:', url.protocol);
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port);
    console.log('   Database:', url.pathname);
  } catch (error) {
    console.log('\n❌ URL Inválida:', error.message);
  }
}

console.log('\n');
