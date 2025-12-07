# Qubix Smart Contracts

Smart contracts for the Qubix Compute Hub, written in Qubic C++.

## Contracts

### 1. JobEscrow.cpp
Handles payment escrow for compute jobs.

**Features:**
- Lock funds when job is created
- Release payment on completion
- Automatic refund if deadline passes
- Dispute resolution mechanism
- 3% protocol fee (burned for deflation)

**Functions:**
- `createJob()`: Create new job with escrow
- `startJob()`: Provider marks job as started
- `completeJob()`: Provider marks job complete, triggers payment
- `disputeJob()`: Either party can dispute
- `refundJob()`: Refund if deadline passed

### 2. ProviderRegistry.cpp
Manages compute provider registration and reputation.

**Features:**
- Provider registration with stake requirement
- Reputation system (0-1000 scale)
- Stake slashing for bad behavior
- Active/inactive status management

**Functions:**
- `registerProvider()`: Register as provider (min 1000 QUBIC stake)
- `updateProviderReputation()`: Update reputation after job
- `setProviderActive()`: Toggle provider availability
- `unstakeProvider()`: Withdraw stake (only when inactive)
- `getProviderReputation()`: Query reputation score

## Compilation

```bash
# Using Qubic compiler
qubic-cc JobEscrow.cpp -o JobEscrow.qbc
qubic-cc ProviderRegistry.cpp -o ProviderRegistry.qbc
```

## Deployment

```bash
# Deploy to Qubic testnet
qubic-cli deploy JobEscrow.qbc --network testnet
qubic-cli deploy ProviderRegistry.qbc --network testnet
```

## Testing

```bash
# Run contract tests
qubic-test JobEscrow.cpp
qubic-test ProviderRegistry.cpp
```

## Security Considerations

1. **Reentrancy Protection**: All state changes before external calls
2. **Access Control**: Only authorized parties can call sensitive functions
3. **Stake Requirements**: Minimum stake prevents spam
4. **Deadline Enforcement**: Automatic refunds protect consumers
5. **Fee Burning**: Protocol fees are burned (deflationary)

## Gas Optimization

- Fixed-size arrays for predictable gas costs
- Minimal storage operations
- Efficient address comparison
- Batch operations where possible

## Future Enhancements

1. **Multi-signature Escrow**: Require multiple approvals
2. **Partial Payments**: Release funds incrementally
3. **Insurance Pool**: Protect against provider failures
4. **DAO Governance**: Community-driven dispute resolution
5. **Cross-chain Bridges**: Integrate with Ethereum/Solana
