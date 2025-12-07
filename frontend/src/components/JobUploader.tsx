/**
 * JobUploader Component
 * Drag-and-drop interface for file upload with validation and analysis
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { notify } from './ui';
import { API_BASE_URL } from '../config';
import { fadeInUp, scaleIn, successPulse } from '../utils/animations';

// Job Analysis interface matching backend
export interface JobAnalysis {
  jobType: 'mnist_training' | 'stable_diffusion' | 'custom_script' | 'inference' | 'rendering';
  detectedFramework: 'pytorch' | 'tensorflow' | 'jax' | 'none';
  estimatedVRAM: number; // GB
  estimatedCompute: number; // TFLOPS
  estimatedRAM: number; // GB
  estimatedStorage: number; // GB
  confidence: 'high' | 'medium' | 'low';
}

export interface JobUploaderProps {
  onFileAnalyzed: (analysis: JobAnalysis, file: File) => void;
  onError?: (error: Error) => void;
  maxFileSize?: number; // bytes, default 500MB
  acceptedTypes?: string[]; // default: ['.py', '.ipynb', '.csv', '.json', 'Dockerfile']
}

interface JobUploaderState {
  isDragging: boolean;
  uploadProgress: number; // 0-100
  uploadedFile: File | null;
  validationStatus: 'idle' | 'uploading' | 'upload_complete' | 'analyzing' | 'valid' | 'invalid';
  validationError: string | null;
  analysis: JobAnalysis | null;
}

const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const DEFAULT_ACCEPTED_TYPES = ['.py', '.ipynb', '.csv', '.json', 'dockerfile'];

export function JobUploader({
  onFileAnalyzed,
  onError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES
}: JobUploaderProps) {
  const [state, setState] = useState<JobUploaderState>({
    isDragging: false,
    uploadProgress: 0,
    uploadedFile: null,
    validationStatus: 'idle',
    validationError: null,
    analysis: null
  });

  /**
   * Validate file type and size
   * Requirements: 1.3, 15.5
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size (Requirement 15.5)
    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `File size exceeds ${sizeMB}MB limit. Please compress or split your file.`
      };
    }

    // Check file type (Requirement 1.7)
    const fileName = file.name.toLowerCase();
    const isValidType = acceptedTypes.some(type => 
      fileName.endsWith(type.toLowerCase())
    );

    if (!isValidType) {
      return {
        valid: false,
        error: `Unsupported file format. Supported formats: ${acceptedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }, [maxFileSize, acceptedTypes]);

  /**
   * Analyze file by calling backend endpoint
   * Requirements: 1.5, 1.6, 15.1, 15.2, 15.3, 15.4
   */
  const analyzeFile = useCallback(async (file: File): Promise<void> => {
    setState(prev => ({ 
      ...prev, 
      validationStatus: 'uploading',
      uploadProgress: 0
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload with progress tracking (Requirement 15.1)
      const xhr = new XMLHttpRequest();

      // Track upload progress (Requirement 15.1)
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setState(prev => ({ 
            ...prev, 
            uploadProgress: percentComplete,
            validationStatus: 'uploading'
          }));
        }
      });

      // Handle completion
      const uploadPromise = new Promise<JobAnalysis>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          // Upload complete, now analyzing (Requirements 15.2, 15.3)
          setState(prev => ({
            ...prev,
            uploadProgress: 100,
            validationStatus: 'upload_complete'
          }));

          // Brief delay to show "Upload complete" message
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              validationStatus: 'analyzing'
            }));
          }, 500);

          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response.analysis);
              } else {
                reject(new Error(response.error || 'Analysis failed'));
              }
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
      });

      xhr.open('POST', `${API_BASE_URL}/api/jobs/analyze`);
      xhr.send(formData);

      const analysis = await uploadPromise;

      // Analysis complete (Requirement 15.4)
      setState(prev => ({
        ...prev,
        uploadProgress: 100,
        validationStatus: 'valid',
        analysis,
        validationError: null
      }));

      // Display validation results (Requirement 15.4)
      notify.success(`File analyzed: ${analysis.jobType} detected with ${analysis.confidence} confidence`);

      // Callback with analysis results
      onFileAnalyzed(analysis, file);

    } catch (error: any) {
      console.error('File analysis error:', error);
      
      setState(prev => ({
        ...prev,
        validationStatus: 'invalid',
        validationError: error.message,
        uploadProgress: 0
      }));

      notify.error(`Analysis failed: ${error.message}`);

      if (onError) {
        onError(error);
      }
    }
  }, [onFileAnalyzed, onError]);

  /**
   * Handle file drop
   * Requirements: 1.2, 1.3, 1.8
   */
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setState(prev => ({ ...prev, isDragging: false }));

    // Handle rejected files (Requirement 1.8)
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map((e: any) => e.message).join(', ');
        return `${file.name}: ${errorMessages}`;
      });
      
      notify.error(`Some files were rejected: ${errors.join('; ')}`);
    }

    // Process first accepted file (Requirement 1.8)
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file (Requirement 1.3)
      const validation = validateFile(file);
      
      if (!validation.valid) {
        setState(prev => ({
          ...prev,
          validationStatus: 'invalid',
          validationError: validation.error || 'Invalid file',
          uploadedFile: null
        }));
        
        notify.error(validation.error || 'Invalid file');
        return;
      }

      // File is valid, proceed with upload and analysis
      setState(prev => ({
        ...prev,
        uploadedFile: file,
        validationStatus: 'uploading',
        validationError: null
      }));

      await analyzeFile(file);
    }
  }, [validateFile, analyzeFile]);

  /**
   * Setup dropzone with drag-and-drop
   * Requirements: 1.1, 1.2
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setState(prev => ({ ...prev, isDragging: true })),
    onDragLeave: () => setState(prev => ({ ...prev, isDragging: false })),
    multiple: false, // Only accept one file at a time
    maxSize: maxFileSize,
    accept: {
      'text/x-python': ['.py'],
      'application/x-ipynb+json': ['.ipynb'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['dockerfile']
    }
  });

  /**
   * Format file size for display
   * Requirement: 1.4
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Get status icon based on validation state
   * Requirements: 15.2, 15.3
   */
  const getStatusIcon = () => {
    switch (state.validationStatus) {
      case 'uploading':
        return <Upload className="w-6 h-6 text-cyan-500 animate-pulse" />;
      case 'upload_complete':
        return <CheckCircle className="w-6 h-6 text-green-500" />; // Requirement 15.2
      case 'analyzing':
        return <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />; // Requirement 15.3
      case 'valid':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Upload className="w-6 h-6 text-cyan-500" />;
    }
  };

  /**
   * Get status message
   * Requirements: 15.2, 15.3, 15.4
   */
  const getStatusMessage = (): string => {
    switch (state.validationStatus) {
      case 'uploading':
        return 'Uploading file...';
      case 'upload_complete':
        return 'Upload complete'; // Requirement 15.2
      case 'analyzing':
        return 'Analyzing...'; // Requirement 15.3
      case 'valid':
        return 'Analysis complete'; // Requirement 15.4
      case 'invalid':
        return state.validationError || 'Validation failed';
      default:
        return 'Drag and drop your file here, or click to browse';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Drag-and-drop zone (Requirements: 1.1, 1.2) */}
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer
            ${isDragActive || state.isDragging
              ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,212,255,0.3)]'
              : 'border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800/50'
            }
            ${state.validationStatus === 'valid' ? 'border-green-500 bg-green-500/10' : ''}
            ${state.validationStatus === 'invalid' ? 'border-red-500 bg-red-500/10' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Status Icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700">
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <div className="text-center">
              <p className="text-lg font-medium text-white mb-1">
                {getStatusMessage()}
              </p>
              <p className="text-sm text-slate-400">
                Supported formats: {acceptedTypes.join(', ')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Maximum file size: {formatFileSize(maxFileSize)}
              </p>
            </div>

            {/* Upload Progress Bar (Requirement 15.1) */}
            {(state.validationStatus === 'uploading' || state.validationStatus === 'upload_complete') && state.uploadProgress > 0 && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>
                    {state.validationStatus === 'uploading' ? 'Uploading...' : 'Upload complete ✓'}
                  </span>
                  <span>{state.uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      state.validationStatus === 'upload_complete'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${state.uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Preview (Requirement 1.4) */}
        <AnimatePresence>
          {state.uploadedFile && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-start gap-3">
                <File className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {state.uploadedFile.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Size: {formatFileSize(state.uploadedFile.size)} • 
                    Type: {state.uploadedFile.type || 'Unknown'}
                  </p>
                </div>
                {state.validationStatus === 'valid' && (
                  <motion.div
                    variants={successPulse}
                    initial="initial"
                    animate="animate"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Results Display (Requirement 15.4) */}
        <AnimatePresence>
          {state.analysis && state.validationStatus === 'valid' && (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/30"
            >
              <h4 className="text-sm font-semibold text-cyan-400 mb-3">Analysis Results</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">Job Type</p>
                <p className="text-sm font-medium text-white capitalize">
                  {state.analysis.jobType.replace(/_/g, ' ')}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400">Framework</p>
                <p className="text-sm font-medium text-white capitalize">
                  {state.analysis.detectedFramework}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400">Required VRAM</p>
                <p className="text-sm font-medium text-white">
                  {state.analysis.estimatedVRAM} GB
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400">Required Compute</p>
                <p className="text-sm font-medium text-white">
                  {state.analysis.estimatedCompute} TFLOPS
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400">Required RAM</p>
                <p className="text-sm font-medium text-white">
                  {state.analysis.estimatedRAM} GB
                </p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400">Confidence</p>
                <p className={`text-sm font-medium capitalize ${
                  state.analysis.confidence === 'high' ? 'text-green-400' :
                  state.analysis.confidence === 'medium' ? 'text-yellow-400' :
                  'text-orange-400'
                }`}>
                  {state.analysis.confidence}
                </p>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display (Requirement 1.7) */}
        <AnimatePresence>
          {state.validationStatus === 'invalid' && state.validationError && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg"
            >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-300">Validation Error</p>
                <p className="text-sm text-red-200 mt-1">{state.validationError}</p>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <AnimatePresence>
          {state.uploadedFile && state.validationStatus !== 'uploading' && state.validationStatus !== 'analyzing' && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-4 flex gap-3 justify-end"
            >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setState({
                  isDragging: false,
                  uploadProgress: 0,
                  uploadedFile: null,
                  validationStatus: 'idle',
                  validationError: null,
                  analysis: null
                });
              }}
            >
              Clear
            </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
