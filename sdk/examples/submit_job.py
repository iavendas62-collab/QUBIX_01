#!/usr/bin/env python3
"""
Example: Submit a compute job using Qubix SDK
"""

from qubix import QubixClient

# Initialize client
client = QubixClient(api_url="http://localhost:3001", user_id="demo_user")

# Submit a job
print("Submitting job...")
job = client.submit_job(
    model_type="gpt2",
    dataset="https://example.com/dataset.csv",
    compute_needed=10,  # TFLOPS
    budget=100  # QUBIC
)

print(f"✅ Job submitted! ID: {job.job_id}")

# Check status
status = job.get_status()
print(f"Status: {status['status']}")

# Wait for completion (optional)
# final_status = job.wait_for_completion()
# print(f"Final status: {final_status['status']}")
