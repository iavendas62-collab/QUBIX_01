/**
 * Test Script for Qubic Integration
 * 
 * Tests the three critical steps:
 * - ETAPA 4: Create wallet
 * - ETAPA 5: Send transaction
 * - ETAPA 8: Query balance
 */

import qubicWallet from '../services/qubic-wallet';
import * as dotenv from 'dotenv';

dotenv.config();

async function testWalletCreation() {
  console.log('\n=== ETAPA 4: WALLET CREATION ===\n');

  try {
    // Create new wallet
    const wallet = await qubicWallet.createWallet();

    console.log('\n📋 Wallet Details:');
    console.log(`   Identity: ${wallet.identity}`);
    console.log(`   Seed: ${wallet.seed}`);
    console.log(`   Index: ${wallet.index}`);
    console.log('\n⚠️  IMPORTANT: Save this seed phrase securely!');
    console.log('   You will need it to access your funds.\n');

    return wallet;
  } catch (error) {
    console.error('❌ Wallet creation failed:', error);
    throw error;
  }
}

async function testBalanceQuery(identity: string) {
  console.log('\n=== ETAPA 8: BALANCE QUERY ===\n');

  try {
    // Initialize client
    await qubicWallet.initializeClient();

    // Wait a bit for connection
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get balance
    const balance = await qubicWallet.getBalance(identity);

    console.log('\n💰 Balance Information:');
    console.log(`   Identity: ${balance.identity}`);
    console.log(`   Balance: ${balance.energyQubic} QUBIC`);
    console.log(`   Raw: ${balance.energy.toString()} units`);

    return balance;
  } catch (error) {
    console.error('❌ Balance query failed:', error);
    throw error;
  }
}

async function testTransaction(fromSeed: string, toIdentity: string, amountQubic: number) {
  console.log('\n=== ETAPA 5: SEND TRANSACTION ===\n');

  try {
    // Convert amount to smallest unit
    const amount = qubicWallet.toSmallestUnit(amountQubic);

    console.log(`\n📤 Transaction Details:`);
    console.log(`   To: ${toIdentity}`);
    console.log(`   Amount: ${amountQubic} QUBIC`);

    // Send transaction
    const result = await qubicWallet.sendTransaction(fromSeed, toIdentity, amount);

    console.log('\n✅ Transaction Sent:');
    console.log(`   TX Hash: ${result.hash}`);
    console.log(`   From: ${result.from}`);
    console.log(`   To: ${result.to}`);
    console.log(`   Amount: ${qubicWallet.toQubic(result.amount)} QUBIC`);

    return result;
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    throw error;
  }
}

async function testTransactionStatus(txHash: string) {
  console.log('\n=== TRANSACTION STATUS CHECK ===\n');

  try {
    const status = await qubicWallet.getTransactionStatus(txHash);

    console.log('\n📊 Transaction Status:');
    console.log(JSON.stringify(status, null, 2));

    return status;
  } catch (error) {
    console.error('❌ Status check failed:', error);
    throw error;
  }
}

// Main test flow
async function main() {
  console.log('🚀 Starting Qubic Integration Tests\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Create wallet
    const wallet = await testWalletCreation();

    // Test 2: Query balance (will be 0 for new wallet)
    await testBalanceQuery(wallet.identity);

    // Close connector
    await qubicWallet.close();

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Basic tests completed!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Fund your wallet using Qubic testnet faucet');
    console.log('   2. Run transaction test with funded wallet');
    console.log('   3. Check transaction status\n');

    // Uncomment these when you have a funded wallet:
    /*
    console.log('\n' + '='.repeat(50));
    
    // Test 3: Send transaction (requires funded wallet)
    const tx = await testTransaction(
      wallet.seed,
      'RECIPIENT_IDENTITY_HERE', // Replace with actual identity
      0.1 // Send 0.1 QUBIC
    );

    // Test 4: Check transaction status
    await testTransactionStatus(tx.hash);
    
    // Close connector
    await qubicWallet.close();
    */

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    await qubicWallet.close();
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { testWalletCreation, testBalanceQuery, testTransaction, testTransactionStatus };
