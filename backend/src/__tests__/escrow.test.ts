/**
 * Escrow Service Tests
 * 
 * Tests for the escrow payment system
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { escrowService } from '../services/escrow.service';
import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

describe('Escrow Service', () => {
  let testUserId: string;
  let testJobId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        qubicAddress: 'TEST_ADDRESS_60_CHARS_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        username: 'test-escrow-user',
        balance: 1000
      }
    });
    testUserId = testUser.id;

    // Create test job
    const testJob = await prisma.job.create({
      data: {
        userId: testUserId,
        modelType: 'mnist_training',
        computeNeeded: 10,
        inputData: { epochs: 5 },
        estimatedCost: 50,
        status: 'PENDING'
      }
    });
    testJobId = testJob.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transaction.deleteMany({ where: { userId: testUserId } });
    await prisma.job.delete({ where: { id: testJobId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('getEscrowStatus', () => {
    it('should return null for job without escrow', async () => {
      const status = await escrowService.getEscrowStatus(testJobId);
      expect(status).toBeNull();
    });

    it('should return escrow status when escrow exists', async () => {
      // Create a mock escrow transaction
      const escrow = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.ESCROW_LOCK,
          amount: 50,
          status: TransactionStatus.PENDING,
          qubicTxHash: 'test-tx-hash'
        }
      });

      const status = await escrowService.getEscrowStatus(testJobId);
      
      expect(status).not.toBeNull();
      expect(status?.jobId).toBe(testJobId);
      expect(status?.amount).toBe(50);
      expect(status?.status).toBe('pending');
      expect(status?.txHash).toBe('test-tx-hash');

      // Cleanup
      await prisma.transaction.delete({ where: { id: escrow.id } });
    });
  });

  describe('getPendingEscrows', () => {
    it('should return list of pending escrows', async () => {
      // Create a pending escrow
      const escrow = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.ESCROW_LOCK,
          amount: 50,
          status: TransactionStatus.PENDING,
          qubicTxHash: 'test-tx-hash-2'
        }
      });

      const pendingEscrows = await escrowService.getPendingEscrows();
      
      expect(Array.isArray(pendingEscrows)).toBe(true);
      expect(pendingEscrows.length).toBeGreaterThan(0);
      
      const ourEscrow = pendingEscrows.find(e => e.escrowId === escrow.id);
      expect(ourEscrow).toBeDefined();
      expect(ourEscrow?.status).toBe('pending');

      // Cleanup
      await prisma.transaction.delete({ where: { id: escrow.id } });
    });
  });

  describe('lockEscrow validation', () => {
    it('should reject negative amounts', async () => {
      const result = await escrowService.lockEscrow({
        jobId: testJobId,
        consumerSeed: 'a'.repeat(55),
        providerAddress: 'B'.repeat(60),
        amount: -10,
        duration: 24
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should reject invalid provider address', async () => {
      const result = await escrowService.lockEscrow({
        jobId: testJobId,
        consumerSeed: 'a'.repeat(55),
        providerAddress: 'invalid',
        amount: 50,
        duration: 24
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid provider address');
    });

    it('should reject duplicate escrow for same job', async () => {
      // Create existing escrow
      const existingEscrow = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.ESCROW_LOCK,
          amount: 50,
          status: TransactionStatus.PENDING
        }
      });

      const result = await escrowService.lockEscrow({
        jobId: testJobId,
        consumerSeed: 'a'.repeat(55),
        providerAddress: 'B'.repeat(60),
        amount: 50,
        duration: 24
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');

      // Cleanup
      await prisma.transaction.delete({ where: { id: existingEscrow.id } });
    });
  });

  describe('releaseEscrow validation', () => {
    it('should reject release without confirmed escrow', async () => {
      const result = await escrowService.releaseEscrow({
        jobId: testJobId,
        providerAddress: 'B'.repeat(60),
        amount: 50
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No confirmed escrow');
    });

    it('should reject double release', async () => {
      // Create confirmed escrow
      const escrow = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.ESCROW_LOCK,
          amount: 50,
          status: TransactionStatus.COMPLETED
        }
      });

      // Create release transaction
      const release = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.ESCROW_RELEASE,
          amount: 50,
          status: TransactionStatus.COMPLETED
        }
      });

      const result = await escrowService.releaseEscrow({
        jobId: testJobId,
        providerAddress: 'B'.repeat(60),
        amount: 50
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already released or refunded');

      // Cleanup
      await prisma.transaction.delete({ where: { id: release.id } });
      await prisma.transaction.delete({ where: { id: escrow.id } });
    });
  });

  describe('refundEscrow validation', () => {
    it('should reject refund without confirmed escrow', async () => {
      const result = await escrowService.refundEscrow({
        jobId: testJobId,
        consumerAddress: 'A'.repeat(60),
        amount: 50
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No confirmed escrow');
    });

    it('should reject double refund', async () => {
      // Create confirmed escrow
      const escrow = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.ESCROW_LOCK,
          amount: 50,
          status: TransactionStatus.COMPLETED
        }
      });

      // Create refund transaction
      const refund = await prisma.transaction.create({
        data: {
          userId: testUserId,
          jobId: testJobId,
          type: TransactionType.REFUND,
          amount: 50,
          status: TransactionStatus.COMPLETED
        }
      });

      const result = await escrowService.refundEscrow({
        jobId: testJobId,
        consumerAddress: 'A'.repeat(60),
        amount: 50
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already released or refunded');

      // Cleanup
      await prisma.transaction.delete({ where: { id: refund.id } });
      await prisma.transaction.delete({ where: { id: escrow.id } });
    });
  });
});
