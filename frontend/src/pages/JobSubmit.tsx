import { useState } from 'react';
import axios from 'axios';

export function JobSubmit() {
  const [formData, setFormData] = useState({
    modelType: 'gpt2',
    dataset: '',
    computeNeeded: 10,
    budget: 100
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await axios.post('/api/jobs/submit', formData);
      setResult(res.data);
    } catch (error) {
      console.error('Job submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit Compute Job</h1>

      {result ? (
        <div className="bg-green-900/20 border border-green-500 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Job Submitted!</h2>
          <p className="text-gray-300 mb-4">Job ID: {result.jobId}</p>
          <a
            href={`/jobs`}
            className="text-qubic-primary hover:underline"
          >
            View your jobs →
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Model Type</label>
            <select
              value={formData.modelType}
              onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
              className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
            >
              <option value="gpt2">GPT-2</option>
              <option value="llama">LLaMA</option>
              <option value="stable-diffusion">Stable Diffusion</option>
              <option value="bert">BERT</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Dataset URL</label>
            <input
              type="text"
              value={formData.dataset}
              onChange={(e) => setFormData({ ...formData, dataset: e.target.value })}
              placeholder="https://example.com/dataset.csv"
              className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Compute Needed (TFLOPS)
            </label>
            <input
              type="number"
              value={formData.computeNeeded}
              onChange={(e) => setFormData({ ...formData, computeNeeded: parseInt(e.target.value) })}
              className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Budget (QUBIC)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              className="w-full bg-qubic-darker border border-qubic-primary/20 rounded-lg px-4 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-qubic-primary text-qubic-dark font-semibold py-3 rounded-lg hover:bg-qubic-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Job'}
          </button>
        </form>
      )}
    </div>
  );
}
