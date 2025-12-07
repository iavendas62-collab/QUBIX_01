/**
 * Test Auth MVP
 * Tests the complete email/password authentication flow
 */

import { testCrypto, encryptSeed, decryptSeed } from '../utils/crypto';
import qubicWallet from '../services/qubic-wallet';

async function testAuthMVP() {
  console.log('🧪 Testing Auth MVP Components\n');

  // Test 1: Crypto utilities
  console.log('1️⃣ Testing Crypto Utilities...');
  const cryptoTest = testCrypto();
  if (!cryptoTest) {
    console.error('❌ Crypto test failed!');
    process.exit(1);
  }
  console.log('✅ Crypto utilities working correctly\n');

  // Test 2: Wallet creation
  console.log('2️⃣ Testing Wallet Creation...');
  try {
    const wallet = await qubicWallet.createWallet();
    console.log('✅ Wallet created successfully');
    console.log(`   Identity: ${wallet.identity}`);
    console.log(`   Seed: ${wallet.seed.substring(0, 20)}...\n`);

    // Test 3: Seed encryption/decryption
    console.log('3️⃣ Testing Seed Encryption...');
    const testPassword = 'TestPassword123!';
    const encrypted = encryptSeed(wallet.seed, testPassword);
    console.log('✅ Seed encrypted');
    console.log(`   Encrypted length: ${encrypted.length} chars\n`);

    console.log('4️⃣ Testing Seed Decryption...');
    const decrypted = decryptSeed(encrypted, testPassword);
    if (decrypted !== wallet.seed) {
      console.error('❌ Decrypted seed does not match original!');
      process.exit(1);
    }
    console.log('✅ Seed decrypted correctly\n');

    // Test 4: Wrong password
    console.log('5️⃣ Testing Wrong Password...');
    try {
      decryptSeed(encrypted, 'WrongPassword');
      console.error('❌ Should have failed with wrong password!');
      process.exit(1);
    } catch (error) {
      console.log('✅ Correctly rejected wrong password\n');
    }

    // Test 5: Wallet import
    console.log('6️⃣ Testing Wallet Import...');
    const importedWallet = await qubicWallet.importWallet(wallet.seed);
    if (importedWallet.identity !== wallet.identity) {
      console.error('❌ Imported wallet identity does not match!');
      process.exit(1);
    }
    console.log('✅ Wallet imported correctly\n');

    console.log('🎉 All Auth MVP tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Crypto utilities working');
    console.log('   ✅ Wallet creation working');
    console.log('   ✅ Seed encryption working');
    console.log('   ✅ Seed decryption working');
    console.log('   ✅ Wrong password rejection working');
    console.log('   ✅ Wallet import working');
    console.log('\n🚀 Ready for registration and login!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAuthMVP().catch(console.error);
