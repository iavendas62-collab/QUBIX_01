// Qubix Job Escrow Smart Contract
// Handles payment escrow for compute jobs

#include "qubic.h"

struct JobEscrow {
    // Job details
    char jobId[64];
    char consumer[60];      // Consumer address
    char provider[60];      // Provider address
    uint64 amount;          // Escrow amount in QUBIC
    uint64 createdAt;
    uint64 deadline;
    uint8 status;           // 0=pending, 1=active, 2=completed, 3=disputed
    
    // Functions
    void create(const char* _jobId, const char* _consumer, const char* _provider, 
                uint64 _amount, uint64 _deadline) {
        // Copy job ID
        for (int i = 0; i < 64; i++) {
            jobId[i] = _jobId[i];
        }
        
        // Copy addresses
        for (int i = 0; i < 60; i++) {
            consumer[i] = _consumer[i];
            provider[i] = _provider[i];
        }
        
        amount = _amount;
        deadline = _deadline;
        createdAt = getCurrentTick();
        status = 0; // pending
        
        // Lock funds from consumer
        transfer(consumer, CONTRACT_ADDRESS, amount);
    }
    
    void startJob() {
        // Only provider can start
        if (!isCallerProvider()) return;
        
        status = 1; // active
    }
    
    void completeJob() {
        // Only provider can mark complete
        if (!isCallerProvider()) return;
        
        status = 2; // completed
        
        // Calculate fees (3% to protocol)
        uint64 fee = (amount * 3) / 100;
        uint64 providerPayment = amount - fee;
        
        // Transfer payment to provider
        transfer(CONTRACT_ADDRESS, provider, providerPayment);
        
        // Burn protocol fee (deflationary)
        burn(fee);
    }
    
    void dispute() {
        // Either party can dispute
        if (!isCallerConsumer() && !isCallerProvider()) return;
        
        status = 3; // disputed
        // Dispute resolution handled off-chain or by DAO
    }
    
    void refund() {
        // Refund if deadline passed and job not completed
        if (getCurrentTick() < deadline) return;
        if (status == 2) return; // Already completed
        
        // Refund consumer
        transfer(CONTRACT_ADDRESS, consumer, amount);
        status = 0;
    }
    
private:
    bool isCallerProvider() {
        char caller[60];
        getCaller(caller);
        return compareAddresses(caller, provider);
    }
    
    bool isCallerConsumer() {
        char caller[60];
        getCaller(caller);
        return compareAddresses(caller, consumer);
    }
    
    bool compareAddresses(const char* a, const char* b) {
        for (int i = 0; i < 60; i++) {
            if (a[i] != b[i]) return false;
        }
        return true;
    }
};

// Contract state
JobEscrow jobs[1000]; // Support up to 1000 concurrent jobs
uint32 jobCount = 0;

// Public functions
PUBLIC void createJob(const char* jobId, const char* consumer, const char* provider,
                      uint64 amount, uint64 deadline) {
    if (jobCount >= 1000) return; // Max capacity
    
    jobs[jobCount].create(jobId, consumer, provider, amount, deadline);
    jobCount++;
}

PUBLIC void startJob(uint32 jobIndex) {
    if (jobIndex >= jobCount) return;
    jobs[jobIndex].startJob();
}

PUBLIC void completeJob(uint32 jobIndex) {
    if (jobIndex >= jobCount) return;
    jobs[jobIndex].completeJob();
}

PUBLIC void disputeJob(uint32 jobIndex) {
    if (jobIndex >= jobCount) return;
    jobs[jobIndex].dispute();
}

PUBLIC void refundJob(uint32 jobIndex) {
    if (jobIndex >= jobCount) return;
    jobs[jobIndex].refund();
}
