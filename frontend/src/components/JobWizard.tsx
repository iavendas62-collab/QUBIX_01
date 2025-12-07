/**
 * JobWizard Component
 * 4-step wizard for job configuration and launch
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 12.4
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Cpu, 
  Settings, 
  Wallet, 
  ChevronRight, 
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { notify } from './ui';
import { JobUploader, JobAnalysis } from './JobUploader';
import { SmartMatcher, Provider } from './SmartMatcher';
import { API_BASE_URL } from '../config';
import { wizardStepVariants, fadeIn } from '../utils/animations';

// Advanced configuration interface
export interface AdvancedConfig {
  environmentVars: Record<string, string>;
  dockerImage?: string;
  entryPoint?: string;
  outputDestination: 'ipfs' | 's3' | 'local';
  maxDuration: number; // hours
}

// Job interface
export interface Job {
  id: string;
  userId: string;
  providerId: string;
  jobType: string;
  status: string;
  estimatedCost: number;
  escrowTxHash?: string;
}

export interface JobWizardProps {
  onJobLaunched: (job: Job) => void;
  onCancel: () => void;
}

// Escrow status interface
interface EscrowStatus {
  txHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  status: 'creating' | 'pending' | 'confirming' | 'confirmed' | 'failed';
  error?: string;
  explorerUrl?: string;
}

// Wizard state interface
interface JobWizardState {
  currentStep: 1 | 2 | 3 | 4;
  jobAnalysis: JobAnalysis | null;
  uploadedFile: File | null;
  selectedGPU: Provider | null;
  advancedConfig: AdvancedConfig;
  estimatedCost: number;
  walletBalance: number;
  launchStatus: 'idle' | 'creating_escrow' | 'confirming_tx' | 'provisioning' | 'launched';
  availableGPUs: Provider[];
  loadingGPUs: boolean;
  escrowStatus: EscrowStatus | null;
}

const DEFAULT_ADVANCED_CONFIG: AdvancedConfig = {
  environmentVars: {},
  dockerImage: undefined,
  entryPoint: undefined,
  outputDestination: 'local',
  maxDuration: 24
};

export function JobWizard({ onJobLaunched, onCancel }: JobWizardProps) {
  const [state, setState] = useState<JobWizardState>({
    currentStep: 1,
    jobAnalysis: null,
    uploadedFile: null,
    selectedGPU: null,
    advancedConfig: DEFAULT_ADVANCED_CONFIG,
    estimatedCost: 0,
    walletBalance: 0,
    launchStatus: 'idle',
    availableGPUs: [],
    loadingGPUs: false,
    escrowStatus: null
  });

  /**
   * Fetch available GPUs from backend
   */
  const fetchAvailableGPUs = useCallback(async () => {
    setState(prev => ({ ...prev, loadingGPUs: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/providers`);
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      
      const data = await response.json();
      const providers = data.providers || [];
      
      setState(prev => ({ 
        ...prev, 
        availableGPUs: providers,
        loadingGPUs: false 
      }));
    } catch (error: any) {
      console.error('Error fetching GPUs:', error);
      notify.error('Failed to load available GPUs');
      setState(prev => ({ ...prev, loadingGPUs: false }));
    }
  }, []);

  /**
   * Handle file analyzed from JobUploader
   * Requirements: 4.2
   */
  const handleFileAnalyzed = useCallback((analysis: JobAnalysis, file: File) => {
    setState(prev => ({
      ...prev,
      jobAnalysis: analysis,
      uploadedFile: file
    }));
    
    // Fetch available GPUs for next step
    fetchAvailableGPUs();
  }, [fetchAvailableGPUs]);

  /**
   * Handle GPU selection from SmartMatcher
   * Requirements: 4.2
   */
  const handleGPUSelected = useCallback((gpu: Provider) => {
    // Calculate estimated cost
    const estimatedDuration = 600; // Default 10 minutes in seconds
    const estimatedCost = (estimatedDuration / 3600) * gpu.pricePerHour;
    
    setState(prev => ({
      ...prev,
      selectedGPU: gpu,
      estimatedCost
    }));
  }, []);

  /**
   * Validate current step before allowing next
   * Requirements: 4.6
   */
  const validateStep = useCallback((step: number): { valid: boolean; error?: string } => {
    switch (step) {
      case 1:
        if (!state.jobAnalysis || !state.uploadedFile) {
          return { valid: false, error: 'Please upload and analyze a file first' };
        }
        return { valid: true };
      
      case 2:
        if (!state.selectedGPU) {
          return { valid: false, error: 'Please select a GPU' };
        }
        return { valid: true };
      
      case 3:
        // Advanced config is optional, always valid
        return { valid: true };
      
      case 4:
        // Final step validation happens on launch
        return { valid: true };
      
      default:
        return { valid: false };
    }
  }, [state.jobAnalysis, state.uploadedFile, state.selectedGPU]);

  /**
   * Navigate to next step
   * Requirements: 4.6, 4.7
   */
  const handleNext = useCallback(() => {
    const validation = validateStep(state.currentStep);
    
    if (!validation.valid) {
      notify.error(validation.error || 'Please complete the current step');
      return;
    }
    
    if (state.currentStep < 4) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as 1 | 2 | 3 | 4
      }));
    }
  }, [state.currentStep, validateStep]);

  /**
   * Navigate to previous step
   * Requirements: 4.7
   */
  const handleBack = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as 1 | 2 | 3 | 4
      }));
    }
  }, [state.currentStep]);

  /**
   * Skip advanced config step
   * Requirements: 4.8
   */
  const handleSkipAdvanced = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 4
    }));
  }, []);

  /**
   * Update advanced config
   * Requirements: 4.3
   */
  const updateAdvancedConfig = useCallback((updates: Partial<AdvancedConfig>) => {
    setState(prev => ({
      ...prev,
      advancedConfig: {
        ...prev.advancedConfig,
        ...updates
      }
    }));
  }, []);

  /**
   * Add environment variable
   */
  const addEnvVar = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      advancedConfig: {
        ...prev.advancedConfig,
        environmentVars: {
          ...prev.advancedConfig.environmentVars,
          [key]: value
        }
      }
    }));
  }, []);

  /**
   * Remove environment variable
   */
  const removeEnvVar = useCallback((key: string) => {
    setState(prev => {
      const newEnvVars = { ...prev.advancedConfig.environmentVars };
      delete newEnvVars[key];
      
      return {
        ...prev,
        advancedConfig: {
          ...prev.advancedConfig,
          environmentVars: newEnvVars
        }
      };
    });
  }, []);

  /**
   * Poll escrow status for confirmations
   * Requirements: 6.6, 6.7
   */
  const pollEscrowConfirmations = useCallback(async (jobId: string): Promise<boolean> => {
    const maxAttempts = 60; // 2 minutes max (2s interval)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/escrow/status/${jobId}`);
        const data = await response.json();

        if (data.success && data.escrow) {
          const escrow = data.escrow;
          
          // Update escrow status
          setState(prev => ({
            ...prev,
            escrowStatus: {
              txHash: escrow.txHash,
              confirmations: escrow.confirmations,
              requiredConfirmations: 3,
              status: escrow.status === 'locked' ? 'confirmed' : 'confirming',
              explorerUrl: escrow.explorerUrl
            }
          }));

          // Check if confirmed
          if (escrow.status === 'locked' || escrow.confirmations >= 3) {
            console.log('✅ Escrow confirmed with 3 confirmations');
            return true;
          }
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error('Error polling escrow status:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    // Timeout
    return false;
  }, []);

  /**
   * Launch job with escrow
   * Requirements: 4.5, 6.1, 6.6, 6.7
   */
  const handleLaunch = useCallback(async () => {
    if (!state.jobAnalysis || !state.selectedGPU || !state.uploadedFile) {
      notify.error('Missing required information');
      return;
    }

    try {
      // Step 1: Create escrow transaction
      // Requirements 6.1: Lock payment before job starts
      setState(prev => ({ 
        ...prev, 
        launchStatus: 'creating_escrow',
        escrowStatus: {
          txHash: null,
          confirmations: 0,
          requiredConfirmations: 3,
          status: 'creating'
        }
      }));

      console.log('🔒 Creating escrow transaction...');

      // For demo purposes, we'll use a mock consumer seed
      // In production, this would come from the connected wallet
      const mockConsumerSeed = 'a'.repeat(55); // Mock seed phrase
      
      // Create a temporary job ID for escrow
      const tempJobId = `temp_${Date.now()}`;

      const escrowResponse = await fetch(`${API_BASE_URL}/api/escrow/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: tempJobId,
          consumerSeed: mockConsumerSeed,
          providerAddress: state.selectedGPU.qubicAddress || 'A'.repeat(60),
          amount: state.estimatedCost,
          duration: state.advancedConfig.maxDuration
        })
      });

      const escrowData = await escrowResponse.json();

      if (!escrowData.success) {
        throw new Error(escrowData.error || 'Failed to create escrow');
      }

      console.log('✅ Escrow transaction created:', escrowData.txHash);
      console.log('   Explorer:', escrowData.explorerUrl);

      // Update escrow status with transaction hash
      setState(prev => ({
        ...prev,
        launchStatus: 'confirming_tx',
        escrowStatus: {
          txHash: escrowData.txHash,
          confirmations: 0,
          requiredConfirmations: 3,
          status: 'pending',
          explorerUrl: escrowData.explorerUrl
        }
      }));

      // Step 2: Poll for confirmations
      // Requirements 6.6, 6.7: Wait for 3 confirmations and display count
      console.log('⏳ Waiting for 3 confirmations...');
      
      const confirmed = await pollEscrowConfirmations(tempJobId);

      if (!confirmed) {
        throw new Error('Escrow confirmation timeout. Please check the transaction status.');
      }

      // Step 3: Create job in backend after escrow is confirmed
      // Requirement 6.6: Only create job after 3 confirmations
      setState(prev => ({ ...prev, launchStatus: 'provisioning' }));

      console.log('📋 Creating job in database...');

      const jobResponse = await fetch(`${API_BASE_URL}/api/jobs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelType: state.jobAnalysis.jobType,
          computeNeeded: state.estimatedCost / state.selectedGPU.pricePerHour,
          inputData: {},
          maxPrice: state.selectedGPU.pricePerHour,
          qubicAddress: mockConsumerSeed, // In production, use actual wallet address
          escrowTxHash: escrowData.txHash,
          providerId: state.selectedGPU.id,
          jobAnalysis: {
            ...state.jobAnalysis,
            fileName: state.uploadedFile.name,
            fileUrl: '' // Would be set after file upload
          },
          advancedConfig: state.advancedConfig
        })
      });

      const jobData = await jobResponse.json();

      if (!jobData.success) {
        throw new Error(jobData.error || 'Job creation failed');
      }

      console.log('✅ Job created:', jobData.job.id);

      setState(prev => ({ ...prev, launchStatus: 'launched' }));
      
      notify.success('Job launched successfully!');
      
      // Callback with created job
      onJobLaunched(jobData.job);

    } catch (error: any) {
      console.error('❌ Job launch error:', error);
      notify.error(`Failed to launch job: ${error.message}`);
      
      // Update escrow status to failed
      setState(prev => ({ 
        ...prev, 
        launchStatus: 'idle',
        escrowStatus: prev.escrowStatus ? {
          ...prev.escrowStatus,
          status: 'failed',
          error: error.message
        } : null
      }));
    }
  }, [
    state.jobAnalysis, 
    state.selectedGPU, 
    state.uploadedFile, 
    state.advancedConfig,
    state.estimatedCost,
    onJobLaunched,
    pollEscrowConfirmations
  ]);

  /**
   * Get step status for progress indicator
   */
  const getStepStatus = (step: number): 'completed' | 'current' | 'upcoming' => {
    if (step < state.currentStep) return 'completed';
    if (step === state.currentStep) return 'current';
    return 'upcoming';
  };

  /**
   * Render progress indicator
   * Requirements: 4.1
   */
  const renderProgressIndicator = () => {
    const steps = [
      { number: 1, label: 'Upload & Analysis', icon: Upload },
      { number: 2, label: 'GPU Selection', icon: Cpu },
      { number: 3, label: 'Advanced Config', icon: Settings },
      { number: 4, label: 'Payment & Launch', icon: Wallet }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number);
            const Icon = step.icon;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200
                      ${status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : status === 'current'
                        ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_20px_rgba(0,212,255,0.5)]'
                        : 'bg-slate-800 border-slate-600'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-6 h-6 ${status === 'current' ? 'text-white' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-2 text-center ${status === 'current' ? 'text-cyan-400 font-medium' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {step.number}/4
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mb-8">
                    <div
                      className={`h-full transition-all duration-300 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Render Step 1: Upload & Analysis
   * Requirements: 4.2
   */
  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload Your Job File</h2>
          <p className="text-slate-400">
            Upload your Python script, Jupyter notebook, or dataset. We'll automatically analyze it and determine GPU requirements.
          </p>
        </div>

        <JobUploader
          onFileAnalyzed={handleFileAnalyzed}
          onError={(error) => console.error('Upload error:', error)}
        />

        {state.jobAnalysis && (
          <div className="flex justify-end">
            <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
              Continue to GPU Selection
            </Button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render Step 2: GPU Selection
   * Requirements: 4.2
   */
  const renderStep2 = () => {
    if (!state.jobAnalysis) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-slate-400">No job analysis available. Please go back and upload a file.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Select Your GPU</h2>
          <p className="text-slate-400">
            We've analyzed your job and found compatible GPUs. Choose the one that best fits your needs.
          </p>
        </div>

        {state.loadingGPUs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            <span className="ml-3 text-slate-400">Loading available GPUs...</span>
          </div>
        ) : (
          <SmartMatcher
            jobRequirements={state.jobAnalysis}
            availableGPUs={state.availableGPUs}
            onGPUSelected={handleGPUSelected}
            selectedGPU={state.selectedGPU}
          />
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Back
          </Button>
          {state.selectedGPU && (
            <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
              Continue to Configuration
            </Button>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render Step 3: Advanced Config
   * Requirements: 4.3, 4.8
   */
  const renderStep3 = () => {
    const [newEnvKey, setNewEnvKey] = useState('');
    const [newEnvValue, setNewEnvValue] = useState('');

    const handleAddEnvVar = () => {
      if (newEnvKey && newEnvValue) {
        addEnvVar(newEnvKey, newEnvValue);
        setNewEnvKey('');
        setNewEnvValue('');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Advanced Configuration</h2>
            <p className="text-slate-400">
              Optional: Customize environment variables, Docker image, and output settings.
            </p>
          </div>
          <Button variant="ghost" onClick={handleSkipAdvanced}>
            Skip this step
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing env vars */}
            {Object.entries(state.advancedConfig.environmentVars).length > 0 && (
              <div className="space-y-2">
                {Object.entries(state.advancedConfig.environmentVars).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                    <code className="flex-1 text-sm text-cyan-400">{key}={value}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvVar(key)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new env var */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="KEY"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="value"
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Button onClick={handleAddEnvVar}>Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Docker Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Docker Image (optional)
              </label>
              <input
                type="text"
                placeholder="pytorch/pytorch:latest"
                value={state.advancedConfig.dockerImage || ''}
                onChange={(e) => updateAdvancedConfig({ dockerImage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Entry Point (optional)
              </label>
              <input
                type="text"
                placeholder="python train.py"
                value={state.advancedConfig.entryPoint || ''}
                onChange={(e) => updateAdvancedConfig({ entryPoint: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Output Destination
              </label>
              <select
                value={state.advancedConfig.outputDestination}
                onChange={(e) => updateAdvancedConfig({ outputDestination: e.target.value as 'ipfs' | 's3' | 'local' })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="local">Local Storage</option>
                <option value="ipfs">IPFS</option>
                <option value="s3">S3 Compatible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maximum Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={state.advancedConfig.maxDuration}
                onChange={(e) => updateAdvancedConfig({ maxDuration: parseInt(e.target.value) || 24 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Back
          </Button>
          <Button onClick={handleNext} rightIcon={<ChevronRight className="w-4 h-4" />}>
            Continue to Payment
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Render Step 4: Payment & Launch
   * Requirements: 4.4, 4.5, 12.4
   */
  const renderStep4 = () => {
    if (!state.jobAnalysis || !state.selectedGPU) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-slate-400">Missing required information. Please go back and complete previous steps.</p>
        </div>
      );
    }

    const isLaunching = state.launchStatus !== 'idle';

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Review & Launch</h2>
          <p className="text-slate-400">
            Review your job configuration and launch with escrow payment.
          </p>
        </div>

        {/* Job Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Job Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Job Type</p>
                <p className="text-base font-medium text-white capitalize">
                  {state.jobAnalysis.jobType.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Framework</p>
                <p className="text-base font-medium text-white capitalize">
                  {state.jobAnalysis.detectedFramework}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">File</p>
                <p className="text-base font-medium text-white truncate">
                  {state.uploadedFile?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">GPU Selected</p>
                <p className="text-base font-medium text-white">
                  {state.selectedGPU.gpuModel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown (Requirement 12.4) */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">GPU Hourly Rate</span>
                <span className="text-white font-medium">{state.selectedGPU.pricePerHour.toFixed(2)} QUBIC/hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Estimated Duration</span>
                <span className="text-white font-medium">~10 minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Per-Minute Rate</span>
                <span className="text-white font-medium">{(state.selectedGPU.pricePerHour / 60).toFixed(4)} QUBIC/min</span>
              </div>
              
              <div className="border-t border-slate-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total Estimated Cost</span>
                  <span className="text-2xl font-bold text-cyan-400">{state.estimatedCost.toFixed(4)} QUBIC</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300">
                💡 Funds will be held in escrow and only released when the job completes successfully.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-white">Qubic Wallet</p>
                  <p className="text-xs text-slate-400">Connected</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Balance</p>
                <p className="text-base font-semibold text-white">{state.walletBalance.toFixed(2)} QUBIC</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escrow Status - Requirements 6.7: Display confirmation count */}
        {state.escrowStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Escrow Transaction Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Hash with Explorer Link - Requirement 6.7 */}
              {state.escrowStatus.txHash && (
                <div className="p-4 bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-cyan-400 font-mono break-all flex-1">
                      {state.escrowStatus.txHash}
                    </code>
                    {state.escrowStatus.explorerUrl && (
                      <a
                        href={state.escrowStatus.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 text-sm underline whitespace-nowrap"
                      >
                        View in Explorer →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation Progress - Requirements 6.6, 6.7 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Confirmations</span>
                  <span className="text-base font-semibold text-white">
                    {state.escrowStatus.confirmations}/{state.escrowStatus.requiredConfirmations}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(state.escrowStatus.confirmations / state.escrowStatus.requiredConfirmations) * 100}%`
                    }}
                  />
                </div>

                {/* Estimated Time - Requirement: Show estimated confirmation time (15s per confirmation) */}
                {state.escrowStatus.status === 'confirming' && (
                  <p className="text-xs text-slate-400">
                    Estimated time remaining: ~{(state.escrowStatus.requiredConfirmations - state.escrowStatus.confirmations) * 15} seconds
                  </p>
                )}

                {/* Status Messages */}
                {state.escrowStatus.status === 'creating' && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Creating escrow transaction...</span>
                  </div>
                )}

                {state.escrowStatus.status === 'pending' && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Transaction submitted, waiting for first confirmation...</span>
                  </div>
                )}

                {state.escrowStatus.status === 'confirming' && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      Confirming... ({state.escrowStatus.confirmations}/3 confirmations received)
                    </span>
                  </div>
                )}

                {state.escrowStatus.status === 'confirmed' && (
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Escrow confirmed! Creating job...</span>
                  </div>
                )}

                {state.escrowStatus.status === 'failed' && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Escrow Failed</span>
                    </div>
                    {state.escrowStatus.error && (
                      <p className="text-xs text-red-300">{state.escrowStatus.error}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Launch Status */}
        {isLaunching && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                <div className="flex-1">
                  <p className="text-base font-medium text-white mb-1">
                    {state.launchStatus === 'creating_escrow' && 'Creating escrow transaction...'}
                    {state.launchStatus === 'confirming_tx' && 'Waiting for confirmations...'}
                    {state.launchStatus === 'provisioning' && 'Provisioning job...'}
                    {state.launchStatus === 'launched' && 'Job launched successfully!'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {state.launchStatus === 'creating_escrow' && 'Locking funds in escrow on Qubic blockchain'}
                    {state.launchStatus === 'confirming_tx' && 'Waiting for 3 blockchain confirmations (~45 seconds)'}
                    {state.launchStatus === 'provisioning' && 'Assigning job to provider and notifying worker'}
                    {state.launchStatus === 'launched' && 'Redirecting to job monitor...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            disabled={isLaunching}
          >
            Back
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isLaunching}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLaunch}
              disabled={isLaunching}
              leftIcon={isLaunching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            >
              {isLaunching ? 'Launching...' : 'Launch Job'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // Track direction for animations
  const [direction, setDirection] = useState(0);
  const [prevStep, setPrevStep] = useState(state.currentStep);

  useEffect(() => {
    if (state.currentStep !== prevStep) {
      setDirection(state.currentStep > prevStep ? 1 : -1);
      setPrevStep(state.currentStep);
    }
  }, [state.currentStep, prevStep]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Indicator (Requirement 4.1) */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        {renderProgressIndicator()}
      </motion.div>

      {/* Step Content with Smooth Transitions */}
      <div className="mt-8 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={state.currentStep}
            custom={direction}
            variants={wizardStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

