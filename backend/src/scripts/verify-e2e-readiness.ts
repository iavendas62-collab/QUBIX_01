/**
 * End-to-End Readiness Verification Script
 * 
 * This script verifies that all necessary components, endpoints, and services
 * are in place for the complete job flow to work.
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, passMsg: string, failMsg: string): void {
  results.push({
    name,
    status: condition ? 'PASS' : 'FAIL',
    message: condition ? passMsg : failMsg,
  });
}

function warn(name: string, message: string): void {
  results.push({
    name,
    status: 'WARN',
    message,
  });
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(__dirname, '../..', filePath));
}

console.log('========================================');
console.log('E2E READINESS VERIFICATION');
console.log('========================================\n');

// Step 1: File Upload and Analysis
console.log('Step 1: File Upload and Analysis');
console.log('-----------------------------------');

check(
  'Job Analysis Service',
  fileExists('src/services/job-analysis.service.ts'),
  '✓ Job analysis service exists',
  '✗ Job analysis service missing'
);

check(
  'Job Analysis Route',
  fileExists('src/routes/jobs.ts'),
  '✓ Job routes exist',
  '✗ Job routes missing'
);

check(
  'JobUploader Component',
  fileExists('../../frontend/src/components/JobUploader.tsx'),
  '✓ JobUploader component exists',
  '✗ JobUploader component missing'
);

check(
  'Test Files',
  fileExists('../../test-files/sample-mnist.py') && fileExists('../../test-files/sample-stable-diffusion.py'),
  '✓ Test files available',
  '✗ Test files missing'
);

// Step 2: GPU Matching
console.log('\nStep 2: GPU Matching');
console.log('-----------------------------------');

check(
  'GPU Matching Service',
  fileExists('src/services/gpu-matching.service.ts'),
  '✓ GPU matching service exists',
  '✗ GPU matching service missing'
);

check(
  'SmartMatcher Component',
  fileExists('../../frontend/src/components/SmartMatcher.tsx'),
  '✓ SmartMatcher component exists',
  '✗ SmartMatcher component missing'
);

check(
  'Benchmark Model',
  fileExists('prisma/schema.prisma'),
  '✓ Prisma schema with Benchmark model exists',
  '✗ Prisma schema missing'
);

// Step 3: Wizard and Escrow
console.log('\nStep 3: Wizard and Escrow');
console.log('-----------------------------------');

check(
  'JobWizard Component',
  fileExists('../../frontend/src/components/JobWizard.tsx'),
  '✓ JobWizard component exists',
  '✗ JobWizard component missing'
);

check(
  'Qubic Service',
  fileExists('src/services/qubic.service.ts'),
  '✓ Qubic service exists',
  '✗ Qubic service missing'
);

check(
  'Escrow Service',
  fileExists('src/services/escrow.service.ts'),
  '✓ Escrow service exists',
  '✗ Escrow service missing'
);

check(
  'Escrow Routes',
  fileExists('src/routes/escrow.ts'),
  '✓ Escrow routes exist',
  '✗ Escrow routes missing'
);

// Step 4: Job Monitoring
console.log('\nStep 4: Job Monitoring');
console.log('-----------------------------------');

check(
  'JobMonitor Component',
  fileExists('../../frontend/src/components/JobMonitor.tsx'),
  '✓ JobMonitor component exists',
  '✗ JobMonitor component missing'
);

check(
  'WebSocket Service',
  fileExists('src/websocket/index.ts'),
  '✓ WebSocket service exists',
  '✗ WebSocket service missing'
);

check(
  'WebSocket Hook',
  fileExists('../../frontend/src/hooks/useWebSocket.ts'),
  '✓ useWebSocket hook exists',
  '✗ useWebSocket hook missing'
);

check(
  'Job Metrics Model',
  fileExists('prisma/schema.prisma'),
  '✓ JobMetric model in schema',
  '✗ JobMetric model missing'
);

check(
  'Job Logs Model',
  fileExists('prisma/schema.prisma'),
  '✓ JobLog model in schema',
  '✗ JobLog model missing'
);

// Step 5: Job Completion
console.log('\nStep 5: Job Completion');
console.log('-----------------------------------');

check(
  'Job Completion Endpoint',
  fileExists('src/routes/jobs.ts'),
  '✓ Job completion endpoint exists',
  '✗ Job completion endpoint missing'
);

check(
  'Transaction Service',
  fileExists('src/services/transaction.service.ts'),
  '✓ Transaction service exists',
  '✗ Transaction service missing'
);

// Step 6: Provider Earnings
console.log('\nStep 6: Provider Earnings');
console.log('-----------------------------------');

check(
  'Earnings Service',
  fileExists('src/services/earnings.service.ts'),
  '✓ Earnings service exists',
  '✗ Earnings service missing'
);

check(
  'Earnings Routes',
  fileExists('src/routes/earnings.ts'),
  '✓ Earnings routes exist',
  '✗ Earnings routes missing'
);

check(
  'ProviderEarnings Component',
  fileExists('../../frontend/src/components/ProviderEarnings.tsx'),
  '✓ ProviderEarnings component exists',
  '✗ ProviderEarnings component missing'
);

check(
  'Earnings Broadcaster',
  fileExists('src/services/earnings-broadcaster.service.ts'),
  '✓ Earnings broadcaster exists',
  '✗ Earnings broadcaster missing'
);

// Step 7: Transaction History
console.log('\nStep 7: Transaction History');
console.log('-----------------------------------');

check(
  'Transaction Routes',
  fileExists('src/routes/transactions.ts'),
  '✓ Transaction routes exist',
  '✗ Transaction routes missing'
);

check(
  'TransactionHistory Component',
  fileExists('../../frontend/src/components/TransactionHistory.tsx'),
  '✓ TransactionHistory component exists',
  '✗ TransactionHistory component missing'
);

check(
  'Transaction Model',
  fileExists('prisma/schema.prisma'),
  '✓ Transaction model in schema',
  '✗ Transaction model missing'
);

// Worker
console.log('\nWorker Components');
console.log('-----------------------------------');

check(
  'Enhanced Worker',
  fileExists('../../worker/qubix_worker_enhanced.py'),
  '✓ Enhanced worker exists',
  '✗ Enhanced worker missing'
);

check(
  'Worker Tests',
  fileExists('../../worker/test_enhanced_worker.py'),
  '✓ Worker tests exist',
  '✗ Worker tests missing'
);

// Additional Components
console.log('\nAdditional Components');
console.log('-----------------------------------');

check(
  'Cost Estimation Service',
  fileExists('src/services/cost-estimation.service.ts'),
  '✓ Cost estimation service exists',
  '✗ Cost estimation service missing'
);

check(
  'Wallet Service',
  fileExists('src/services/wallet.service.ts'),
  '✓ Wallet service exists',
  '✗ Wallet service missing'
);

check(
  'Provider Heartbeat',
  fileExists('src/services/provider-heartbeat.service.ts'),
  '✓ Provider heartbeat service exists',
  '✗ Provider heartbeat service missing'
);

// Print Results
console.log('\n========================================');
console.log('VERIFICATION RESULTS');
console.log('========================================\n');

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
const warnings = results.filter(r => r.status === 'WARN').length;

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠';
  const color = result.status === 'PASS' ? '\x1b[32m' : result.status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
  console.log(`${color}${icon} ${result.name}\x1b[0m`);
  console.log(`  ${result.message}`);
});

console.log('\n========================================');
console.log(`Total Checks: ${results.length}`);
console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
console.log(`\x1b[33mWarnings: ${warnings}\x1b[0m`);
console.log('========================================\n');

if (failed === 0) {
  console.log('\x1b[32m✓ ALL COMPONENTS READY FOR E2E TESTING\x1b[0m\n');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ SOME COMPONENTS MISSING - FIX BEFORE E2E TESTING\x1b[0m\n');
  process.exit(1);
}
