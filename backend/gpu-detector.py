#!/usr/bin/env python3
"""
GPU Detector - Detecta automaticamente a GPU do sistema
e envia dados reais para o backend
"""
import sys
import json
import platform
import psutil
import time
import requests
from pathlib import Path

# Tentar importar bibliotecas de GPU
HAS_CUDA = False
HAS_GPUTIL = False

try:
    import torch
    HAS_CUDA = torch.cuda.is_available()
except ImportError:
    pass

try:
    import GPUtil
    HAS_GPUTIL = True
except ImportError:
    pass


def get_gpu_info():
    """Detecta informações da GPU"""
    gpu_info = {
        'detected': False,
        'model': 'No GPU Detected',
        'vram_gb': 0,
        'driver': 'N/A',
        'cuda_available': HAS_CUDA,
        'count': 0
    }
    
    # Método 1: GPUtil (NVIDIA GPUs)
    if HAS_GPUTIL:
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]  # Primeira GPU
                gpu_info.update({
                    'detected': True,
                    'model': gpu.name,
                    'vram_gb': round(gpu.memoryTotal / 1024, 2),  # MB para GB
                    'driver': gpu.driver,
                    'count': len(gpus),
                    'temperature': gpu.temperature,
                    'load': gpu.load * 100,
                    'memory_used': gpu.memoryUsed,
                    'memory_total': gpu.memoryTotal
                })
                print(f"[OK] GPU detected via GPUtil: {gpu.name}")
                return gpu_info
        except Exception as e:
            print(f"[WARN] GPUtil error: {e}")

    # Método 2: PyTorch CUDA
    if HAS_CUDA:
        try:
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)  # Bytes para GB
            gpu_info.update({
                'detected': True,
                'model': gpu_name,
                'vram_gb': round(gpu_memory, 2),
                'count': torch.cuda.device_count()
            })
            print(f"[OK] GPU detected via PyTorch: {gpu_name}")
            return gpu_info
        except Exception as e:
            print(f"[WARN] PyTorch error: {e}")

    # Método 3: Platform detection (fallback - menos preciso)
    try:
        if platform.system() == 'Windows':
            import subprocess
            result = subprocess.run(
                ['wmic', 'path', 'win32_VideoController', 'get', 'name'],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:
                    gpu_name = lines[1].strip()
                    if gpu_name and ('nvidia' in gpu_name.lower() or 'amd' in gpu_name.lower()):
                        gpu_info.update({
                            'detected': True,
                            'model': gpu_name,
                            'vram_gb': 2  # Estimate
                        })
                        print(f"[OK] GPU detected via WMIC: {gpu_name}")
                        return gpu_info
    except Exception as e:
        print(f"[WARN] Platform detection error: {e}")

    print("[ERROR] No GPU detected")
    return gpu_info


def get_cpu_info():
    """Detecta informações da CPU"""
    return {
        'model': platform.processor() or 'Unknown CPU',
        'cores': psutil.cpu_count(logical=False),
        'threads': psutil.cpu_count(logical=True),
        'usage': psutil.cpu_percent(interval=1)
    }


def get_ram_info():
    """Detecta informações da RAM"""
    ram = psutil.virtual_memory()
    return {
        'total_gb': round(ram.total / (1024**3), 2),
        'available_gb': round(ram.available / (1024**3), 2),
        'used_percent': ram.percent
    }


def get_real_time_metrics():
    """Coleta métricas em tempo real"""
    metrics = {
        'cpu_percent': psutil.cpu_percent(interval=0.5),
        'ram_percent': psutil.virtual_memory().percent,
        'timestamp': time.time()
    }
    
    # GPU metrics (se disponível)
    if HAS_GPUTIL:
        try:
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]
                metrics.update({
                    'gpu_percent': round(gpu.load * 100, 1),
                    'gpu_temp': gpu.temperature,
                    'gpu_mem_used_mb': gpu.memoryUsed,
                    'gpu_mem_total_mb': gpu.memoryTotal
                })
        except:
            pass
    
    return metrics


def register_with_backend(backend_url):
    """Registra GPU com o backend"""
    gpu_info = get_gpu_info()
    cpu_info = get_cpu_info()
    ram_info = get_ram_info()
    
    hostname = platform.node()
    worker_id = f"local_{hostname}_{int(time.time())}"
    
    payload = {
        'type': 'native',
        'workerId': worker_id,
        'qubicAddress': 'LOCAL_GPU_PROVIDER',  # Temporário
        'gpu': {
            'model': gpu_info['model'],
            'vram': gpu_info['vram_gb'],
            'detected': gpu_info['detected'],
            'cuda_available': gpu_info['cuda_available'],
            'count': gpu_info['count']
        },
        'cpu': cpu_info,
        'ram': ram_info,
        'location': 'Local Machine',
        'pricePerHour': 5.0  # Preço padrão
    }
    
    try:
        response = requests.post(
            f'{backend_url}/api/providers/quick-register',
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n[OK] GPU registered successfully!")
            print(f"   Worker ID: {worker_id}")
            print(f"   GPU: {gpu_info['model']}")
            print(f"   VRAM: {gpu_info['vram_gb']}GB")
            return data['provider']
        else:
            print(f"[ERROR] Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] Connection error: {e}")
        return None


def send_heartbeat(backend_url, worker_id):
    """Envia heartbeat com métricas em tempo real"""
    metrics = get_real_time_metrics()
    
    try:
        response = requests.post(
            f'{backend_url}/api/providers/{worker_id}/heartbeat',
            json={
                'usage': metrics,
                'status': 'available'
            },
            timeout=5
        )
        return response.status_code == 200
    except:
        return False


def main():
    import argparse

    parser = argparse.ArgumentParser(description='QUBIX GPU Detector')
    parser.add_argument('--json-only', action='store_true',
                       help='Output hardware info as JSON only (for API calls)')
    parser.add_argument('--backend-url', default='http://localhost:3006',
                       help='Backend URL for registration')

    args = parser.parse_args()
    BACKEND_URL = args.backend_url

    print("\nQUBIX GPU Detector Starting...")
    print(f"Backend: {BACKEND_URL}\n")

    # Detect system
    print("Detecting hardware...\n")

    gpu_info = get_gpu_info()
    cpu_info = get_cpu_info()
    ram_info = get_ram_info()

    # Prepare hardware data in consistent format
    hardware_data = {
        'gpu': {
            'model': gpu_info['model'],
            'vram_gb': gpu_info['vram_gb'],
            'detected': gpu_info['detected'],
            'cuda_available': gpu_info['cuda_available'],
            'count': gpu_info['count']
        },
        'cpu': {
            'model': cpu_info['model'],
            'cores': cpu_info['cores'],
            'threads': cpu_info['threads']
        },
        'ram': {
            'total_gb': ram_info['total_gb'],
            'available_gb': ram_info['available_gb']
        },
        'os': platform.system().lower()
    }

    if args.json_only:
        # Output only JSON for API consumption
        print(json.dumps(hardware_data))
        return

    # Normal interactive mode
    print("\nSystem Information:")
    print(f"   GPU: {gpu_info['model']}")
    print(f"   VRAM: {gpu_info['vram_gb']}GB")
    print(f"   CUDA: {'Yes' if gpu_info['cuda_available'] else 'No'}")
    print(f"   CPU: {cpu_info['model']} ({cpu_info['cores']} cores)")
    print(f"   RAM: {ram_info['total_gb']}GB")

    # Register
    print(f"\nRegistering with backend...")
    provider = register_with_backend(BACKEND_URL)

    if not provider:
        print("\n[ERROR] Failed to register. Make sure backend is running!")
        sys.exit(1)

    worker_id = provider.get('worker_id') or provider.get('id')

    # Heartbeat loop
    print(f"\nStarting heartbeat (every 5s)...")
    print("   Press Ctrl+C to stop\n")

    try:
        while True:
            if send_heartbeat(BACKEND_URL, worker_id):
                metrics = get_real_time_metrics()
                print(f"Heartbeat sent - CPU: {metrics['cpu_percent']:.1f}% | RAM: {metrics['ram_percent']:.1f}%", end='')
                if 'gpu_percent' in metrics:
                    print(f" | GPU: {metrics['gpu_percent']:.1f}% @ {metrics['gpu_temp']}°C")
                else:
                    print()
            else:
                print("[WARN] Heartbeat failed")

            time.sleep(5)  # Heartbeat a cada 5 segundos

    except KeyboardInterrupt:
        print("\n\nGPU Detector stopped")


if __name__ == '__main__':
    main()
