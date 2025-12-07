/**
 * Performance Monitoring Utilities
 * Track and optimize application performance
 */

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  fn: () => T,
  label: string
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

/**
 * Measure async function execution time
 */
export async function measurePerformanceAsync<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  
  return result;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    }
  };
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options: IntersectionObserverInit = {}
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src;
        observer.disconnect();
      }
    });
  }, {
    rootMargin: '50px',
    ...options,
  });

  observer.observe(img);

  // Return cleanup function
  return () => observer.disconnect();
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'script':
      link.as = 'script';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'image':
      link.as = 'image';
      break;
    case 'font':
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      break;
  }
  
  document.head.appendChild(link);
}

/**
 * Check if user is on slow network
 */
export function isSlowNetwork(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    // Check effective type
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return true;
    }
    
    // Check downlink speed (Mbps)
    if (connection.downlink < 1) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get network information
 */
export function getNetworkInfo(): {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  
  return {};
}

/**
 * Monitor page load performance
 */
export function monitorPageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    // Wait for all resources to load
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        console.log('[Performance] Page Load Metrics:', {
          'DNS Lookup': `${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`,
          'TCP Connection': `${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`,
          'Request Time': `${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`,
          'Response Time': `${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`,
          'DOM Processing': `${(perfData.domComplete - perfData.domInteractive).toFixed(2)}ms`,
          'Total Load Time': `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
        });
      }

      // Log largest contentful paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[Performance] Largest Contentful Paint:', `${lastEntry.startTime.toFixed(2)}ms`);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }, 0);
  });
}

/**
 * Create performance mark
 */
export function mark(name: string) {
  performance.mark(name);
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string) {
  performance.measure(name, startMark, endMark);
  const measure = performance.getEntriesByName(name)[0];
  console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
}

/**
 * Clear performance marks and measures
 */
export function clearPerformance() {
  performance.clearMarks();
  performance.clearMeasures();
}

