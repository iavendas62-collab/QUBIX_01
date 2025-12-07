/**
 * File Upload Utilities
 * Optimized file upload with chunking for large files (500MB+)
 */

export interface UploadOptions {
  chunkSize?: number; // bytes, default 5MB
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  signal?: AbortSignal;
}

export interface ChunkedUploadResult {
  fileId: string;
  url: string;
}

/**
 * Upload large file in chunks
 */
export async function uploadFileInChunks(
  file: File,
  uploadUrl: string,
  options: UploadOptions = {}
): Promise<ChunkedUploadResult> {
  const {
    chunkSize = 5 * 1024 * 1024, // 5MB default
    onProgress,
    onChunkComplete,
    signal,
  } = options;

  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedBytes = 0;

  // Initialize upload session
  const sessionResponse = await fetch(`${uploadUrl}/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
    }),
    signal,
  });

  if (!sessionResponse.ok) {
    throw new Error('Failed to initialize upload session');
  }

  const { uploadId } = await sessionResponse.json();

  // Upload chunks
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('chunk', chunk);

    const chunkResponse = await fetch(`${uploadUrl}/chunk`, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!chunkResponse.ok) {
      throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
    }

    uploadedBytes += chunk.size;
    const progress = (uploadedBytes / file.size) * 100;
    onProgress?.(progress);
    onChunkComplete?.(chunkIndex, totalChunks);
  }

  // Finalize upload
  const finalizeResponse = await fetch(`${uploadUrl}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId }),
    signal,
  });

  if (!finalizeResponse.ok) {
    throw new Error('Failed to finalize upload');
  }

  return await finalizeResponse.json();
}

/**
 * Upload file with automatic chunking for large files
 */
export async function uploadFile(
  file: File,
  uploadUrl: string,
  options: UploadOptions = {}
): Promise<ChunkedUploadResult> {
  const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB

  // Use chunked upload for large files
  if (file.size > LARGE_FILE_THRESHOLD) {
    return uploadFileInChunks(file, uploadUrl, options);
  }

  // Use standard upload for small files
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        options.onProgress?.(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid response from server'));
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

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

/**
 * Validate file before upload
 */
export interface FileValidation {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: {
    maxSize?: number; // bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidation {
  const {
    maxSize = 500 * 1024 * 1024, // 500MB default
    allowedTypes = [],
    allowedExtensions = ['.py', '.ipynb', '.csv', '.json', 'Dockerfile'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Please upload a smaller file.`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `File extension not supported. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

