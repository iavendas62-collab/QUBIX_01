/**
 * Network Condition Simulator
 * Test application behavior under various network conditions
 * For development and testing only
 */

export interface NetworkCondition {
  name: string;
  downloadSpeed: number; // Kbps
  uploadSpeed: number; // Kbps
  latency: number; // ms
  packetLoss: number; // 0-1 (percentage)
}

export const NETWORK_PRESETS: Record<string, NetworkCondition> = {
  FAST_3G: {
    name: 'Fast 3G',
    downloadSpeed: 1600,
    uploadSpeed: 750,
    latency: 150,
    packetLoss: 0,
  },
  SLOW_3G: {
    name: 'Slow 3G',
    downloadSpeed: 400,
    uploadSpeed: 400,
    latency: 400,
    packetLoss: 0,
  },
  '2G': {
    name: '2G',
    downloadSpeed: 250,
    uploadSpeed: 50,
    latency: 800,
    packetLoss: 0,
  },
  OFFLINE: {
    name: 'Offline',
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    packetLoss: 1,
  },
  WIFI: {
    name: 'WiFi',
    downloadSpeed: 30000,
    uploadSpeed: 15000,
    latency: 2,
    packetLoss: 0,
  },
};

/**
 * Simulate network delay
 */
export function simulateNetworkDelay(latency: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, latency));
}

/**
 * Simulate packet loss
 */
export function simulatePacketLoss(packetLoss: number): boolean {
  return Math.random() < packetLoss;
}

/**
 * Wrap fetch with network simulation
 */
export function createSimulatedFetch(condition: NetworkCondition) {
  const originalFetch = window.fetch;

  return async function simulatedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Simulate packet loss
    if (simulatePacketLoss(condition.packetLoss)) {
      throw new Error('Network request failed (simulated packet loss)');
    }

    // Simulate latency
    await simulateNetworkDelay(condition.latency);

    // Make actual request
    const response = await originalFetch(input, init);

    // Simulate download speed throttling
    if (response.body && condition.downloadSpeed > 0) {
      const reader = response.body.getReader();
      const stream = new ReadableStream({
        async start(controller) {
          const bytesPerSecond = (condition.downloadSpeed * 1024) / 8;
          const chunkDelay = 100; // ms
          const bytesPerChunk = (bytesPerSecond * chunkDelay) / 1000;

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.close();
                break;
              }

              // Throttle by delaying chunks
              if (value.length > bytesPerChunk) {
                const chunks = Math.ceil(value.length / bytesPerChunk);
                for (let i = 0; i < chunks; i++) {
                  const start = i * bytesPerChunk;
                  const end = Math.min(start + bytesPerChunk, value.length);
                  controller.enqueue(value.slice(start, end));
                  await simulateNetworkDelay(chunkDelay);
                }
              } else {
                controller.enqueue(value);
                await simulateNetworkDelay(chunkDelay);
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  };
}

/**
 * Enable network simulation
 */
export function enableNetworkSimulation(condition: NetworkCondition) {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Network simulation should only be used in development');
    return;
  }

  console.log(`[Network Simulator] Enabled: ${condition.name}`, {
    download: `${condition.downloadSpeed} Kbps`,
    upload: `${condition.uploadSpeed} Kbps`,
    latency: `${condition.latency}ms`,
    packetLoss: `${(condition.packetLoss * 100).toFixed(1)}%`,
  });

  // Replace global fetch
  window.fetch = createSimulatedFetch(condition);
}

/**
 * Disable network simulation
 */
export function disableNetworkSimulation() {
  // This would require storing the original fetch
  // In practice, just reload the page
  console.log('[Network Simulator] Disabled - please reload page');
}

/**
 * Test component under various network conditions
 */
export async function testNetworkConditions(
  testFn: () => Promise<void>,
  conditions: NetworkCondition[] = Object.values(NETWORK_PRESETS)
): Promise<void> {
  console.log('[Network Simulator] Testing under various conditions...');

  for (const condition of conditions) {
    console.log(`\n[Network Simulator] Testing: ${condition.name}`);
    enableNetworkSimulation(condition);

    try {
      await testFn();
      console.log(`✓ ${condition.name} test passed`);
    } catch (error) {
      console.error(`✗ ${condition.name} test failed:`, error);
    }
  }

  console.log('\n[Network Simulator] All tests complete');
}
