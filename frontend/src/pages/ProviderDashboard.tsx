import { useState } from 'react';
import axios from 'axios';

export function ProviderDashboard() {
  const [formData, setFormData] = useState({
    address: '',
    computePower: 100,
    pricePerHour: 10
  });
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/providers/register', formData);
      setRegistered(true);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Provider Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20">
          <h2 className="text-xl font-bold mb-4">Become a Provider</h2>
          <p className="text-gray-300 mb-6">
            Rent out your idle compute power and earn QUBIC tokens.
          </p>

          {registered ? (
            <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg">
              <p className="text-green-400 font-semibold">✅ Successfully registered!</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="QUBIC address"
                  className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Compute Power (TFLOPS)
                </label>
                <input
                  type="number"
                  value={formData.computePower}
                  onChange={(e) => setFormData({ ...formData, computePower: parseInt(e.target.value) })}
                  className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price (QUBIC/hour)
                </label>
                <input
                  type="number"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) })}
                  className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-qubic-primary text-qubic-dark font-semibold py-3 rounded-lg hover:bg-qubic-primary/90"
              >
                Register as Provider
              </button>
            </form>
          )}
        </div>

        <div className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20">
          <h2 className="text-xl font-bold mb-4">Provider Benefits</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-qubic-primary mr-2">💰</span>
              <span>Earn passive income from idle compute</span>
            </li>
            <li className="flex items-start">
              <span className="text-qubic-primary mr-2">🔒</span>
              <span>Secure escrow payments via smart contracts</span>
            </li>
            <li className="flex items-start">
              <span className="text-qubic-primary mr-2">⭐</span>
              <span>Build reputation for better job matching</span>
            </li>
            <li className="flex items-start">
              <span className="text-qubic-primary mr-2">📊</span>
              <span>Real-time monitoring and analytics</span>
            </li>
            <li className="flex items-start">
              <span className="text-qubic-primary mr-2">🚀</span>
              <span>Early access to new features</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

