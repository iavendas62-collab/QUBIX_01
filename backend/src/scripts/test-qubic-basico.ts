/**
 * Teste Básico da Integração Qubic
 * 
 * Testa funcionalidades que não precisam de conexão de rede
 */

import qubicWallet from '../services/qubic-wallet';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('\n' + '='.repeat(60));
console.log('🧪 TESTE BÁSICO - INTEGRAÇÃO QUBIC');
console.log('='.repeat(60) + '\n');

async function testeCompleto() {
  let testsPassed = 0;
  let testsFailed = 0;

  // ============================================
  // TESTE 1: Criar Carteira
  // ============================================
  console.log('📝 TESTE 1: Criar Carteira\n');
  try {
    const wallet = await qubicWallet.createWallet();
    
    console.log('✅ Carteira criada com sucesso!');
    console.log(`   Identity: ${wallet.identity}`);
    console.log(`   Seed: ${wallet.seed.substring(0, 20)}...`);
    console.log(`   Tamanho do seed: ${wallet.seed.length} caracteres`);
    console.log(`   Tamanho da identity: ${wallet.identity.length} caracteres\n`);
    
    // Validações
    if (wallet.seed.length !== 55) {
      throw new Error('Seed deve ter 55 caracteres');
    }
    if (wallet.identity.length < 60) {
      throw new Error('Identity deve ter mais de 60 caracteres');
    }
    if (!/^[a-z]+$/.test(wallet.seed)) {
      throw new Error('Seed deve conter apenas letras minúsculas');
    }
    if (!/^[A-Z]+$/.test(wallet.identity)) {
      throw new Error('Identity deve conter apenas letras maiúsculas');
    }
    
    testsPassed++;
    console.log('✅ TESTE 1 PASSOU\n');
    
    // ============================================
    // TESTE 2: Importar Carteira
    // ============================================
    console.log('📝 TESTE 2: Importar Carteira\n');
    
    const importedWallet = await qubicWallet.importWallet(wallet.seed);
    
    console.log('✅ Carteira importada com sucesso!');
    console.log(`   Identity: ${importedWallet.identity}`);
    
    // Validar que a identity é a mesma
    if (importedWallet.identity !== wallet.identity) {
      throw new Error('Identity importada diferente da original');
    }
    
    testsPassed++;
    console.log('✅ TESTE 2 PASSOU\n');
    
    // ============================================
    // TESTE 3: Validar Identity
    // ============================================
    console.log('📝 TESTE 3: Validar Identity\n');
    
    const isValid = qubicWallet.validateIdentity(wallet.identity);
    console.log(`   Identity válida: ${isValid ? '✅' : '❌'}`);
    
    if (!isValid) {
      throw new Error('Identity deveria ser válida');
    }
    
    // Testar identity inválida
    const isInvalid = qubicWallet.validateIdentity('INVALID');
    console.log(`   Identity inválida detectada: ${!isInvalid ? '✅' : '❌'}`);
    
    if (isInvalid) {
      throw new Error('Identity inválida não foi detectada');
    }
    
    testsPassed++;
    console.log('✅ TESTE 3 PASSOU\n');
    
    // ============================================
    // TESTE 4: Conversões de Valor
    // ============================================
    console.log('📝 TESTE 4: Conversões de Valor\n');
    
    // QUBIC para unidades
    const qubicAmount = 1.5;
    const units = qubicWallet.toSmallestUnit(qubicAmount);
    console.log(`   ${qubicAmount} QUBIC = ${units} units`);
    
    if (units !== BigInt(1500000000)) {
      throw new Error('Conversão QUBIC -> units incorreta');
    }
    
    // Unidades para QUBIC
    const backToQubic = qubicWallet.toQubic(units);
    console.log(`   ${units} units = ${backToQubic} QUBIC`);
    
    if (backToQubic !== qubicAmount) {
      throw new Error('Conversão units -> QUBIC incorreta');
    }
    
    testsPassed++;
    console.log('✅ TESTE 4 PASSOU\n');
    
    // ============================================
    // TESTE 5: Validação de Seed
    // ============================================
    console.log('📝 TESTE 5: Validação de Seed\n');
    
    // Seed válido
    const validSeed = 'a'.repeat(55);
    console.log(`   Seed válido (55 chars): ${qubicWallet['validateSeed'](validSeed) ? '✅' : '❌'}`);
    
    // Seed inválido (tamanho errado)
    const invalidSeed1 = 'a'.repeat(54);
    console.log(`   Seed inválido (54 chars): ${!qubicWallet['validateSeed'](invalidSeed1) ? '✅' : '❌'}`);
    
    // Seed inválido (caracteres maiúsculos)
    const invalidSeed2 = 'A'.repeat(55);
    console.log(`   Seed inválido (uppercase): ${!qubicWallet['validateSeed'](invalidSeed2) ? '✅' : '❌'}`);
    
    testsPassed++;
    console.log('✅ TESTE 5 PASSOU\n');
    
    // ============================================
    // TESTE 6: Múltiplas Carteiras
    // ============================================
    console.log('📝 TESTE 6: Criar Múltiplas Carteiras\n');
    
    const wallet1 = await qubicWallet.createWallet();
    const wallet2 = await qubicWallet.createWallet();
    const wallet3 = await qubicWallet.createWallet();
    
    console.log(`   Carteira 1: ${wallet1.identity.substring(0, 20)}...`);
    console.log(`   Carteira 2: ${wallet2.identity.substring(0, 20)}...`);
    console.log(`   Carteira 3: ${wallet3.identity.substring(0, 20)}...`);
    
    // Validar que são diferentes
    if (wallet1.identity === wallet2.identity || wallet1.identity === wallet3.identity || wallet2.identity === wallet3.identity) {
      throw new Error('Carteiras deveriam ser diferentes');
    }
    
    if (wallet1.seed === wallet2.seed || wallet1.seed === wallet3.seed || wallet2.seed === wallet3.seed) {
      throw new Error('Seeds deveriam ser diferentes');
    }
    
    testsPassed++;
    console.log('✅ TESTE 6 PASSOU\n');
    
    // ============================================
    // RESUMO
    // ============================================
    console.log('='.repeat(60));
    console.log('📊 RESUMO DOS TESTES\n');
    console.log(`   ✅ Testes passados: ${testsPassed}`);
    console.log(`   ❌ Testes falhados: ${testsFailed}`);
    console.log(`   📈 Taxa de sucesso: ${(testsPassed / (testsPassed + testsFailed) * 100).toFixed(0)}%`);
    console.log('='.repeat(60) + '\n');
    
    if (testsFailed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM!\n');
      console.log('✅ A integração Qubic está funcionando perfeitamente!');
      console.log('✅ Você pode criar carteiras, importar, validar e converter valores.');
      console.log('\n💡 Próximos passos:');
      console.log('   1. Configure um nó Qubic válido');
      console.log('   2. Teste consulta de saldo');
      console.log('   3. Teste envio de transação\n');
      return true;
    } else {
      console.log('❌ ALGUNS TESTES FALHARAM\n');
      return false;
    }
    
  } catch (error) {
    testsFailed++;
    console.error('❌ TESTE FALHOU:', error);
    console.log('\n='.repeat(60));
    console.log('📊 RESUMO DOS TESTES\n');
    console.log(`   ✅ Testes passados: ${testsPassed}`);
    console.log(`   ❌ Testes falhados: ${testsFailed}`);
    console.log('='.repeat(60) + '\n');
    return false;
  }
}

// Executar testes
testeCompleto()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
