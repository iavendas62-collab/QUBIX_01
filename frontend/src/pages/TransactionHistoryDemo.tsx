/**
 * TransactionHistory Demo Page
 * 
 * Demonstrates the transaction history display with mock data
 */

import { useState } from 'react';
import TransactionHistory from '../components/TransactionHistory';
import TransactionDetails from '../components/TransactionDetails';

interface Transaction {
  id: string;
  type: 'PAYMENT' | 'EARNING' | 'REFUND' | 'ESCROW_LOCK' | 'ESCROW_RELEASE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  qubicTxHash: string | null;
  createdAt: string;
  completedAt: string | null;
  job?: {
    id: string;
    modelType: string;
    status: string;
  } | null;
}

export default function TransactionHistoryDemo() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Mock Qubic address for demo
  const demoAddress = 'EEMHHBHCOAIAFALOICNMMDNGJIAOLGCGFKIBMBDCBDKNGHLNNABCJLIKEEKDGBEFLFPHGO';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Transaction History Demo</h1>
          <p className="text-slate-400">
            Comprehensive transaction history with pagination, filtering, and blockchain verification
          </p>
        </div>

        {/* Features List */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Features Demonstrated</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Pagination</div>
                <div className="text-sm text-slate-400">Navigate through large transaction lists</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Filtering</div>
                <div className="text-sm text-slate-400">Filter by type, status, and date range</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Blockchain Links</div>
                <div className="text-sm text-slate-400">Direct links to Qubic explorer</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Auto-Refresh</div>
                <div className="text-sm text-slate-400">Automatic updates for pending transactions</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Transaction Details</div>
                <div className="text-sm text-slate-400">Click any row to see full details</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Status Indicators</div>
                <div className="text-sm text-slate-400">Visual feedback for pending/completed/failed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Coverage */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Requirements Coverage</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-400">10.1 - Display all payments, earnings, and refunds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-400">10.2 - Show date, amount, type, and status for each transaction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-400">10.3 - Provide clickable links to Qubic explorer</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-400">10.4 - Show pending status with estimated confirmation time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-400">10.5 - Auto-update when transaction confirms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span className="text-slate-400">10.6 - Support filtering by type and date range</span>
            </div>
          </div>
        </div>

        {/* Demo Component */}
        <TransactionHistory 
          qubicAddress={demoAddress}
          onTransactionClick={setSelectedTransaction}
        />

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <TransactionDetails
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}

        {/* Usage Instructions */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Instructions</h2>
          <div className="space-y-3 text-sm text-slate-400">
            <p>1. <strong className="text-slate-300">Click the Filters button</strong> to show/hide filtering options</p>
            <p>2. <strong className="text-slate-300">Select filters</strong> to narrow down transactions by type, status, or date range</p>
            <p>3. <strong className="text-slate-300">Click any transaction row</strong> to view detailed information in a modal</p>
            <p>4. <strong className="text-slate-300">Click "View" in the Blockchain column</strong> to open the transaction in Qubic Explorer</p>
            <p>5. <strong className="text-slate-300">Use pagination controls</strong> at the bottom to navigate through pages</p>
            <p>6. <strong className="text-slate-300">Click Refresh</strong> to manually update the transaction list</p>
            <p>7. <strong className="text-slate-300">Pending transactions</strong> will auto-refresh every 10 seconds</p>
          </div>
        </div>

        {/* Integration Code */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Code</h2>
          <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-cyan-400">{`import TransactionHistory from './components/TransactionHistory';
import TransactionDetails from './components/TransactionDetails';

function MyComponent() {
  const [selectedTx, setSelectedTx] = useState(null);
  const qubicAddress = 'YOUR_QUBIC_ADDRESS';

  return (
    <>
      <TransactionHistory 
        qubicAddress={qubicAddress}
        onTransactionClick={setSelectedTx}
      />
      
      {selectedTx && (
        <TransactionDetails
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </>
  );
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

