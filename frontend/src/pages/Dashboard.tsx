import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get('/api/stats');
      return res.data;
    }
  });

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Qubix Compute Hub</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Jobs"
          value={stats?.jobs.total || 0}
          subtitle={`${stats?.jobs.active || 0} active`}
        />
        <StatCard
          title="Active Providers"
          value={stats?.providers.active || 0}
          subtitle={`${stats?.providers.total || 0} total`}
        />
        <StatCard
          title="AI Models"
          value={stats?.models.total || 0}
          subtitle="Available"
        />
        <StatCard
          title="Network Compute"
          value={`${stats?.network.availableCompute || 0} TFLOPS`}
          subtitle="Available"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20">
          <h2 className="text-xl font-bold mb-4">What is Qubix?</h2>
          <p className="text-gray-300 mb-4">
            Qubix is the first decentralized AI compute marketplace built natively on Qubic.
            We connect miners with idle compute power to developers and enterprises who need
            to train AI models.
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Leverages Qubic's Outsourced Computations</li>
            <li>✅ Decentralized job matching & escrow</li>
            <li>✅ Cross-chain bridges to Ethereum & Solana</li>
            <li>✅ Model hub for sharing trained models</li>
          </ul>
        </div>

        <div className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20">
          <h2 className="text-xl font-bold mb-4">Quick Start</h2>
          <div className="space-y-4">
            <QuickAction
              title="Submit a Job"
              description="Train or run inference on AI models"
              link="/jobs/submit"
            />
            <QuickAction
              title="Become a Provider"
              description="Rent out your compute power"
              link="/provider"
            />
            <QuickAction
              title="Browse Models"
              description="Discover pre-trained AI models"
              link="/models"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: any) {
  return (
    <div className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20">
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold text-qubic-primary mb-1">{value}</p>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
}

function QuickAction({ title, description, link }: any) {
  return (
    <a
      href={link}
      className="block p-4 bg-qubic-darker rounded-lg border border-qubic-primary/10 hover:border-qubic-primary/30 transition"
    >
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </a>
  );
}

