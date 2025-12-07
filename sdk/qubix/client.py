import requests
from typing import Optional, Dict, Any
from .models import Job, Provider, Model


class QubixClient:
    """Python client for Qubix Compute Hub"""
    
    def __init__(self, api_url: str = "http://localhost:3001", user_id: str = "anonymous"):
        self.api_url = api_url.rstrip('/')
        self.user_id = user_id
        self.session = requests.Session()
        self.session.headers.update({"x-user-id": user_id})
    
    def submit_job(
        self,
        model_type: str,
        dataset: str,
        compute_needed: int,
        budget: float
    ) -> Job:
        """Submit a new compute job"""
        response = self.session.post(
            f"{self.api_url}/api/jobs/submit",
            json={
                "modelType": model_type,
                "dataset": dataset,
                "computeNeeded": compute_needed,
                "budget": budget
            }
        )
        response.raise_for_status()
        data = response.json()
        return Job(job_id=data["jobId"], client=self)
    
    def get_job(self, job_id: str) -> Dict[str, Any]:
        """Get job status and details"""
        response = self.session.get(f"{self.api_url}/api/jobs/{job_id}")
        response.raise_for_status()
        return response.json()
    
    def list_jobs(self) -> list:
        """List all jobs for current user"""
        response = self.session.get(f"{self.api_url}/api/jobs/user/{self.user_id}")
        response.raise_for_status()
        return response.json()
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a job"""
        response = self.session.post(f"{self.api_url}/api/jobs/{job_id}/cancel")
        response.raise_for_status()
        return response.json()["success"]
    
    def register_provider(
        self,
        address: str,
        compute_power: int,
        price_per_hour: float
    ) -> Provider:
        """Register as a compute provider"""
        response = self.session.post(
            f"{self.api_url}/api/providers/register",
            json={
                "address": address,
                "computePower": compute_power,
                "pricePerHour": price_per_hour
            }
        )
        response.raise_for_status()
        return Provider(**response.json()["provider"])
    
    def list_providers(self) -> list:
        """List all active providers"""
        response = self.session.get(f"{self.api_url}/api/providers")
        response.raise_for_status()
        return [Provider(**p) for p in response.json()]
    
    def list_models(self, model_type: Optional[str] = None) -> list:
        """List available AI models"""
        params = {"modelType": model_type} if model_type else {}
        response = self.session.get(f"{self.api_url}/api/models", params=params)
        response.raise_for_status()
        return [Model(**m) for m in response.json()]
    
    def publish_model(
        self,
        name: str,
        description: str,
        model_type: str,
        file_url: str,
        price: float,
        royalty: float
    ) -> Model:
        """Publish a trained model"""
        response = self.session.post(
            f"{self.api_url}/api/models/publish",
            json={
                "name": name,
                "description": description,
                "modelType": model_type,
                "fileUrl": file_url,
                "price": price,
                "royalty": royalty
            }
        )
        response.raise_for_status()
        return Model(**response.json()["model"])
    
    def get_stats(self) -> Dict[str, Any]:
        """Get network statistics"""
        response = self.session.get(f"{self.api_url}/api/stats")
        response.raise_for_status()
        return response.json()
