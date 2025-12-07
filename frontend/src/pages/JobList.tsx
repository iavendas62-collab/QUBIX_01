import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function JobList() {
  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await axios.get('/api/jobs/user/anonymous');
      return res.data;
    }
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Jobs</h1>

      <div className="space-y-4">
        {jobs?.map((job: any) => (
          <div
            key={job.id}
            className="bg-qubic-dark p-6 rounded-lg border border-qubic-primary/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{job.modelType}</h3>
                <p className="text-sm text-gray-400">Job ID: {job.id}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Compute</p>
                <p className="font-semibold">{job.computeNeeded} TFLOPS</p>
              </div>
              <div>
                <p className="text-gray-400">Budget</p>
                <p className="font-semibold">{job.budget} QUBIC</p>
              </div>
              <div>
                <p className="text-gray-400">Created</p>
                <p className="font-semibold">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Provider</p>
                <p className="font-semibold">
                  {job.providerId ? 'Matched' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {!jobs || jobs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No jobs yet. <a href="/jobs/submit" className="text-qubic-primary hover:underline">Submit your first job</a>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    PENDING: 'bg-yellow-900/20 text-yellow-400 border-yellow-400/20',
    MATCHED: 'bg-blue-900/20 text-blue-400 border-blue-400/20',
    RUNNING: 'bg-purple-900/20 text-purple-400 border-purple-400/20',
    COMPLETED: 'bg-green-900/20 text-green-400 border-green-400/20',
    FAILED: 'bg-red-900/20 text-red-400 border-red-400/20',
    CANCELLED: 'bg-gray-900/20 text-gray-400 border-gray-400/20'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
      {status}
    </span>
  );
}

