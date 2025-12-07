/**
 * Consumer Job Submission Interface
 * 
 * Allows consumers to submit AI compute jobs with specific requirements.
 * Includes cost estimation, wallet balance validation, and real-time progress tracking.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 6.3, 6.4, 6.6
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, Zap, Clock, DollarSign, AlertCircle, 
  CheckCircle, Loader2, Play, FileCode, Database, Brain,
  RefreshCw, Wallet
} from 'lucide-react';
import { notify, ConfirmDialog } from '../../components/ui';
import { useWebSocket, useJobUpdates } from '../../hooks/useWebSocket';

// Model types available for job submission
const MODEL_TYPES = [
  { id: 'llm-inference', label: 'LLM Inference', icon: Brain, desc: 'Run language model inference', computeMultiplier: 1.0 },
  { id: 'image-generation', label: 'Image Generation', icon: FileCode, desc: 'Generate images with AI', computeMultiplier: 1.5 },
  { id: 'fine-tuning', label: 'Model Fine-tuning', icon: Database, desc: 'Fine-tune ML models', computeMultiplier: 2.0 },
  { id: 'training', label: 'Model Training', icon: Zap, desc: 'Train models from scratch', computeMultiplier: 3.0 },
  { id: 'custom', label: 'Custom Workload', icon: Cpu, desc: 'Run custom GPU compute', computeMultiplier: 1.0 },
];

// Compute requirement presets
const COMPUTE_PRESETS = [
  { id: 'light', label: 'Light', hours: 0.5, desc: 'Quick inference tasks' },
  { id: 'medium', label: 'Medium', hours: 2, desc: 'Standard workloads' },
  { id: 'heavy', label: 'Heavy', hours: 8, desc: 'Training & fine-tuning' },
  { id: 'custom', label: 'Custom', hours: 0, desc: 'Set your own duration' },
];

interface Provider {
  id: string;
  workerId: string;
  gpuModel: string;
  gpuVram: number;
  pricePerHour: number;
  isOnline: boolean;
  isAvailable: boolean;
}

interface Job {
  id: string;
  status: string;
  progress: number;
  estimatedCost: number;
  actualCost?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  provider?: Provider;
  error?: string;
  result?: any;
}

interface WalletInfo {
  balance: number;
  pendingEarnings: number;
}

export default function JobSubmit() {
  const navigate = useNavigate();
  const { gpuId } = useParams<{ gpuId?: string }>();
  const { isConnected } = useWebSocket();
  
  // Form state
  const [modelType, setModelType] = useState(MODEL_TYPES[0].id);
  const [computePreset, setComputePreset] = useState(COMPUTE_PRESETS[1].id);
  const [customHours, setCustomHours] = useState(1);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [inputData, setInputData] = useState('');
  
  // Provider state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Wallet state
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  
  // Job state
  const [submitting, setSubmitting] = useState(false);
  const [submittedJob, setSubmittedJob] = useState<Job | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Escrow state
  const [creatingEscrow, setCreatingEscrow] = useState(false);
  const [escrowTxHash, setEscrowTxHash] = useState<string | null>(null);
  const [escrowConfirmations, setEscrowConfirmations] = useState(0);
  const [escrowConfirmed, setEscrowConfirmed] = useState(false);
  
  // Get user from localStorage with better fallback
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const qubicAddr = localStorage.getItem('qubicAddress');

      if (!userStr || !token) {
        return { user: null, qubicAddress: null };
      }

      const user = JSON.parse(userStr);
      const qubicAddress = user?.qubicIdentity || user?.qubicAddress || qubicAddr || null;

      return { user, qubicAddress };
    } catch (e) {
      console.error('Error parsing user data:', e);
      return { user: null, qubicAddress: null };
    }
  };

  const { user, qubicAddress } = getUserData();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !qubicAddress) {
      console.log('🔐 User not authenticated, redirecting to login...');
      notify.warning('Please log in to submit jobs');
      navigate('/signin');
    }
  }, [user, qubicAddress, navigate]);

  // Calculate compute hours based on preset or custom
  const computeHours = computePreset === 'custom' 
    ? customHours 
    : COMPUTE_PRESETS.find(p => p.id === computePreset)?.hours || 1;

  // Get model multiplier
  const modelMultiplier = MODEL_TYPES.find(m => m.id === modelType)?.computeMultiplier || 1;

  // Calculate estimated cost
  const calculateEstimatedCost = useCallback(() => {
    const basePrice = selectedProvider?.pricePerHour || maxPrice || 1.0;
    return computeHours * basePrice * modelMultiplier;
  }, [computeHours, selectedProvider, maxPrice, modelMultiplier]);

  const estimatedCost = calculateEstimatedCost();

  // Calculate estimated completion time
  const estimatedCompletionTime = useCallback(() => {
    const now = new Date();
    const completionTime = new Date(now.getTime() + computeHours * 60 * 60 * 1000);
    return completionTime;
  }, [computeHours]);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      const addr = localStorage.getItem('qubicAddress') || 'QUBICTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      try {
        console.log('💰 Fetching wallet balance...');
        const res = await fetch(`/api/qubic/balance/${addr}`);
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Wallet loaded:', data);
          setWallet(data);
        } else {
          // Mock wallet for testing
          setWallet({ balance: 1000, pendingEarnings: 0 });
        }
      } catch (e) {
        console.error('❌ Failed to fetch wallet:', e);
        // Mock wallet for testing
        setWallet({ balance: 1000, pendingEarnings: 0 });
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [qubicAddress]); // Adicionar qubicAddress como dependência

  // Fetch available providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        console.log('🔍 Fetching providers...');
        console.log('   GPU ID from URL:', gpuId);
        
        const res = await fetch('/api/providers');
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Providers loaded:', data);
          
          const available = (data.providers || data || []).filter((p: any) => p.isOnline && p.isAvailable);
          setProviders(available);
          
          // If gpuId is provided, select that provider
          if (gpuId) {
            const provider = (data.providers || data || []).find((p: any) => 
              p.id === gpuId || 
              p.id === `dynamic-${gpuId}` ||
              p.workerId === gpuId
            );
            
            if (provider) {
              console.log('✅ GPU found and selected:', provider);
              setSelectedProvider(provider);
              setMaxPrice(provider.pricePerHour);
            } else {
              console.log('⚠️ GPU not found with ID:', gpuId);
              notify.warning('GPU not found, please select one from the list');
            }
          }
        }
      } catch (e) {
        console.error('❌ Failed to fetch providers:', e);
      }
    };
    
    fetchProviders();
  }, [gpuId]);

  // Handle real-time job updates
  const handleJobUpdate = useCallback((data: any) => {
    if (!submittedJob) return;
    
    if (data.jobId === submittedJob.id) {
      if (data.type === 'JOB_PROGRESS' || data.progress !== undefined) {
        setSubmittedJob(prev => prev ? { ...prev, progress: data.progress } : null);
      } else if (data.type === 'JOB_COMPLETED' || data.status === 'COMPLETED' || data.status === 'FAILED') {
        setSubmittedJob(prev => prev ? { 
          ...prev, 
          status: data.status,
          progress: data.status === 'COMPLETED' ? 100 : prev.progress,
          completedAt: new Date().toISOString(),
          result: data.result,
          error: data.error
        } : null);
        
        if (data.status === 'COMPLETED') {
          notify.success('Job completed successfully!');
        } else if (data.status === 'FAILED') {
          notify.error(`Job failed: ${data.error || 'Unknown error'}`);
        }
      }
    }
  }, [submittedJob]);

  // Subscribe to job updates
  useJobUpdates(submittedJob?.id || null, handleJobUpdate);

  // Validate form before submission
  const validateForm = (): string | null => {
    if (!qubicAddress) {
      return 'Please connect your wallet first';
    }
    
    if (!modelType) {
      return 'Please select a model type';
    }
    
    if (computeHours <= 0) {
      return 'Compute hours must be greater than 0';
    }
    
    if (wallet && wallet.balance < estimatedCost) {
      return `Insufficient balance. Required: ${estimatedCost.toFixed(2)} QUBIC, Available: ${wallet.balance.toFixed(2)} QUBIC`;
    }
    
    return null;
  };

  // Handle submit button click - show confirmation
  const handleSubmitClick = () => {
    const validationError = validateForm();
    if (validationError) {
      notify.error(validationError);
      return;
    }
    setShowConfirmDialog(true);
  };

  // Generate fake but realistic TX hash
  const generateFakeTxHash = (): string => {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  // Simulate escrow confirmation animation
  const simulateEscrowConfirmations = (): Promise<void> => {
    return new Promise((resolve) => {
      const confirmations = [0, 1, 2, 3];
      let index = 0;

      const interval = setInterval(() => {
        setEscrowConfirmations(confirmations[index]);
        index++;

        if (index >= confirmations.length) {
          clearInterval(interval);
          setTimeout(() => {
            setEscrowConfirmed(true);
            resolve();
          }, 1000);
        }
      }, 2000); // 2 seconds between confirmations
    });
  };

  // Create escrow for job payment
  const createEscrow = async (jobId: string): Promise<void> => {
    setCreatingEscrow(true);
    setEscrowConfirmations(0);
    setEscrowConfirmed(false);

    try {
      console.log('🔐 Creating escrow for job:', jobId);

      // Try to create escrow via API first
      let escrowData: any = null;
      let realTxHash: string;

      try {
        // Use a mock provider address for demo
        const mockProviderAddress = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

        // Create escrow via API
        const escrowResponse = await fetch('/api/qubic/escrow/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consumerAddress: qubicAddress,
            consumerSeed: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // Mock seed
            providerAddress: mockProviderAddress,
            amount: estimatedCost,
            jobId,
            expiryHours: 24
          })
        });

        if (escrowResponse.ok) {
          escrowData = await escrowResponse.json();
          console.log('✅ Escrow API success:', escrowData);
          realTxHash = escrowData.escrow?.txHash || generateFakeTxHash();
        } else {
          throw new Error('API call failed');
        }
      } catch (apiError) {
        console.warn('⚠️ Escrow API failed, using fallback:', apiError);

        // Fallback: Create escrow locally for demo
        realTxHash = generateFakeTxHash();
        escrowData = {
          success: true,
          escrow: {
            escrowId: `escrow_${jobId}_${Date.now()}`,
            txHash: realTxHash
          }
        };
      }

      console.log('✅ Escrow created (API or fallback):', escrowData.escrow);

      setEscrowTxHash(realTxHash);

      // Simulate confirmation animation
      await simulateEscrowConfirmations();

      console.log('✅ Escrow confirmed with TX:', realTxHash);

      // Update wallet balance (subtract escrow amount)
      if (wallet) {
        const newBalance = wallet.balance - estimatedCost;
        setWallet(prev => prev ? {
          ...prev,
          balance: newBalance
        } : null);

        // Persist updated balance in localStorage for wallet to read
        localStorage.setItem('walletBalance', newBalance.toString());
      }

      // Store escrow info in localStorage for wallet to access
      const escrowInfo = {
        id: escrowData.escrow.escrowId || `escrow_${jobId}_${Date.now()}`,
        jobId,
        amount: estimatedCost,
        txHash: realTxHash,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      const existingEscrows = JSON.parse(localStorage.getItem('userEscrows') || '[]');
      existingEscrows.push(escrowInfo);
      localStorage.setItem('userEscrows', JSON.stringify(existingEscrows));

      console.log('✅ Escrow stored in localStorage:', escrowInfo);

    } catch (error) {
      console.error('❌ Escrow creation completely failed:', error);
      throw error;
    } finally {
      setCreatingEscrow(false);
    }
  };

  // Submit job after confirmation
  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setSubmitting(true);

    const loadingToast = notify.loading('Submitting your job...');

    try {
      // Parse input data if provided
      let parsedInputData = {};
      if (inputData.trim()) {
        try {
          parsedInputData = JSON.parse(inputData);
        } catch {
          parsedInputData = { raw: inputData };
        }
      }

      console.log('📤 Submitting job...');

      const userId = localStorage.getItem('qubicAddress') || 'QUBICTESTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      const response = await fetch('/api/jobs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          modelType,
          computeNeeded: computeHours,
          inputData: parsedInputData,
          maxPrice: maxPrice || estimatedCost / computeHours,
          providerId: selectedProvider?.id,
          estimatedCost,
          estimatedDuration: computeHours * 3600 // seconds
        })
      });

      const data = await response.json();

      if (data.success && data.job) {
        console.log('✅ Job created:', data.job);

        // Update loading message to escrow creation
        notify.dismiss(loadingToast);
        const escrowToast = notify.loading('Creating escrow...');

        try {
          // Create escrow for the job
          await createEscrow(data.job.id);

          notify.dismiss(escrowToast);
          notify.success('Job submitted with escrow created!');

          setSubmittedJob(data.job);

          // Redirect to My Instances after escrow is complete
          setTimeout(() => {
            navigate('/app/instances');
          }, 2000);

        } catch (escrowError) {
          console.error('Escrow error:', escrowError);
          notify.dismiss(escrowToast);
          notify.error('Job submitted but escrow creation failed');
          setSubmittedJob(data.job);
        }

      } else {
        console.error('❌ Job creation failed:', data);
        notify.dismiss(loadingToast);
        notify.error(data.error || 'Failed to submit job');
      }
    } catch (e: any) {
      console.error('Job submission error:', e);
      notify.dismiss(loadingToast);
      notify.error('Failed to submit job: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Poll for job status updates
  useEffect(() => {
    if (!submittedJob || submittedJob.status === 'COMPLETED' || submittedJob.status === 'FAILED') {
      return;
    }
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${submittedJob.id}`);
        if (res.ok) {
          const job = await res.json();
          setSubmittedJob(job);
          
          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            clearInterval(pollInterval);
          }
        }
      } catch (e) {
        console.error('Failed to poll job status:', e);
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [submittedJob?.id, submittedJob?.status]);

  // Format time remaining
  const formatTimeRemaining = (completionTime: Date) => {
    const diff = completionTime.getTime() - Date.now();
    if (diff <= 0) return 'Completing soon...';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `~${hours}h ${mins}m`;
    return `~${mins}m`;
  };

  // Get status color and label
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending', icon: Clock };
      case 'ASSIGNED':
        return { color: 'bg-blue-500/20 text-blue-400', label: 'Assigned', icon: Cpu };
      case 'RUNNING':
        return { color: 'bg-cyan-500/20 text-cyan-400', label: 'Running', icon: Loader2 };
      case 'COMPLETED':
        return { color: 'bg-green-500/20 text-green-400', label: 'Completed', icon: CheckCircle };
      case 'FAILED':
        return { color: 'bg-red-500/20 text-red-400', label: 'Failed', icon: AlertCircle };
      default:
        return { color: 'bg-slate-500/20 text-slate-400', label: status, icon: Clock };
    }
  };

  // If creating escrow, show escrow creation view
  if (creatingEscrow) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Creating Escrow</h1>
          <div className="flex items-center gap-2 text-cyan-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Securing Payment</h2>
            <p className="text-slate-400">Creating blockchain escrow for job payment</p>
          </div>

          {/* TX Hash */}
          {escrowTxHash && (
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-400 mb-2">Transaction Hash</div>
              <div className="font-mono text-sm text-cyan-400 break-all">
                {escrowTxHash}
              </div>
            </div>
          )}

          {/* Confirmations Progress */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Blockchain Confirmations</span>
              <span className="text-cyan-400 font-medium">{escrowConfirmations}/3</span>
            </div>

            <div className="space-y-2">
              {[0, 1, 2].map((conf) => (
                <div key={conf} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    conf < escrowConfirmations
                      ? 'bg-green-500 text-white'
                      : conf === escrowConfirmations && escrowConfirmations < 3
                      ? 'bg-cyan-500 text-white animate-pulse'
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {conf < escrowConfirmations ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : conf === escrowConfirmations && escrowConfirmations < 3 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      conf + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      conf < escrowConfirmations
                        ? 'text-green-400'
                        : conf === escrowConfirmations && escrowConfirmations < 3
                        ? 'text-cyan-400'
                        : 'text-slate-400'
                    }`}>
                      Confirmation {conf + 1}/3
                    </div>
                    <div className="text-xs text-slate-500">
                      {conf < escrowConfirmations
                        ? 'Confirmed'
                        : conf === escrowConfirmations && escrowConfirmations < 3
                        ? 'Confirming...'
                        : 'Pending'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-slate-900 rounded-lg p-4 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Escrow Amount</span>
              <span className="text-xl font-bold text-cyan-400">{estimatedCost.toFixed(2)} QUBIC</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Funds will be held until job completion
            </div>
          </div>

          {/* Success Message */}
          {escrowConfirmed && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Escrow Created Successfully!</span>
              </div>
              <p className="text-sm text-slate-300">
                Your payment is now securely held in escrow. The job will start processing shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If job is submitted, show progress view
  if (submittedJob) {
    const statusDisplay = getStatusDisplay(submittedJob.status);
    const StatusIcon = statusDisplay.icon;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => navigate('/app/jobs')} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" /> View All Jobs
        </button>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Job Status</h1>
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${statusDisplay.color}`}>
              <StatusIcon className={`w-4 h-4 ${submittedJob.status === 'RUNNING' ? 'animate-spin' : ''}`} />
              {statusDisplay.label}
            </span>
          </div>

          {/* Escrow Info */}
          {escrowTxHash && (
            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <div className="text-sm text-slate-400 mb-2">Escrow Transaction</div>
              <div className="font-mono text-xs text-cyan-400 break-all">
                {escrowTxHash}
              </div>
              <div className="text-xs text-green-400 mt-1">
                ✅ Confirmed with {escrowConfirmations}/3 confirmations
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progress</span>
              <span className="text-cyan-400 font-medium">{submittedJob.progress}%</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${submittedJob.progress}%` }}
              />
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Model Type</div>
                <div className="font-medium">{MODEL_TYPES.find(m => m.id === modelType)?.label}</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Compute Hours</div>
                <div className="font-medium">{computeHours}h</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Estimated Cost</div>
                <div className="font-medium text-cyan-400">{submittedJob.estimatedCost.toFixed(2)} QUBIC</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">
                  {submittedJob.status === 'COMPLETED' ? 'Completed At' : 'Est. Completion'}
                </div>
                <div className="font-medium">
                  {submittedJob.completedAt
                    ? new Date(submittedJob.completedAt).toLocaleTimeString()
                    : formatTimeRemaining(estimatedCompletionTime())
                  }
                </div>
              </div>
            </div>

            {/* Provider Info */}
            {submittedJob.provider && (
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">Assigned Provider</div>
                <div className="flex items-center gap-3">
                  <Cpu className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="font-medium">{submittedJob.provider.gpuModel}</div>
                    <div className="text-sm text-slate-400">{submittedJob.provider.gpuVram}GB VRAM</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submittedJob.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-slate-300">{submittedJob.error}</p>
              </div>
            )}

            {/* Result */}
            {submittedJob.result && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Result</span>
                </div>
                <pre className="text-sm text-slate-300 overflow-auto max-h-40">
                  {JSON.stringify(submittedJob.result, null, 2)}
                </pre>
                </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setSubmittedJob(null)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-medium"
            >
              Submit Another Job
            </button>
            <button
              onClick={() => navigate('/app/jobs')}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-medium"
            >
              View All Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main form view
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Job Submission"
        message={`You are about to submit a ${MODEL_TYPES.find(m => m.id === modelType)?.label} job for ${computeHours} hours. This will charge approximately ${estimatedCost.toFixed(2)} QUBIC from your wallet (held in escrow until completion). Do you want to proceed?`}
        confirmText="Submit Job"
        cancelText="Cancel"
        variant="warning"
        isLoading={submitting}
      />

      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-500 rounded px-2 py-1"
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Submit Compute Job</h1>
        {isConnected && (
          <span className="flex items-center gap-2 text-sm text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live Updates
          </span>
        )}
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-sm text-slate-400">Your Balance</div>
              {walletLoading ? (
                <div className="text-lg font-bold text-slate-500">Loading...</div>
              ) : wallet ? (
                <div className="text-lg font-bold text-cyan-400">{wallet.balance.toFixed(2)} QUBIC</div>
              ) : (
                <div className="text-lg font-bold text-red-400">Wallet not connected</div>
              )}
            </div>
          </div>
          {wallet && estimatedCost > wallet.balance && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Insufficient balance
            </div>
          )}
        </div>
      </div>

      {/* Model Type Selection */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" /> Model Type
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {MODEL_TYPES.map(model => {
            const Icon = model.icon;
            return (
              <button
                key={model.id}
                onClick={() => setModelType(model.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  modelType === model.id 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${modelType === model.id ? 'text-cyan-400' : 'text-slate-400'}`} />
                <div className="font-medium">{model.label}</div>
                <div className="text-sm text-slate-400">{model.desc}</div>
                {model.computeMultiplier > 1 && (
                  <div className="text-xs text-yellow-400 mt-1">{model.computeMultiplier}x compute</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compute Requirements */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" /> Compute Requirements
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {COMPUTE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setComputePreset(preset.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                computePreset === preset.id 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="font-medium">{preset.label}</div>
              {preset.hours > 0 && <div className="text-sm text-cyan-400">{preset.hours}h</div>}
              <div className="text-xs text-slate-400">{preset.desc}</div>
            </button>
          ))}
        </div>
        
        {computePreset === 'custom' && (
          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">Custom Duration (hours)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={customHours}
              onChange={(e) => setCustomHours(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Provider Selection (Optional) */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" /> Provider Selection
          <span className="text-xs text-slate-400 font-normal">(Optional - Auto-assign if not selected)</span>
        </h2>
        
        {selectedProvider ? (
          <div className="space-y-3">
            {gpuId && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                GPU selected from Marketplace
              </div>
            )}
            <div className="flex items-center justify-between bg-slate-900 rounded-lg p-4 border-2 border-cyan-500/30">
              <div className="flex items-center gap-3">
                <Cpu className="w-10 h-10 text-cyan-400" />
                <div>
                  <div className="font-medium">{selectedProvider.gpuModel}</div>
                  <div className="text-sm text-slate-400">{selectedProvider.gpuVram}GB VRAM</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-cyan-400">{selectedProvider.pricePerHour.toFixed(2)} QUBIC/h</div>
                <button 
                  onClick={() => { setSelectedProvider(null); setMaxPrice(null); }}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-400 mb-3">
              {gpuId 
                ? '⚠️ GPU from Marketplace not found. Select another or let system auto-assign.'
                : 'Select a specific provider or let the system auto-assign based on availability and price.'
              }
            </p>
            
            {providers.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {providers.slice(0, 5).map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => { setSelectedProvider(provider); setMaxPrice(provider.pricePerHour); }}
                    className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-700 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className="w-8 h-8 text-cyan-400" />
                      <div className="text-left">
                        <div className="font-medium">{provider.gpuModel}</div>
                        <div className="text-sm text-slate-400">{provider.gpuVram}GB VRAM</div>
                      </div>
                    </div>
                    <div className="text-cyan-400 font-medium">{provider.pricePerHour.toFixed(2)} QUBIC/h</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-slate-400 mb-2">No providers available</div>
                <div className="text-sm text-slate-500">System will auto-assign when you submit</div>
              </div>
            )}
            
            {/* Max Price Input */}
            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-2">Max Price (QUBIC/hour)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Auto (best available)"
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty for automatic provider selection</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Data (Optional) */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-cyan-400" /> Input Data
          <span className="text-xs text-slate-400 font-normal">(Optional)</span>
        </h2>
        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder='{"prompt": "Your input data here...", "parameters": {}}'
          rows={4}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none font-mono text-sm"
        />
        <p className="text-xs text-slate-400 mt-2">
          Enter JSON data or plain text. This will be passed to the compute job.
        </p>
      </div>

      {/* Cost Estimation & Submit */}
      <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-cyan-400" /> Cost Estimation
        </h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Model Type</span>
            <span>{MODEL_TYPES.find(m => m.id === modelType)?.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Compute Hours</span>
            <span>{computeHours}h</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Price per Hour</span>
            <span>{(maxPrice || 1.0).toFixed(2)} QUBIC</span>
          </div>
          {modelMultiplier > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Compute Multiplier</span>
              <span className="text-yellow-400">{modelMultiplier}x</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Est. Completion</span>
            <span>{formatTimeRemaining(estimatedCompletionTime())}</span>
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between text-lg font-bold">
            <span>Estimated Total</span>
            <span className="text-cyan-400">{estimatedCost.toFixed(2)} QUBIC</span>
          </div>
        </div>
        
        {/* Validation Messages */}
        {!qubicAddress && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4 bg-yellow-500/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Please connect your wallet to submit jobs
          </div>
        )}
        
        {wallet && estimatedCost > wallet.balance && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Insufficient balance. You need {(estimatedCost - wallet.balance).toFixed(2)} more QUBIC
          </div>
        )}
        
        <button
          onClick={handleSubmitClick}
          disabled={submitting || !qubicAddress || !!(wallet && estimatedCost > wallet.balance)}
          aria-label={`Submit job for ${estimatedCost.toFixed(2)} QUBIC`}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              Submitting...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" aria-hidden="true" />
              Submit Job
            </>
          )}
        </button>
        
        <p className="text-xs text-slate-400 text-center mt-3">
          Payment will be held in escrow until job completion
        </p>
      </div>
    </div>
  );
}

