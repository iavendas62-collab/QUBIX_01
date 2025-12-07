#!/usr/bin/env python3
"""
Test script for QUBIX Worker
Tests the enhanced worker functionality
"""

import sys
import os

# Add worker directory to path
sys.path.insert(0, os.path.dirname(__file__))

from qubix_worker_simple import QubixWorkerSimple
import json

def test_hardware_detection():
    """Test hardware detection"""
    print("=" * 60)
    print("TEST 1: Hardware Detection")
    print("=" * 60)
    
    worker = QubixWorkerSimple()
    specs = worker.get_hardware_specs()
    
    print(json.dumps(specs, indent=2))
    
    assert 'worker_id' in specs
    assert 'cpu_model' in specs
    assert 'cpu_cores' in specs
    assert 'ram_total_gb' in specs
    assert 'gpu_model' in specs
    
    print("✅ Hardware detection passed\n")

def test_gpu_metrics():
    """Test GPU metrics collection"""
    print("=" * 60)
    print("TEST 2: GPU Metrics Collection")
    print("=" * 60)
    
    worker = QubixWorkerSimple()
    usage = worker.get_current_usage()
    
    print(json.dumps(usage, indent=2))
    
    assert 'cpuPercent' in usage
    assert 'ramPercent' in usage
    assert 'timestamp' in usage
    
    print("✅ GPU metrics collection passed\n")

def test_job_execution():
    """Test job execution logic"""
    print("=" * 60)
    print("TEST 3: Job Execution Logic")
    print("=" * 60)
    
    worker = QubixWorkerSimple()
    
    # Test training job
    test_job = {
        'id': 'test-job-123',
        'modelType': 'training',
        'computeNeeded': 1.0,
        'inputData': {
            'dataset': 'test-dataset',
            'epochs': 5
        }
    }
    
    print("Testing training job execution...")
    result = worker._perform_compute('training', test_job['inputData'], 0, 5)
    print(f"Training result: {json.dumps(result, indent=2)}")
    
    assert 'epoch' in result
    assert 'loss' in result
    assert 'accuracy' in result
    
    # Test inference job
    print("\nTesting inference job execution...")
    result = worker._perform_compute('inference', {}, 0, 1)
    print(f"Inference result: {json.dumps(result, indent=2)}")
    
    assert 'prediction' in result
    assert 'confidence' in result
    
    print("✅ Job execution logic passed\n")

def test_result_generation():
    """Test result generation"""
    print("=" * 60)
    print("TEST 4: Result Generation")
    print("=" * 60)
    
    worker = QubixWorkerSimple()
    
    computation_data = {
        'epoch': 5,
        'loss': 0.123,
        'accuracy': 0.95
    }
    
    result = worker._generate_job_result('training', {}, computation_data)
    print(json.dumps(result, indent=2))
    
    assert 'jobType' in result
    assert 'status' in result
    assert 'modelUrl' in result
    assert 'finalMetrics' in result
    
    print("✅ Result generation passed\n")

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("QUBIX WORKER TEST SUITE")
    print("=" * 60 + "\n")
    
    try:
        test_hardware_detection()
        test_gpu_metrics()
        test_job_execution()
        test_result_generation()
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
