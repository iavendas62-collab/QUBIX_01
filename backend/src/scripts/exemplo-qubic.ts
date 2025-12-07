/**
 * Exemplo Prático de Uso da Integração Qubic
 * 
 * Este script demonstra como usar o serviço qubic-wallet
 * em cenários reais da aplicação
 */

import qubicWallet from '../services/qubic-wallet';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================
// EXEMPLO 1: Criar e Salvar Carteira
// ============================================
async function exemplo1_CriarCarteira() {
  console.log('\n' + '='.repeat(60));
  console.log('EXEMPLO 1: Criar Nova Carteira');
  console.log('='.repeat(60) + '\n');

  try {
    // Criar carteira
    const wallet = await qubicWallet.createWallet();

    console.log('✅ Carteira criada com sucesso!\n');
    console.log('📋 Informações da Carteira:');
    console.log('   Identity:', wallet.identity);
    console.log('   Seed:', wallet.seed);
    console.log('   Index:', wallet.index);
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. Guarde o SEED em local seguro');
    console.log('   2. Nunca compartilhe o seed');
    console.log('   3. Use a IDENTITY para receber pagamentos');
    
    return wallet;
  } catch (error) {
    console.error('❌ Erro ao criar carteira:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 2: Importar Carteira Existente
// ============================================
async function exemplo2_ImportarCarteira(seed: string) {
  console.log('\n' + '='.repeat(60));
  console.log('EXEMPLO 2: Importar Carteira Existente');
  console.log('='.repeat(60) + '\n');

  try {
    // Importar carteira
    const wallet = await qubicWallet.importWallet(seed);

    console.log('✅ Carteira importada com sucesso!\n');
    console.log('📋 Informações:');
    console.log('   Identity:', wallet.identity);
    console.log('   Seed:', wallet.seed.substring(0, 20) + '...');
    
    return wallet;
  } catch (error) {
    console.error('❌ Erro ao importar carteira:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 3: Consultar Saldo
// ============================================
async function exemplo3_ConsultarSaldo(identity: string) {
  console.log('\n' + '='.repeat(60));
  console.log('EXEMPLO 3: Consultar Saldo');
  console.log('='.repeat(60) + '\n');

  try {
    // Inicializar conexão
    console.log('🔌 Conectando à rede Qubic...');
    await qubicWallet.initializeClient();
    
    // Aguardar conexão estabilizar
    console.log('⏳ Aguardando conexão...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Consultar saldo
    console.log('💰 Consultando saldo...\n');
    const balance = await qubicWallet.getBalance(identity);

    console.log('✅ Saldo obtido:\n');
    console.log('   Identity:', balance.identity);
    console.log('   Saldo:', balance.energyQubic, 'QUBIC');
    console.log('   Raw:', balance.energy.toString(), 'units');
    
    if (balance.energyQubic === 0) {
      console.log('\n💡 Dica: Use o faucet da testnet para obter QUBIC de teste');
    }
    
    return balance;
  } catch (error) {
    console.error('❌ Erro ao consultar saldo:', error);
    throw error;
  } finally {
    await qubicWallet.close();
  }
}

// ============================================
// EXEMPLO 4: Enviar Transação
// ============================================
async function exemplo4_EnviarTransacao(
  senderSeed: string,
  recipientIdentity: string,
  amountQubic: number
) {
  console.log('\n' + '='.repeat(60));
  console.log('EXEMPLO 4: Enviar Transação');
  console.log('='.repeat(60) + '\n');

  try {
    // Importar carteira remetente
    const sender = await qubicWallet.importWallet(senderSeed);
    console.log('📤 Remetente:', sender.identity);
    console.log('📥 Destinatário:', recipientIdentity);
    console.log('💵 Valor:', amountQubic, 'QUBIC\n');

    // Inicializar conexão
    await qubicWallet.initializeClient();
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar saldo
    console.log('🔍 Verificando saldo...');
    const balance = await qubicWallet.getBalance(sender.identity);
    console.log('   Saldo atual:', balance.energyQubic, 'QUBIC\n');

    if (balance.energyQubic < amountQubic) {
      throw new Error(`Saldo insuficiente! Necessário: ${amountQubic} QUBIC, Disponível: ${balance.energyQubic} QUBIC`);
    }

    // Converter valor
    const amount = qubicWallet.toSmallestUnit(amountQubic);

    // Enviar transação
    console.log('📝 Criando e enviando transação...');
    const tx = await qubicWallet.sendTransaction(
      senderSeed,
      recipientIdentity,
      amount
    );

    console.log('\n✅ Transação enviada com sucesso!\n');
    console.log('📋 Detalhes:');
    console.log('   TX Hash:', tx.hash);
    console.log('   De:', tx.from);
    console.log('   Para:', tx.to);
    console.log('   Valor:', qubicWallet.toQubic(tx.amount), 'QUBIC');
    
    console.log('\n💡 Aguarde alguns minutos para confirmação na rede');
    
    return tx;
  } catch (error) {
    console.error('❌ Erro ao enviar transação:', error);
    throw error;
  } finally {
    await qubicWallet.close();
  }
}

// ============================================
// EXEMPLO 5: Validar Identity
// ============================================
async function exemplo5_ValidarIdentity(identity: string) {
  console.log('\n' + '='.repeat(60));
  console.log('EXEMPLO 5: Validar Identity');
  console.log('='.repeat(60) + '\n');

  try {
    console.log('🔍 Validando identity:', identity);
    
    // Validação básica de formato
    const isValidFormat = qubicWallet.validateIdentity(identity);
    console.log('   Formato válido:', isValidFormat ? '✅' : '❌');
    
    if (!isValidFormat) {
      console.log('\n❌ Identity inválida!');
      console.log('   - Deve ter mais de 60 caracteres');
      console.log('   - Deve conter apenas letras maiúsculas A-Z');
      return false;
    }
    
    console.log('\n✅ Identity válida!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao validar identity:', error);
    return false;
  }
}

// ============================================
// EXEMPLO 6: Cenário Completo - Escrow
// ============================================
async function exemplo6_CenarioEscrow() {
  console.log('\n' + '='.repeat(60));
  console.log('EXEMPLO 6: Cenário Completo - Sistema de Escrow');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Criar carteiras para teste
    console.log('1️⃣  Criando carteiras de teste...\n');
    
    const consumer = await qubicWallet.createWallet();
    console.log('   👤 Consumer:', consumer.identity);
    
    const provider = await qubicWallet.createWallet();
    console.log('   🏢 Provider:', provider.identity);
    
    const platform = await qubicWallet.createWallet();
    console.log('   🏦 Platform:', platform.identity);

    // 2. Simular fluxo de escrow
    console.log('\n2️⃣  Fluxo de Escrow:\n');
    
    console.log('   📝 Job criado: job-123');
    console.log('   💰 Valor: 10 QUBIC');
    console.log('   🔒 Consumer → Platform (escrow lock)');
    console.log('   ⏳ Provider executa job...');
    console.log('   ✅ Job completado');
    console.log('   💸 Platform → Provider (8.5 QUBIC - 85%)');
    console.log('   💸 Platform → Platform (1.5 QUBIC - 15% fee)');
    
    console.log('\n3️⃣  Resumo:\n');
    console.log('   Consumer pagou: 10 QUBIC');
    console.log('   Provider recebeu: 8.5 QUBIC');
    console.log('   Platform fee: 1.5 QUBIC');
    
    console.log('\n💡 Para implementar de verdade:');
    console.log('   1. Financie a carteira do consumer');
    console.log('   2. Use exemplo4_EnviarTransacao() para cada etapa');
    console.log('   3. Aguarde confirmações entre transações');
    
    return { consumer, provider, platform };
  } catch (error) {
    console.error('❌ Erro no cenário de escrow:', error);
    throw error;
  }
}

// ============================================
// MENU PRINCIPAL
// ============================================
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EXEMPLOS DE USO - INTEGRAÇÃO QUBIC');
  console.log('='.repeat(60));

  try {
    // Exemplo 1: Criar carteira
    const wallet = await exemplo1_CriarCarteira();

    // Exemplo 2: Importar carteira
    await exemplo2_ImportarCarteira(wallet.seed);

    // Exemplo 3: Consultar saldo
    await exemplo3_ConsultarSaldo(wallet.identity);

    // Exemplo 5: Validar identity
    await exemplo5_ValidarIdentity(wallet.identity);
    await exemplo5_ValidarIdentity('INVALID');

    // Exemplo 6: Cenário de escrow
    await exemplo6_CenarioEscrow();

    // Exemplo 4: Enviar transação (comentado - precisa de saldo)
    /*
    await exemplo4_EnviarTransacao(
      'seu-seed-aqui',
      'IDENTITY_DESTINO',
      0.1 // 0.1 QUBIC
    );
    */

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS EXEMPLOS EXECUTADOS COM SUCESSO!');
    console.log('='.repeat(60) + '\n');

    console.log('📚 Próximos passos:');
    console.log('   1. Financie uma carteira na testnet');
    console.log('   2. Descomente o exemplo4 e teste transação real');
    console.log('   3. Integre com as rotas da API');
    console.log('   4. Implemente sistema de escrow completo\n');

  } catch (error) {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Execução concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

// Exportar exemplos individuais
export {
  exemplo1_CriarCarteira,
  exemplo2_ImportarCarteira,
  exemplo3_ConsultarSaldo,
  exemplo4_EnviarTransacao,
  exemplo5_ValidarIdentity,
  exemplo6_CenarioEscrow
};
