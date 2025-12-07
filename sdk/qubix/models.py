from dataclasses import dataclass
from typing import Optional, Any
from datetime import datetime


@dataclass
class Job:
    """Represents a compute job"""
    job_id: str
    client: Any = None
    
    def get_status(self) -> dict:
        """Get current job status"""
        if not self.client:
            raise ValueError("Client not initialized")
        return self.client.get_job(self.job_id)
    
    def cancel(self) -> bool:
        """Cancel this job"""
        if not self.client:
            raise ValueError("Client not initialized")
        return self.client.cancel_job(self.job_id)
    
    def wait_for_completion(self, poll_interval: int = 5) -> dict:
        """Wait for job to complete"""
        import time
        while True:
            status = self.get_status()
            if status["status"] in ["COMPLETED", "FAILED", "CANCELLED"]:
                return status
            time.sleep(poll_interval)


@dataclass
class Provider:
    """Represents a compute provider"""
    id: str
    address: str
    computePower: int
    pricePerHour: float
    reputation: float
    totalJobs: int
    isActive: bool
    createdAt: str
    updatedAt: str


@dataclass
class Model:
    """Represents an AI model"""
    id: str
    name: str
    description: str
    owner: str
    modelType: str
    fileUrl: str
    downloads: int
    price: float
    royalty: float
    createdAt: str
    updatedAt: str
