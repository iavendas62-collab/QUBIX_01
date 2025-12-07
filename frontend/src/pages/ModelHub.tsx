import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function ModelHub() {
  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await axios.get('/api/models');
      return res.data;
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Model Hub</h1>
        <button className="bg-qubic-primary text-qubic-dark px-6 py-2 rounded-lg font-semibold hover:bg-qubic-primary/90">
          Publish Model
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models?.map((model: any) => (
          <div
            key={model.id}
            className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20 hover:border-qubic-primary/40 transition"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{model.name}</h3>
              <span className="text-xs bg-qubic-primary/20 text-qubic-primary px-2 py-1 rounded">
                {model.modelType}
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {model.description}
            </p>

            <div className="flex justify-between items-center text-sm mb-4">
              <span className="text-gray-400">
                {model.downloads} downloads
              </span>
              <span className="text-qubic-primary font-semibold">
                {model.price} QUBIC
              </span>
            </div>

            <button className="w-full bg-qubic-darker border border-qubic-primary/20 py-2 rounded-lg hover:border-qubic-primary/40 transition">
              Download
            </button>
          </div>
        ))}

        {!models || models.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No models available yet. Be the first to publish!
          </div>
        )}
      </div>
    </div>
  );
}

