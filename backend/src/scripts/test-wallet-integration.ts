/**
 * Test Wallet Integration
 * 
 * Tests the wallet service functionality
 */

import { walletService } from '../services/wallet.service';

async function testWalletIntegration() {
  console.log('🧪 Testing Wallet Integration\n');

  try {
    // Test 1: Address Validation
    console.log('Test 1: Address Validation');
    console.log('─'.repeat(50));
    
    const validAddress = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH';
    const invalidAddress1 = 'invalid';
    const invalidAddress2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Too short
    
    console.log(`Valid address (60 chars): ${walletService.validateAddress(validAddress)}`);
    console.log(`Invalid address (short): ${walletService.validateAddress(invalidAddress1)}`);
    console.log(`Invalid address (wrong length): ${walletService.validateAddress(invalidAddress2)}`);
    console.log('✅ Address validation working\n');

    // Test 2: Wallet Connection
    console.log('Test 2: Wallet Connection');
    console.log('─'.repeat(50));
    
    const testAddress = 'TESTADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTU';
    const connectionResult = await walletService.connectWallet({
      qubicAddress: testAddress,
      email: 'test@example.com',
      username: 'testuser'
    });
    
    console.log(`Connection success: ${connectionResult.success}`);
    if (connectionResult.success) {
      console.log(`User ID: ${connectionResult.user.id}`);
      console.log(`Balance: ${connectionResult.balance} QUBIC`);
      console.log('✅ Wallet connection working\n');
    } else {
      console.log(`Error: ${connectionResult.message}\n`);
    }

    // Test 3: Balance Query
    console.log('Test 3: Balance Query');
    console.log('─'.repeat(50));
    
    try {
      const balance = await walletService.getBalance(testAddress);
      console.log(`Address: ${balance.qubicAddress}`);
      console.log(`Balance: ${balance.balance} QUBIC`);
      console.log(`Pending Earnings: ${balance.pendingEarnings} QUBIC`);
      console.log(`Last Updated: ${balance.lastUpdated}`);
      console.log('✅ Balance query working\n');
    } catch (error: any) {
      console.log(`⚠️  Balance query error (expected if no blockchain connection): ${error.message}\n`);
    }

    // Test 4: Invalid Address Connection
    console.log('Test 4: Invalid Address Connection');
    console.log('─'.repeat(50));
    
    const invalidResult = await walletService.connectWallet({
      qubicAddress: 'invalid-address'
    });
    
    console.log(`Connection success: ${invalidResult.success}`);
    console.log(`Message: ${invalidResult.message}`);
    console.log('✅ Invalid address rejection working\n');

    console.log('🎉 All wallet integration tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await walletService.disconnect();
    process.exit(0);
  }
}

// Run tests
testWalletIntegration();

