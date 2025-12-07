# Qubix API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

Currently using simple header-based user identification:
```
x-user-id: your_user_id
```

Future: JWT-based authentication

---

## Jobs

### Submit Job
```http
POST /jobs/submit
Content-Type: application/json

{
  "modelType": "gpt2",
  "dataset": "https://example.com/data.csv",
  "computeNeeded": 10,
  "budget": 100
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid"
}
```

### Get Job Status
```http
GET /jobs/:jobId
```

**Response:**
```json
{
  "id": "uuid",
  "userId": "user123",
  "modelType": "gpt2",
  "status": "RUNNING",
  "computeNeeded": 10,
  "budget": 100,
  "provider": {
    "id": "provider_uuid",
    "address": "QUBIC_ADDRESS"
  },
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### List User Jobs
```http
GET /jobs/user/:userId
```

### Cancel Job
```http
POST /jobs/:jobId/cancel
```

---

## Providers

### Register Provider
```http
POST /providers/register
Content-Type: application/json

{
  "address": "QUBIC_ADDRESS",
  "computePower": 100,
  "pricePerHour": 10
}
```

### List Providers
```http
GET /providers
```

**Response:**
```json
[
  {
    "id": "uuid",
    "address": "QUBIC_ADDRESS",
    "computePower": 100,
    "pricePerHour": 10,
    "reputation": 0.85,
    "totalJobs": 50,
    "isActive": true
  }
]
```

### Get Provider Details
```http
GET /providers/:address
```

### Update Provider Status
```http
PATCH /providers/:address/status
Content-Type: application/json

{
  "isActive": true
}
```

---

## Models

### List Models
```http
GET /models?modelType=gpt2&sortBy=downloads
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Fine-tuned GPT-2",
    "description": "GPT-2 trained on custom dataset",
    "modelType": "gpt2",
    "price": 50,
    "downloads": 100,
    "owner": "user123"
  }
]
```

### Get Model Details
```http
GET /models/:id
```

### Publish Model
```http
POST /models/publish
Content-Type: application/json

{
  "name": "My Model",
  "description": "Description",
  "modelType": "gpt2",
  "fileUrl": "https://storage.com/model.pt",
  "price": 50,
  "royalty": 2.0
}
```

### Download Model
```http
POST /models/:id/download
```

---

## Stats

### Get Network Statistics
```http
GET /stats
```

**Response:**
```json
{
  "jobs": {
    "total": 1000,
    "active": 50
  },
  "providers": {
    "total": 100,
    "active": 75
  },
  "models": {
    "total": 200
  },
  "network": {
    "totalComputors": 676,
    "availableCompute": 1000,
    "averagePrice": 0.5
  }
}
```

---

## WebSocket

Connect to: `ws://localhost:3001`

### Subscribe to Job Updates
```json
{
  "type": "subscribe",
  "jobId": "uuid"
}
```

### Receive Updates
```json
{
  "type": "job_update",
  "jobId": "uuid",
  "data": {
    "status": "RUNNING",
    "progress": 0.5
  }
}
```

### Unsubscribe
```json
{
  "type": "unsubscribe",
  "jobId": "uuid"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error
