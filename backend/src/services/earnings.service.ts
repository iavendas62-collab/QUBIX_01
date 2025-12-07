import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EarningsData {
  totalEarned: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingPayouts: number;
  averageHourlyRate: number;
  earningsHistory: EarningEntry[];
}

export interface EarningEntry {
  date: string;
  amount: number;
  jobCount: number;
}

export interface ActiveJob {
  jobId: string;
  clientAddress: string;
  gpuUsed: string;
  durationSoFar: number; // seconds
  earningsSoFar: number; // QUBIC, live
  estimatedTotal: number; // QUBIC
  status: 'running' | 'paused';
  startedAt: Date;
  pricePerHour: number;
}

export interface PerformanceMetrics {
  uptimePercent: number;
  jobsCompleted: number;
  averageRating: number;
  responseTime: number; // ms
}

export interface ProviderEarningsResponse {
  earnings: EarningsData;
  activeJobs: ActiveJob[];
  transactionHistory: any[];
  performanceMetrics: PerformanceMetrics;
}

/**
 * Calculate earnings for a provider
 * Requirements: 9.1, 9.2, 9.6
 */
export async function calculateProviderEarnings(providerId: string): Promise<EarningsData> {
  // Get provider details
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { 
      totalEarnings: true,
      userId: true,
      totalJobs: true
    }
  });

  if (!provider) {
    throw new Error('Provider not found');
  }

  // Get date ranges
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all completed jobs for this provider
  const completedJobs = await prisma.job.findMany({
    where: {
      providerId,
      status: 'COMPLETED'
    },
    select: {
      actualCost: true,
      estimatedCost: true,
      completedAt: true,
      startedAt: true,
      actualDuration: true
    }
  });

  // Calculate earnings by period
  let todayEarnings = 0;
  let weekEarnings = 0;
  let monthEarnings = 0;
  let totalHoursWorked = 0;
  const dailyEarnings: { [key: string]: { amount: number; jobCount: number } } = {};

  completedJobs.forEach(job => {
    const amount = job.actualCost || job.estimatedCost;
    const completedAt = job.completedAt || new Date();
    
    // Calculate hours worked for this job
    if (job.actualDuration) {
      totalHoursWorked += job.actualDuration / 3600; // Convert seconds to hours
    } else if (job.startedAt && job.completedAt) {
      const duration = (job.completedAt.getTime() - job.startedAt.getTime()) / 1000;
      totalHoursWorked += duration / 3600;
    }

    // Period calculations
    if (completedAt >= todayStart) todayEarnings += amount;
    if (completedAt >= weekStart) weekEarnings += amount;
    if (completedAt >= monthStart) monthEarnings += amount;

    // Group by date for history chart
    const dateKey = completedAt.toISOString().split('T')[0];
    if (!dailyEarnings[dateKey]) {
      dailyEarnings[dateKey] = { amount: 0, jobCount: 0 };
    }
    dailyEarnings[dateKey].amount += amount;
    dailyEarnings[dateKey].jobCount += 1;
  });

  // Calculate average hourly rate
  const averageHourlyRate = totalHoursWorked > 0 
    ? provider.totalEarnings / totalHoursWorked 
    : 0;

  // Get pending payouts from escrow transactions
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      userId: provider.userId,
      type: 'ESCROW_RELEASE',
      status: 'PENDING'
    },
    select: { amount: true }
  });

  const pendingPayouts = pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Build history array (last 30 days)
  const earningsHistory: EarningEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    earningsHistory.push({
      date: dateKey,
      amount: dailyEarnings[dateKey]?.amount || 0,
      jobCount: dailyEarnings[dateKey]?.jobCount || 0
    });
  }

  return {
    totalEarned: provider.totalEarnings,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    pendingPayouts,
    averageHourlyRate,
    earningsHistory
  };
}

/**
 * Calculate earnings-so-far for active jobs
 * Requirements: 9.2 - Live earnings updates
 */
export async function calculateActiveJobsEarnings(providerId: string): Promise<ActiveJob[]> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { pricePerHour: true }
  });

  if (!provider) {
    throw new Error('Provider not found');
  }

  // Get all running jobs for this provider
  const runningJobs = await prisma.job.findMany({
    where: {
      providerId,
      status: 'RUNNING'
    },
    include: {
      user: {
        select: {
          qubicAddress: true
        }
      }
    }
  });

  const now = Date.now();

  return runningJobs.map(job => {
    const startedAt = job.startedAt || job.createdAt;
    const elapsedSeconds = (now - startedAt.getTime()) / 1000;
    const elapsedHours = elapsedSeconds / 3600;
    
    // Calculate earnings so far: elapsed time × hourly rate
    const earningsSoFar = elapsedHours * provider.pricePerHour;
    
    // Estimated total based on estimated duration
    const estimatedTotal = job.estimatedCost || earningsSoFar;

    return {
      jobId: job.id,
      clientAddress: job.user.qubicAddress,
      gpuUsed: provider.pricePerHour.toString(), // Using price as identifier for now
      durationSoFar: Math.floor(elapsedSeconds),
      earningsSoFar: parseFloat(earningsSoFar.toFixed(4)),
      estimatedTotal: parseFloat(estimatedTotal.toFixed(4)),
      status: 'running' as const,
      startedAt,
      pricePerHour: provider.pricePerHour
    };
  });
}

/**
 * Get complete provider earnings data
 * Requirements: 9.1, 9.2, 9.6
 */
export async function getProviderEarnings(providerId: string): Promise<ProviderEarningsResponse> {
  // Get earnings data
  const earnings = await calculateProviderEarnings(providerId);
  
  // Get active jobs with live earnings
  const activeJobs = await calculateActiveJobsEarnings(providerId);
  
  // Get transaction history
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { userId: true, totalJobs: true, uptime: true }
  });

  if (!provider) {
    throw new Error('Provider not found');
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: provider.userId,
      type: { in: ['EARNING', 'ESCROW_RELEASE', 'PAYMENT'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      job: {
        select: {
          id: true,
          modelType: true
        }
      }
    }
  });

  // Transform transactions for frontend
  const transactionHistory = transactions.map(tx => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    qubicTxHash: tx.qubicTxHash,
    confirmations: tx.confirmations,
    createdAt: tx.createdAt,
    completedAt: tx.completedAt,
    jobId: tx.jobId,
    jobType: tx.job?.modelType
  }));

  // Calculate performance metrics
  const performanceMetrics: PerformanceMetrics = {
    uptimePercent: provider.uptime > 0 ? Math.min(100, provider.uptime / 100) : 0,
    jobsCompleted: provider.totalJobs,
    averageRating: 4.5, // Placeholder - would come from rating system
    responseTime: 150 // Placeholder - would come from monitoring
  };

  return {
    earnings,
    activeJobs,
    transactionHistory,
    performanceMetrics
  };
}

/**
 * Get live earnings update (lightweight for frequent polling)
 * Requirements: 9.2 - Update every 5 seconds
 */
export async function getLiveEarningsUpdate(providerId: string) {
  const activeJobs = await calculateActiveJobsEarnings(providerId);
  
  // Calculate today's earnings quickly
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todayCompletedJobs = await prisma.job.findMany({
    where: {
      providerId,
      status: 'COMPLETED',
      completedAt: {
        gte: todayStart
      }
    },
    select: {
      actualCost: true,
      estimatedCost: true
    }
  });

  const todayEarnings = todayCompletedJobs.reduce((sum, job) => {
    return sum + (job.actualCost || job.estimatedCost);
  }, 0);

  // Add earnings from active jobs
  const activeEarnings = activeJobs.reduce((sum, job) => sum + job.earningsSoFar, 0);

  return {
    todayEarnings: todayEarnings + activeEarnings,
    activeJobs,
    timestamp: new Date().toISOString()
  };
}
