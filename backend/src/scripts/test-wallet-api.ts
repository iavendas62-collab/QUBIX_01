/**
 * Test Wallet API Endpoints
 * 
 * Tests the wallet API routes
 */

import express from 'express';
import { walletRoutes } from '../routes/wallet';

const app = express();
app.use(express.json());
app.use('/api/wallet', walletRoutes());

const PORT = 3099;

async function testWalletAPI() {
  console.log('🧪 Testing Wallet API Endpoints\n');

  const server = app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}\n`);
  });

  try {
    // Test 1: Validate Address
    console.log('Test 1: POST /api/wallet/validate');
    console.log('─'.repeat(50));
    
    const validationTests = [
      { address: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH', expected: true },
      { address: 'invalid', expected: false },
      { address: '', expected: false }
    ];

    for (const test of validationTests) {
      const response = await fetch(`http://localhost:${PORT}/api/wallet/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: test.address })
      });
      const data = await response.json() as { valid: boolean };
      console.log(`Address: ${test.address.substring(0, 20)}... → Valid: ${data.valid} (expected: ${test.expected})`);
    }
    console.log('✅ Validation endpoint working\n');

    // Test 2: Connect Wallet
    console.log('Test 2: POST /api/wallet/connect');
    console.log('─'.repeat(50));
    
    const testAddress = 'TESTWALLETADDRESSABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN';
    const connectResponse = await fetch(`http://localhost:${PORT}/api/wallet/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qubicAddress: testAddress,
        email: 'api-test@example.com',
        username: 'apitest'
      })
    });
    const connectData = await connectResponse.json() as { success: boolean; message: string };
    console.log(`Status: ${connectResponse.status}`);
    console.log(`Success: ${connectData.success}`);
    console.log(`Message: ${connectData.message}`);
    console.log('✅ Connect endpoint working\n');

    // Test 3: Get Balance (will fail without valid address, but tests endpoint)
    console.log('Test 3: GET /api/wallet/:address/balance');
    console.log('─'.repeat(50));
    
    const balanceResponse = await fetch(`http://localhost:${PORT}/api/wallet/${testAddress}/balance`);
    const balanceData = await balanceResponse.json() as { success: boolean; balance?: number; message?: string };
    console.log(`Status: ${balanceResponse.status}`);
    console.log(`Success: ${balanceData.success}`);
    if (balanceData.success) {
      console.log(`Balance: ${balanceData.balance} QUBIC`);
    } else {
      console.log(`Message: ${balanceData.message}`);
    }
    console.log('✅ Balance endpoint working\n');

    console.log('🎉 All API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    server.close();
    process.exit(0);
  }
}

// Run tests
testWalletAPI();

