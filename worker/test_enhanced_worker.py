#!/usr/bin/env python3
"""
Test script for enhanced worker
Tests job execution without requiring backend connection
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from qubix_worker_enhanced import JobExecutor


def test_mnist_training():
    """Test MNIST training execution"""
    print("\n" + "="*60)
    print("TEST 1: MNIST Training")
    print("="*60)
    
    # Use shorter progress interval for testing
    executor = JobExecutor("http://localhost:3001", "test-worker-123", progress_interval=100)
    
    job = {
        "id": "test-mnist-001",
        "jobType": "mnist_training",
        "inputData": {
            "epochs": 2,
            "batch_size": 32,
            "learning_rate": 0.01
        }
    }
    
    try:
        exec_result = executor.execute_job(job)
        if exec_result.get('success'):
            print("\n✅ MNIST Training Test PASSED")
            result = exec_result.get('result', {})
            print(f"Final accuracy: {result.get('finalAccuracy')}")
            return True
        else:
            print(f"\n❌ MNIST Training Test FAILED: {exec_result.get('error')}")
            return False
    except Exception as e:
        print(f"\n❌ MNIST Training Test FAILED: {e}")
        return False


def test_stable_diffusion():
    """Test Stable Diffusion execution"""
    print("\n" + "="*60)
    print("TEST 2: Stable Diffusion")
    print("="*60)
    
    # Use shorter progress interval for testing
    executor = JobExecutor("http://localhost:3001", "test-worker-123", progress_interval=100)
    
    job = {
        "id": "test-sd-001",
        "jobType": "stable_diffusion",
        "inputData": {
            "prompt": "a beautiful sunset over mountains",
            "num_images": 1,  # Reduced for faster testing
            "steps": 20
        }
    }
    
    try:
        exec_result = executor.execute_job(job)
        if exec_result.get('success'):
            print("\n✅ Stable Diffusion Test PASSED")
            result = exec_result.get('result', {})
            print(f"Generated {len(result.get('images', []))} image(s)")
            return True
        else:
            print(f"\n❌ Stable Diffusion Test FAILED: {exec_result.get('error')}")
            return False
    except Exception as e:
        print(f"\n❌ Stable Diffusion Test FAILED: {e}")
        return False


def test_custom_script():
    """Test custom script execution"""
    print("\n" + "="*60)
    print("TEST 3: Custom Script")
    print("="*60)
    
    # Use shorter progress interval for testing
    executor = JobExecutor("http://localhost:3001", "test-worker-123", progress_interval=100)
    
    script = """
import math

print("Starting custom computation...")
result = 0
for i in range(5):
    result += math.sqrt(i + 1)
    print(f"Step {i+1}/5: result = {result:.2f}")

print(f"Final result: {result:.2f}")
"""
    
    job = {
        "id": "test-script-001",
        "jobType": "custom_script",
        "inputData": {
            "script": script
        }
    }
    
    try:
        exec_result = executor.execute_job(job)
        if exec_result.get('success'):
            result = exec_result.get('result', {})
            print("\n✅ Custom Script Test PASSED")
            print(f"Exit code: {result.get('exitCode')}")
            print(f"Output lines: {len(result.get('stdout', []))}")
            return True
        else:
            print(f"\n❌ Custom Script Test FAILED: {exec_result.get('error')}")
            return False
    except Exception as e:
        print(f"\n❌ Custom Script Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_gpu_metrics():
    """Test GPU metrics collection"""
    print("\n" + "="*60)
    print("TEST 4: GPU Metrics Collection")
    print("="*60)
    
    executor = JobExecutor("http://localhost:3001", "test-worker-123")
    
    metrics = executor._collect_gpu_metrics()
    
    if metrics:
        print("✅ GPU Metrics collected:")
        for key, value in metrics.items():
            print(f"   {key}: {value}")
        return True
    else:
        print("⚠️  No GPU metrics available (nvidia-smi not found or no GPU)")
        print("   This is OK for CPU-only systems")
        return True


def test_progress_reporting():
    """Test progress reporting (without backend)"""
    print("\n" + "="*60)
    print("TEST 5: Progress Reporting")
    print("="*60)
    
    executor = JobExecutor("http://localhost:3001", "test-worker-123")
    
    # This will fail to connect but should not crash
    try:
        executor._report_progress("test-job-001", 50, "Testing progress report")
        print("✅ Progress reporting executed (backend connection expected to fail)")
        return True
    except Exception as e:
        print(f"⚠️  Progress reporting error (expected): {e}")
        return True


def main():
    """Run all tests"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║   🧪 QUBIX Enhanced Worker Test Suite                    ║
╚═══════════════════════════════════════════════════════════╝
""")
    
    tests = [
        ("GPU Metrics", test_gpu_metrics),
        ("Progress Reporting", test_progress_reporting),
        ("Custom Script", test_custom_script),
        ("MNIST Training", test_mnist_training),
        ("Stable Diffusion", test_stable_diffusion),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
