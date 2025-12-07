/**
 * Skeleton - Loading state components
 * Requirements: 6.3 - Add loading states and skeleton screens
 */

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle' | 'button';
  animate?: boolean;
}

export function Skeleton({ 
  className = '', 
  variant = 'default',
  animate = true 
}: SkeletonProps) {
  const baseClasses = animate 
    ? 'skeleton-shimmer' 
    : 'bg-slate-700/50';
  
  const variantClasses = {
    default: 'h-4 rounded',
    card: 'h-32 rounded-lg',
    text: 'h-3 rounded',
    circle: 'rounded-full',
    button: 'h-10 rounded-lg',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div 
      className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4"
      role="status"
      aria-label="Loading card..."
    >
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="w-full" />
        <Skeleton className="w-5/6" />
      </div>
      <span className="sr-only">Loading card content...</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div 
      className="space-y-3"
      role="status"
      aria-label="Loading table..."
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/3" />
            <Skeleton variant="text" className="w-1/4" />
          </div>
          <Skeleton variant="button" className="w-24" />
        </div>
      ))}
      <span className="sr-only">Loading table rows...</span>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      role="status"
      aria-label="Loading statistics..."
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <Skeleton variant="circle" className="w-8 h-8 mb-3" />
          <Skeleton className="w-20 h-8 mb-2" />
          <Skeleton variant="text" className="w-16" />
        </div>
      ))}
      <span className="sr-only">Loading statistics...</span>
    </div>
  );
}

export function SkeletonChart() {
  // Pre-generate random heights to avoid re-renders
  const heights = [65, 45, 80, 55, 70, 40, 85, 60, 75, 50, 90, 55];
  
  return (
    <div 
      className="bg-slate-800 border border-slate-700 rounded-xl p-6"
      role="status"
      aria-label="Loading chart..."
    >
      <Skeleton className="w-40 h-6 mb-4" />
      <div className="h-[250px] flex items-end gap-2">
        {heights.map((height, i) => (
          <div key={i} className="flex-1" style={{ height: `${height}%` }}>
            <Skeleton className="w-full h-full rounded-t" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

export function SkeletonGPUCard() {
  return (
    <div 
      className="bg-slate-800 border border-slate-700 rounded-xl p-6"
      role="status"
      aria-label="Loading GPU card..."
    >
      <div className="flex items-start gap-4">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-3">
          <Skeleton className="w-32 h-5" />
          <Skeleton variant="text" className="w-48" />
          <div className="flex gap-2">
            <Skeleton className="w-16 h-6 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="w-24 h-7" />
          <Skeleton variant="text" className="w-16 ml-auto" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton variant="button" className="w-20" />
      </div>
      <span className="sr-only">Loading GPU information...</span>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page...">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-48 h-8" />
        <Skeleton variant="button" className="w-32" />
      </div>
      
      {/* Stats */}
      <SkeletonStats />
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonCard />
      </div>
      
      {/* Table */}
      <SkeletonTable rows={3} />
      
      <span className="sr-only">Loading page content...</span>
    </div>
  );
}

