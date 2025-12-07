/**
 * JobWizard Demo Page
 * Demonstrates the 4-step job submission wizard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobWizard, Job } from '../components/JobWizard';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function JobWizardDemo() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(true);

  const handleJobLaunched = (job: Job) => {
    console.log('Job launched:', job);
    
    // In production, navigate to job monitor
    setTimeout(() => {
      alert(`Job ${job.id} launched successfully! In production, you would be redirected to the job monitor.`);
      setShowWizard(false);
    }, 1000);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      setShowWizard(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Home
              </Button>
              <div className="h-6 w-px bg-slate-700" />
              <h1 className="text-xl font-bold text-white">Job Submission Wizard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {showWizard ? (
          <JobWizard
            onJobLaunched={handleJobLaunched}
            onCancel={handleCancel}
          />
        ) : (
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Wizard Completed or Cancelled</h2>
            <p className="text-slate-400 mb-6">
              The job wizard has been completed or cancelled.
            </p>
            <Button onClick={() => setShowWizard(true)}>
              Start New Job
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

