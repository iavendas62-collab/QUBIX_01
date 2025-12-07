import { Link } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-qubic-darker">
      <nav className="bg-qubic-dark border-b border-qubic-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-qubic-primary">QUBIX</span>
                <span className="ml-2 text-sm text-gray-400">Compute Hub</span>
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link to="/" className="text-gray-300 hover:text-qubic-primary px-3 py-2">
                  Dashboard
                </Link>
                <Link to="/jobs/submit" className="text-gray-300 hover:text-qubic-primary px-3 py-2">
                  Submit Job
                </Link>
                <Link to="/jobs" className="text-gray-300 hover:text-qubic-primary px-3 py-2">
                  My Jobs
                </Link>
                <Link to="/provider" className="text-gray-300 hover:text-qubic-primary px-3 py-2">
                  Provider
                </Link>
                <Link to="/models" className="text-gray-300 hover:text-qubic-primary px-3 py-2">
                  Model Hub
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button className="bg-qubic-primary text-qubic-dark px-4 py-2 rounded-lg font-semibold hover:bg-qubic-primary/90">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
