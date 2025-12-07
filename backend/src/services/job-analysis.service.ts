/**
 * Job Analysis Service
 * Analyzes uploaded files to detect job type and extract GPU requirements
 * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface JobAnalysis {
  jobType: 'mnist_training' | 'stable_diffusion' | 'custom_script' | 'inference' | 'rendering';
  detectedFramework: 'pytorch' | 'tensorflow' | 'jax' | 'none';
  estimatedVRAM: number; // GB
  estimatedCompute: number; // TFLOPS
  estimatedRAM: number; // GB
  estimatedStorage: number; // GB
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Analyze Python script to detect imports and job type
 * Requirements: 2.1, 14.1
 * 
 * Detects:
 * - PyTorch (import torch, from torch)
 * - TensorFlow (import tensorflow, from tensorflow)
 * - JAX (import jax, from jax)
 * - Stable Diffusion (diffusers, stable_diffusion keywords)
 * - MNIST (mnist, torchvision.datasets.MNIST keywords)
 */
export function analyzePythonScript(content: string): Partial<JobAnalysis> {
  const lines = content.split('\n');
  let detectedFramework: JobAnalysis['detectedFramework'] = 'none';
  let jobType: JobAnalysis['jobType'] = 'custom_script';
  let confidence: JobAnalysis['confidence'] = 'low';

  // Detect framework from imports with comprehensive patterns
  // PyTorch detection: import torch, from torch, import torch.nn, etc.
  const hasPyTorch = lines.some(line => {
    const trimmed = line.trim();
    return /^import\s+torch(\s|$|\.)|^from\s+torch(\s|\.)/.test(trimmed);
  });
  
  // TensorFlow detection: import tensorflow, from tensorflow, import tensorflow.keras, etc.
  const hasTensorFlow = lines.some(line => {
    const trimmed = line.trim();
    return /^import\s+tensorflow(\s|$|\.)|^from\s+tensorflow(\s|\.)/.test(trimmed);
  });
  
  // JAX detection: import jax, from jax, import jax.numpy, etc.
  const hasJAX = lines.some(line => {
    const trimmed = line.trim();
    return /^import\s+jax(\s|$|\.)|^from\s+jax(\s|\.)/.test(trimmed);
  });

  // Set framework based on detection (priority: PyTorch > TensorFlow > JAX)
  if (hasPyTorch) {
    detectedFramework = 'pytorch';
    confidence = 'high';
  } else if (hasTensorFlow) {
    detectedFramework = 'tensorflow';
    confidence = 'high';
  } else if (hasJAX) {
    detectedFramework = 'jax';
    confidence = 'high';
  }

  // Detect specific job types with comprehensive keyword matching
  const contentLower = content.toLowerCase();
  
  // MNIST detection - look for mnist dataset references
  const mnistKeywords = [
    'mnist',
    'torchvision.datasets.mnist',
    'datasets.mnist',
    'keras.datasets.mnist',
    'tensorflow.keras.datasets.mnist'
  ];
  const hasMNIST = mnistKeywords.some(keyword => contentLower.includes(keyword));
  
  // Stable Diffusion detection - look for diffusion model references
  const stableDiffusionKeywords = [
    'stable_diffusion',
    'stablediffusion',
    'diffusers',
    'stablediffusionpipeline',
    'diffusionpipeline',
    'from diffusers import',
    'autoencoder',
    'unet',
    'text_encoder'
  ];
  const hasStableDiffusion = stableDiffusionKeywords.some(keyword => 
    contentLower.includes(keyword)
  );
  
  // Inference detection - look for model evaluation patterns
  const inferenceKeywords = [
    'model.eval()',
    'torch.no_grad()',
    'inference',
    'predict(',
    'prediction',
    '.predict(',
    'model.predict'
  ];
  const hasInference = inferenceKeywords.some(keyword => 
    contentLower.includes(keyword)
  );
  
  // Training detection - look for training patterns
  const trainingKeywords = [
    'model.train()',
    'optimizer.step()',
    'loss.backward()',
    'model.fit(',
    'train_loader',
    'training_loop',
    'for epoch in'
  ];
  const hasTraining = trainingKeywords.some(keyword => 
    contentLower.includes(keyword)
  );

  // Determine job type based on detected patterns
  if (hasMNIST) {
    jobType = 'mnist_training';
    confidence = 'high';
  } else if (hasStableDiffusion) {
    jobType = 'stable_diffusion';
    confidence = 'high';
  } else if (hasInference && !hasTraining) {
    jobType = 'inference';
    confidence = 'medium';
  } else if (hasTraining) {
    // Generic training job - keep framework confidence if already high
    jobType = 'custom_script';
    if (confidence !== 'high') {
      confidence = 'medium';
    }
  } else if (detectedFramework !== 'none') {
    // Has ML framework but unclear purpose - keep high confidence for framework detection
    jobType = 'custom_script';
    // confidence already set to 'high' from framework detection
  } else {
    // No clear indicators
    jobType = 'custom_script';
    confidence = 'low';
  }

  return {
    jobType,
    detectedFramework,
    confidence
  };
}

/**
 * Analyze Jupyter notebook to extract job information
 * Requirements: 2.2
 */
export function analyzeJupyterNotebook(content: string): Partial<JobAnalysis> {
  try {
    const notebook = JSON.parse(content);
    
    // Combine all code cells
    const codeCells = notebook.cells
      ?.filter((cell: any) => cell.cell_type === 'code')
      ?.map((cell: any) => cell.source.join('\n'))
      ?.join('\n') || '';

    // Analyze combined code as Python script
    const analysis = analyzePythonScript(codeCells);

    // Estimate memory usage based on notebook size
    const notebookSizeMB = Buffer.byteLength(content, 'utf8') / (1024 * 1024);
    const estimatedRAM = Math.max(4, notebookSizeMB * 10); // Rough estimate

    return {
      ...analysis,
      estimatedRAM
    };
  } catch (error) {
    console.error('Error parsing Jupyter notebook:', error);
    return {
      jobType: 'custom_script',
      detectedFramework: 'none',
      confidence: 'low'
    };
  }
}

/**
 * Analyze Dockerfile to extract requirements
 * Requirements: 2.4
 */
export function analyzeDockerfile(content: string): Partial<JobAnalysis> {
  const lines = content.split('\n');
  let detectedFramework: JobAnalysis['detectedFramework'] = 'none';
  let confidence: JobAnalysis['confidence'] = 'medium';

  // Check for framework installations
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('torch') || contentLower.includes('pytorch')) {
    detectedFramework = 'pytorch';
    confidence = 'high';
  } else if (contentLower.includes('tensorflow')) {
    detectedFramework = 'tensorflow';
    confidence = 'high';
  } else if (contentLower.includes('jax')) {
    detectedFramework = 'jax';
    confidence = 'high';
  }

  // Check for CUDA/GPU requirements
  const hasCuda = contentLower.includes('cuda') || contentLower.includes('nvidia');
  const estimatedVRAM = hasCuda ? 8 : 4; // Default estimates

  return {
    detectedFramework,
    confidence,
    estimatedVRAM
  };
}

/**
 * Calculate GPU requirements based on detected job type
 * Requirements: 1.6, 2.5
 */
export function calculateGPURequirements(
  jobType: JobAnalysis['jobType'],
  framework: JobAnalysis['detectedFramework']
): Pick<JobAnalysis, 'estimatedVRAM' | 'estimatedCompute' | 'estimatedRAM' | 'estimatedStorage'> {
  
  // Base requirements by job type
  const requirements: Record<string, any> = {
    mnist_training: {
      estimatedVRAM: 4,
      estimatedCompute: 5,
      estimatedRAM: 8,
      estimatedStorage: 2
    },
    stable_diffusion: {
      estimatedVRAM: 12,
      estimatedCompute: 15,
      estimatedRAM: 16,
      estimatedStorage: 10
    },
    inference: {
      estimatedVRAM: 6,
      estimatedCompute: 8,
      estimatedRAM: 8,
      estimatedStorage: 5
    },
    rendering: {
      estimatedVRAM: 8,
      estimatedCompute: 10,
      estimatedRAM: 16,
      estimatedStorage: 20
    },
    custom_script: {
      estimatedVRAM: 8,
      estimatedCompute: 10,
      estimatedRAM: 16,
      estimatedStorage: 10
    }
  };

  // Framework multipliers
  const frameworkMultipliers: Record<string, number> = {
    pytorch: 1.0,
    tensorflow: 1.2,
    jax: 1.1,
    none: 1.0
  };

  const baseReqs = requirements[jobType] || requirements.custom_script;
  const multiplier = frameworkMultipliers[framework] || 1.0;

  return {
    estimatedVRAM: Math.ceil(baseReqs.estimatedVRAM * multiplier),
    estimatedCompute: Math.ceil(baseReqs.estimatedCompute * multiplier),
    estimatedRAM: Math.ceil(baseReqs.estimatedRAM * multiplier),
    estimatedStorage: baseReqs.estimatedStorage
  };
}

/**
 * Main analysis function that coordinates all parsers
 * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function analyzeJobFile(
  fileName: string,
  content: string
): JobAnalysis {
  let partialAnalysis: Partial<JobAnalysis> = {};

  // Determine file type and analyze accordingly
  if (fileName.endsWith('.py')) {
    partialAnalysis = analyzePythonScript(content);
  } else if (fileName.endsWith('.ipynb')) {
    partialAnalysis = analyzeJupyterNotebook(content);
  } else if (fileName.toLowerCase().includes('dockerfile')) {
    partialAnalysis = analyzeDockerfile(content);
  } else {
    // Unknown file type - use defaults
    partialAnalysis = {
      jobType: 'custom_script',
      detectedFramework: 'none',
      confidence: 'low'
    };
  }

  // Calculate GPU requirements based on detected job type
  const jobType = partialAnalysis.jobType || 'custom_script';
  const framework = partialAnalysis.detectedFramework || 'none';
  const gpuRequirements = calculateGPURequirements(jobType, framework);

  // Merge all analysis results
  const analysis: JobAnalysis = {
    jobType,
    detectedFramework: framework,
    confidence: partialAnalysis.confidence || 'low',
    ...gpuRequirements,
    // Override with any specific values from partial analysis
    ...(partialAnalysis.estimatedVRAM && { estimatedVRAM: partialAnalysis.estimatedVRAM }),
    ...(partialAnalysis.estimatedRAM && { estimatedRAM: partialAnalysis.estimatedRAM })
  };

  return analysis;
}
