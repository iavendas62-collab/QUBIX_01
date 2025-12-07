/**
 * Import Verification Test
 * 
 * This file verifies that the QuickProvider component and its types
 * can be imported without errors.
 */

import { QuickProvider } from '../QuickProvider';
import type { 
  GPUInfo, 
  CPUInfo, 
  RAMInfo, 
  QuickProviderProps 
} from '../QuickProvider';

// Type checks
const gpuInfo: GPUInfo = {
  vendor: 'NVIDIA',
  model: 'GeForce RTX 4090',
  type: 'webgpu'
};

const cpuInfo: CPUInfo = {
  model: '8-core CPU',
  cores: 8
};

const ramInfo: RAMInfo = {
  total: 16
};

const props: QuickProviderProps = {
  onSuccess: (provider) => console.log(provider),
  onError: (error) => console.error(error)
};

// Export verification
export { QuickProvider, gpuInfo, cpuInfo, ramInfo, props };

console.log('✅ QuickProvider component imports successfully');
