#!/usr/bin/env python3
"""
Integration test for QUBIX Worker with Backend
Tests the complete job execution flow
"""

import sys
import os
import time
import requests
import json

# Add worker directory to path
sys.path.insert(0, os.path.dirname(__file__))

from qubix_worker_simple import QubixWorkerSimple

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://127.0.0.1:3001')

def test_backend_connection():
    """Test backend is reachable"""
    print("=" * 60)
    print("TEST 1: Backend Connection")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Backend is reachable: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print(f"   Make sure backend is running at {BACKEND_URL}")
        return False

def test_provider_registration():
    """Test provider registration"""
    print("\n" + "=" * 60)
    print("TEST 2: Provider Registration")
    print("=" * 60)
    
    worker = QubixWorkerSimple(backend_url=BACKEND_URL)
    success = worker.register_provider()
    
    if success:
        print(f"✅ Provider registered successfully")
        print(f"   Worker ID: {worker.worker_id}")
        return worker
    else:
        print(f"❌ Provider registration failed")
        return None

def test_heartbeat(worker):
    """Test heartbeat functionality"""
    print("\n" + "=" * 60)
    print("TEST 3: Heartbeat")
    print("=" * 60)
    
    try:
        pending_jobs = worker.send_heartbeat()
        print(f"✅ Heartbeat sent successfully")
        print(f"   Pending jobs: {len(pending_jobs)}")
        return True
    except Exception as e:
        print(f"❌ Heartbeat failed: {e}")
        return False

def test_job_creation(worker):
    """Test job creation via API"""
    print("\n" + "=" * 60)
    print("TEST 4: Job Creation")
    print("=" * 60)
    
    try:
        # Create a test job
        job_data = {
            'modelType': 'training',
            'computeNeeded': 1.0,
            'inputData': {
                'dataset': 'test-dataset',
                'epochs': 3
            },
            'maxPrice': 10.0,
            'qubicAddress': 'A' * 60  # Test address
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/jobs/create",
            json=job_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Job created successfully")
            print(f"   Job ID: {data['job']['id']}")
            print(f"   Status: {data['job']['status']}")
            print(f"   Estimated Cost: {data['estimatedCost']} QUBIC")
            return data['job']
        else:
            print(f"❌ Job creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Job creation error: {e}")
        return None

def test_job_execution(worker, job):
    """Test job execution"""
    print("\n" + "=" * 60)
    print("TEST 5: Job Execution")
    print("=" * 60)
    
    if not job:
        print("⚠️  Skipping - no job to execute")
        return False
    
    try:
        # Execute the job
        print(f"Executing job {job['id']}...")
        success = worker.execute_job(job)
        
        if success:
            print(f"✅ Job executed successfully")
            return True
        else:
            print(f"❌ Job execution failed")
            return False
            
    except Exception as e:
        print(f"❌ Job execution error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_job_status(job_id):
    """Test job status retrieval"""
    print("\n" + "=" * 60)
    print("TEST 6: Job Status")
    print("=" * 60)
    
    if not job_id:
        print("⚠️  Skipping - no job ID")
        return False
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/jobs/{job_id}",
            timeout=5
        )
        
        if response.status_code == 200:
            job = response.json()
            print(f"✅ Job status retrieved")
            print(f"   Status: {job['status']}")
            print(f"   Progress: {job['progress']}%")
            if job.get('result'):
                print(f"   Result: {json.dumps(job['result'], indent=2)}")
            return True
        else:
            print(f"❌ Failed to get job status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting job status: {e}")
        return False

def main():
    """Run integration tests"""
    print("\n" + "=" * 60)
    print("QUBIX WORKER INTEGRATION TEST SUITE")
    print("=" * 60 + "\n")
    
    print(f"Backend URL: {BACKEND_URL}\n")
    
    # Test 1: Backend connection
    if not test_backend_connection():
        print("\n❌ Cannot proceed without backend connection")
        sys.exit(1)
    
    # Test 2: Provider registration
    worker = test_provider_registration()
    if not worker:
        print("\n❌ Cannot proceed without provider registration")
        sys.exit(1)
    
    # Test 3: Heartbeat
    if not test_heartbeat(worker):
        print("\n⚠️  Heartbeat failed, but continuing...")
    
    # Test 4: Job creation
    job = test_job_creation(worker)
    
    # Test 5: Job execution
    if job:
        test_job_execution(worker, job)
        
        # Wait a moment for backend to process
        time.sleep(2)
        
        # Test 6: Job status
        test_job_status(job['id'])
    else:
        print("\n⚠️  Skipping job execution tests - no job created")
    
    print("\n" + "=" * 60)
    print("✅ INTEGRATION TESTS COMPLETED")
    print("=" * 60)
    print("\nNote: Some tests may be skipped if backend is not fully configured")

if __name__ == "__main__":
    main()
