/**
 * JobUploader Demo Page
 * Demonstrates the JobUploader component functionality
 */

import { useState } from 'react';
import { JobUploader, JobAnalysis } from '../components/JobUploader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export function JobUploaderDemo() {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileAnalyzed = (analysisResult: JobAnalysis, file: File) => {
    console.log('File analyzed:', analysisResult, file);
    setAnalysis(analysisResult);
    setUploadedFile(file);
  };

  const handleError = (error: Error) => {
    console.error('Upload error:', error);
  };

  const handleNext = () => {
    console.log('Proceeding to next step with:', { analysis, uploadedFile });
    // In a real wizard, this would navigate to the next step
    alert('In a real implementation, this would proceed to GPU selection step');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Job Submission
          </h1>
          <p className="text-slate-400">
            Upload your script or dataset to get started
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-semibold">
              1
            </div>
            <span className="text-white font-medium">Upload & Analysis</span>
          </div>
          
          <div className="w-12 h-0.5 bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-semibold">
              2
            </div>
            <span className="text-slate-400">GPU Selection</span>
          </div>
          
          <div className="w-12 h-0.5 bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-semibold">
              3
            </div>
            <span className="text-slate-400">Configuration</span>
          </div>
          
          <div className="w-12 h-0.5 bg-slate-700" />
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-semibold">
              4
            </div>
            <span className="text-slate-400">Launch</span>
          </div>
        </div>

        {/* JobUploader Component */}
        <JobUploader
          onFileAnalyzed={handleFileAnalyzed}
          onError={handleError}
        />

        {/* Next Step Button */}
        {analysis && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Continue to GPU Selection
            </Button>
          </div>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-semibold">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Upload Your File</p>
                <p className="text-sm text-slate-400">
                  Drag and drop your Python script (.py), Jupyter notebook (.ipynb), 
                  dataset (.csv), or Dockerfile into the upload zone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-semibold">2</span>
              </div>
              <div>
                <p className="text-white font-medium">Automatic Analysis</p>
                <p className="text-sm text-slate-400">
                  The system will automatically detect your job type, framework, 
                  and calculate GPU requirements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-semibold">3</span>
              </div>
              <div>
                <p className="text-white font-medium">Review Results</p>
                <p className="text-sm text-slate-400">
                  Check the analysis results to ensure the detected requirements 
                  match your expectations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-semibold">4</span>
              </div>
              <div>
                <p className="text-white font-medium">Continue to Next Step</p>
                <p className="text-sm text-slate-400">
                  Once analysis is complete, proceed to GPU selection to find 
                  the best match for your job.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Files Info */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📁</div>
              <div className="flex-1">
                <p className="text-white font-medium mb-1">Supported File Types</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                  <div>• Python Scripts (.py)</div>
                  <div>• Jupyter Notebooks (.ipynb)</div>
                  <div>• CSV Datasets (.csv)</div>
                  <div>• JSON Data (.json)</div>
                  <div>• Dockerfiles</div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Maximum file size: 500MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
