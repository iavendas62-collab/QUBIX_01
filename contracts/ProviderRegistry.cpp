// Qubix Provider Registry Smart Contract
// Manages compute provider registration and reputation

#include "qubic.h"

struct Provider {
    char address[60];
    uint32 computePower;    // TFLOPS
    uint64 pricePerHour;    // QUBIC per hour
    uint32 reputation;      // 0-1000 scale
    uint32 totalJobs;
    uint32 completedJobs;
    uint32 failedJobs;
    uint64 stakedAmount;
    bool isActive;
    uint64 registeredAt;
    
    void register_(const char* _address, uint32 _computePower, uint64 _pricePerHour, uint64 _stake) {
        // Copy address
        for (int i = 0; i < 60; i++) {
            address[i] = _address[i];
        }
        
        computePower = _computePower;
        pricePerHour = _pricePerHour;
        reputation = 500; // Start at 50%
        totalJobs = 0;
        completedJobs = 0;
        failedJobs = 0;
        stakedAmount = _stake;
        isActive = true;
        registeredAt = getCurrentTick();
        
        // Lock stake
        transfer(_address, CONTRACT_ADDRESS, _stake);
    }
    
    void updateReputation(bool success) {
        totalJobs++;
        
        if (success) {
            completedJobs++;
            // Increase reputation (max 1000)
            if (reputation < 1000) {
                reputation += 10;
                if (reputation > 1000) reputation = 1000;
            }
        } else {
            failedJobs++;
            // Decrease reputation (min 0)
            if (reputation > 20) {
                reputation -= 20;
            } else {
                reputation = 0;
            }
        }
    }
    
    void setActive(bool active) {
        isActive = active;
    }
    
    void unstake() {
        if (!isActive) {
            // Return stake
            transfer(CONTRACT_ADDRESS, address, stakedAmount);
            stakedAmount = 0;
        }
    }
    
    uint32 getReputationScore() {
        return reputation;
    }
};

// Contract state
Provider providers[500]; // Support up to 500 providers
uint32 providerCount = 0;

// Public functions
PUBLIC void registerProvider(const char* address, uint32 computePower, 
                            uint64 pricePerHour, uint64 stake) {
    if (providerCount >= 500) return; // Max capacity
    
    // Minimum stake requirement: 1000 QUBIC
    if (stake < 1000) return;
    
    providers[providerCount].register_(address, computePower, pricePerHour, stake);
    providerCount++;
}

PUBLIC void updateProviderReputation(uint32 providerIndex, bool success) {
    if (providerIndex >= providerCount) return;
    providers[providerIndex].updateReputation(success);
}

PUBLIC void setProviderActive(uint32 providerIndex, bool active) {
    if (providerIndex >= providerCount) return;
    
    char caller[60];
    getCaller(caller);
    
    // Only provider can change their status
    bool isOwner = true;
    for (int i = 0; i < 60; i++) {
        if (caller[i] != providers[providerIndex].address[i]) {
            isOwner = false;
            break;
        }
    }
    
    if (isOwner) {
        providers[providerIndex].setActive(active);
    }
}

PUBLIC void unstakeProvider(uint32 providerIndex) {
    if (providerIndex >= providerCount) return;
    providers[providerIndex].unstake();
}

PUBLIC uint32 getProviderReputation(uint32 providerIndex) {
    if (providerIndex >= providerCount) return 0;
    return providers[providerIndex].getReputationScore();
}
