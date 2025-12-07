/**
 * ProviderEarnings Demo Page
 * 
 * Demonstrates the ProviderEarnings component with sample data
 */

import { useState } from 'react';
import ProviderEarnings from '../components/ProviderEarnings';

export default function ProviderEarningsDemo() {
  const [qubicAddress, setQubicAddress] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  // Sample Qubic address for demo
  const sampleAddress = 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH';

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {!showDemo ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <h1 className="text-3xl font-bold mb-4">Provider Earnings Dashboard Demo</h1>
              <p className="text-slate-400 mb-6">
                Enter your Qubic address to view your earnings dashboard, or use the sample address to see a demo.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Qubic Address
                  </label>
                  <input
                    type="text"
                    value={qubicAddress}
                    onChange={(e) => setQubicAddress(e.target.value)}
                    placeholder="Enter your 60-character Qubic address"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDemo(true)}
                    disabled={!qubicAddress}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    View Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setQubicAddress(sampleAddress);
                      setShowDemo(true);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Use Sample Address
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">Features:</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Real-time earnings tracking</li>
                  <li>• Live active jobs with earnings counter</li>
                  <li>• 30-day earnings history chart</li>
                  <li>• Transaction history with blockchain links</li>
                  <li>• Performance metrics (uptime, jobs completed)</li>
                  <li>• Auto-refresh every 30 seconds</li>
                  <li>• WebSocket live updates</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowDemo(false)}
              className="mb-6 text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Setup
            </button>
            <ProviderEarnings qubicAddress={qubicAddress} />
          </div>
        )}
      </div>
    </div>
  );
}
