# Qubix Compute Hub - Architecture

## System Overview

Qubix is a decentralized AI compute marketplace built natively on Qubic, leveraging the "Outsourced Computations" feature from the official roadmap.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              (React + TypeScript + TailwindCSS)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                      Backend API                             │
│              (Node.js + Express + TypeScript)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Job Queue    │  │ Provider     │  │ Model Hub    │     │
│  │ (Bull/Redis) │  │ Matching     │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│ PostgreSQL   │ │  Redis   │ │ Qubic Node │
│  (Metadata)  │ │ (Cache)  │ │ (TCP/RPC)  │
└──────────────┘ └──────────┘ └────────────┘
```

## Core Components

### 1. Backend API (Node.js)
- **Job Management**: Submit, track, and manage compute jobs
- **Provider Registry**: Register and manage compute providers
- **Model Hub**: Publish and discover AI models
- **Qubic Integration**: TCP socket connection to Qubic node (port 21841)
- **Job Queue**: Bull queue with Redis for async job processing
- **WebSocket**: Real-time updates for job status

### 2. Frontend (React)
- **Dashboard**: Network statistics and overview
- **Job Submission**: Form to submit compute jobs
- **Job List**: Track user's jobs
- **Provider Dashboard**: Register and manage compute offerings
- **Model Hub**: Browse and download AI models

### 3. Smart Contracts (Qubic C++)
- **Job Escrow**: Lock funds until job completion
- **Payment Distribution**: Automatic payment to providers
- **Reputation System**: Track provider performance
- **Model Royalties**: Distribute earnings to model creators

### 4. SDK & CLI
- **Python SDK**: Programmatic access to Qubix
- **CLI Tool**: Command-line interface for quick operations

## Data Flow

### Job Submission Flow
1. User submits job via Frontend/CLI/SDK
2. Backend validates and creates job record in PostgreSQL
3. Job added to Bull queue for processing
4. Matching algorithm finds suitable provider
5. Job details sent to Qubic node via TCP
6. Provider receives job and starts computation
7. Real-time updates via WebSocket
8. On completion, payment released from escrow

### Provider Registration Flow
1. Provider submits registration via Frontend/SDK
2. Backend validates and stores in PostgreSQL
3. Provider marked as available for job matching
4. Reputation initialized at 0
5. Provider can update availability status

## Database Schema

### Key Tables
- **providers**: Compute provider information
- **jobs**: Compute job records
- **models**: AI model metadata
- **transactions**: Payment records

## Integration Points

### Qubic Network
- **TCP Socket**: Direct connection to Qubic node (port 21841)
- **Outsourced Computations**: Submit jobs to network
- **Smart Contracts**: On-chain escrow and payments

### Cross-Chain Bridges (Future)
- **Ethereum**: ERC-20 bridge for QUBIC tokens
- **Solana**: SPL token bridge

## Security Considerations

1. **Job Validation**: Input sanitization and validation
2. **Escrow System**: Funds locked until job completion
3. **Provider Reputation**: Track performance and reliability
4. **Rate Limiting**: Prevent API abuse
5. **Authentication**: JWT-based user authentication (future)

## Scalability

- **Horizontal Scaling**: Multiple backend instances behind load balancer
- **Database Sharding**: Partition by user_id or job_id
- **Redis Caching**: Reduce database load
- **CDN**: Static assets and model files
- **Queue Workers**: Separate job processing workers

## Monitoring & Observability

- **Logging**: Structured logs with Winston
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Alerts**: PagerDuty integration

## Future Enhancements

1. **GPU Support**: Specialized GPU compute jobs
2. **Federated Learning**: Privacy-preserving model training
3. **Model Versioning**: Track model iterations
4. **Advanced Matching**: ML-based provider selection
5. **Mobile Apps**: iOS and Android clients
