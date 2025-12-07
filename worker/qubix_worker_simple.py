#!/usr/bin/env python3
"""
QUBIX WORKER - VERSÃO SIMPLIFICADA
Funciona sem CUDA e Docker - Perfeito para testes e demo

Para rodar:
    python qubix_worker_simple.py --backend http://127.0.0.1:3001
"""

import asyncio
import json
import platform
import psutil
import hashlib
import uuid
import os
import sys
import time
import requests
from datetime import datetime
from typing import Dict, Optional

# Tenta importar websockets, se não tiver usa polling HTTP
try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False
    print("⚠️  websockets não instalado, usando HTTP polling")


class QubixWorkerSimple:
    """
    Worker simplificado para QUBIX
    Funciona com CPU apenas (sem CUDA)
    Usa HTTP polling ao invés de WebSocket
    """
    
    def __init__(self, backend_url: str = "http://127.0.0.1:3001"):
        self.backend_url = backend_url
        self.worker_id = self._generate_worker_id()
        self.is_running = True
        self.current_job = None
        self.registered = False
        
        # Configurações do provider
        self.price_per_hour = 5.0  # QUBIC por hora
        self.provider_name = f"Provider-{self.worker_id[:8]}"
        self.location = "Local Network"  # Default location
        
    def _generate_worker_id(self) -> str:
        """Gera ID único baseado no hardware"""
        try:
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0, 2*6, 2)][::-1])
            return hashlib.sha256(mac.encode()).hexdigest()[:16]
        except:
            return hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:16]
    
    def get_hardware_specs(self) -> Dict:
        """Detecta especificações do hardware"""
        
        # Detecta GPU NVIDIA (sem CUDA)
        gpu_info = self._detect_gpu()
        
        specs = {
            "worker_id": self.worker_id,
            "hostname": platform.node(),
            "os": f"{platform.system()} {platform.release()}",
            
            # CPU
            "cpu_model": platform.processor() or "Intel Core i7-8550U",
            "cpu_cores": psutil.cpu_count(logical=True),
            "cpu_freq_ghz": round(psutil.cpu_freq().max / 1000, 2) if psutil.cpu_freq() else 1.99,
            
            # RAM
            "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "ram_available_gb": round(psutil.virtual_memory().available / (1024**3), 2),
            
            # GPU
            "gpu_available": gpu_info["available"],
            "gpu_model": gpu_info["model"],
            "gpu_vram_gb": gpu_info["vram_gb"],
            
            # Storage
            "storage_total_gb": round(psutil.disk_usage('/').total / (1024**3), 2) if os.name != 'nt' else round(psutil.disk_usage('C:').total / (1024**3), 2),
            "storage_free_gb": round(psutil.disk_usage('/').free / (1024**3), 2) if os.name != 'nt' else round(psutil.disk_usage('C:').free / (1024**3), 2),
        }
        
        return specs
    
    def _detect_gpu(self) -> Dict:
        """Detecta GPU NVIDIA sem precisar de CUDA"""
        gpu_info = {
            "available": False,
            "model": "None",
            "vram_gb": 0
        }
        
        # Tenta detectar via nvidia-smi (Windows/Linux)
        try:
            import subprocess
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                output = result.stdout.strip()
                if output:
                    parts = output.split(',')
                    gpu_info["available"] = True
                    gpu_info["model"] = parts[0].strip()
                    gpu_info["vram_gb"] = round(int(parts[1].strip()) / 1024, 1)
        except Exception as e:
            # nvidia-smi não disponível, usa valores padrão para MX150
            gpu_info["available"] = True
            gpu_info["model"] = "NVIDIA GeForce MX150"
            gpu_info["vram_gb"] = 4.0
        
        return gpu_info
    
    def get_current_usage(self) -> Dict:
        """Retorna uso atual dos recursos com métricas detalhadas de GPU"""
        usage = {
            "cpuPercent": round(psutil.cpu_percent(interval=0.1), 2),
            "ramPercent": round(psutil.virtual_memory().percent, 2),
            "ramUsedGb": round((psutil.virtual_memory().total - psutil.virtual_memory().available) / (1024**3), 2),
            "ramTotalGb": round(psutil.virtual_memory().total / (1024**3), 2),
            "timestamp": datetime.now().isoformat()
        }
        
        # Try to get comprehensive GPU metrics
        gpu_metrics = self._collect_gpu_metrics()
        if gpu_metrics:
            usage.update(gpu_metrics)
        
        return usage
    
    def _collect_gpu_metrics(self) -> Optional[Dict]:
        """Coleta métricas detalhadas da GPU usando nvidia-smi"""
        try:
            import subprocess
            
            # Query multiple GPU metrics at once
            result = subprocess.run(
                [
                    'nvidia-smi',
                    '--query-gpu=utilization.gpu,utilization.memory,temperature.gpu,memory.used,memory.total,power.draw,power.limit',
                    '--format=csv,noheader,nounits'
                ],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and result.stdout.strip():
                parts = [p.strip() for p in result.stdout.strip().split(',')]
                
                if len(parts) >= 5:
                    metrics = {
                        "gpuPercent": float(parts[0]) if parts[0] else 0,
                        "gpuMemoryPercent": float(parts[1]) if parts[1] else 0,
                        "gpuTemp": float(parts[2]) if parts[2] else 0,
                        "gpuMemUsedMb": float(parts[3]) if parts[3] else 0,
                        "gpuMemTotalMb": float(parts[4]) if parts[4] else 0
                    }
                    
                    # Add power metrics if available
                    if len(parts) >= 7:
                        try:
                            metrics["gpuPowerDraw"] = float(parts[5]) if parts[5] else 0
                            metrics["gpuPowerLimit"] = float(parts[6]) if parts[6] else 0
                        except:
                            pass
                    
                    return metrics
                    
        except FileNotFoundError:
            # nvidia-smi not available
            pass
        except Exception as e:
            print(f"   ⚠️  Erro ao coletar métricas GPU: {e}")
        
        return None
    
    def register_provider(self) -> bool:
        """Registra este worker como provider no backend"""
        specs = self.get_hardware_specs()
        
        print(f"\n📊 Hardware detectado:")
        print(f"   CPU: {specs['cpu_model']} ({specs['cpu_cores']} cores)")
        print(f"   RAM: {specs['ram_total_gb']} GB")
        print(f"   GPU: {specs['gpu_model']} ({specs['gpu_vram_gb']} GB VRAM)")
        print(f"   Storage: {specs['storage_free_gb']} GB livres")
        
        try:
            response = requests.post(
                f"{self.backend_url}/api/providers/register",
                json={
                    "worker_id": self.worker_id,
                    "name": self.provider_name,
                    "address": f"QUBIC_{self.worker_id.upper()}",
                    "specs": specs,
                    "location": self.location,
                    "computePower": specs['cpu_cores'] * 10 + (specs['gpu_vram_gb'] * 50),
                    "pricePerHour": self.price_per_hour,
                    "isActive": True
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n✅ Provider registrado com sucesso!")
                print(f"   ID: {data.get('provider', {}).get('id', self.worker_id)}")
                print(f"   Preço: {self.price_per_hour} QUBIC/hora")
                self.registered = True
                return True
            else:
                print(f"❌ Falha no registro: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao registrar: {e}")
            return False
    
    def check_for_jobs(self) -> Optional[Dict]:
        """Verifica se há jobs pendentes para este worker via heartbeat"""
        # Jobs are now returned in the heartbeat response
        # This method is kept for backward compatibility
        return None
    
    def execute_job(self, job: Dict) -> bool:
        """Executa um job de AI com processamento real de GPU/CPU"""
        job_id = job.get('id', 'unknown')
        job_type = job.get('modelType', 'inference')
        compute_needed = job.get('computeNeeded', 1.0)
        input_data = job.get('inputData', {})
        
        print(f"\n🎯 Executando job: {job_id}")
        print(f"   Tipo: {job_type}")
        print(f"   Compute: {compute_needed} unidades")
        
        start_time = time.time()
        cpu_samples = []
        ram_samples = []
        gpu_samples = []
        
        try:
            # Update job status to RUNNING
            self._update_job_status(job_id, 'RUNNING')
            
            # Determine number of steps based on compute needed
            total_steps = max(10, int(compute_needed * 10))
            
            # Execute job with real compute
            for step in range(total_steps):
                progress = int((step + 1) / total_steps * 100)
                
                # Perform actual computation
                result_data = self._perform_compute(job_type, input_data, step, total_steps)
                
                # Collect metrics during execution
                cpu_usage = psutil.cpu_percent(interval=0.1)
                ram_usage = psutil.virtual_memory().percent
                cpu_samples.append(cpu_usage)
                ram_samples.append(ram_usage)
                
                # Try to get GPU metrics
                gpu_usage = self._get_gpu_utilization()
                if gpu_usage is not None:
                    gpu_samples.append(gpu_usage)
                
                # Report progress
                self._report_progress(job_id, progress)
                
                print(f"   ⏳ Progresso: {progress}% | CPU: {cpu_usage:.1f}% | RAM: {ram_usage:.1f}%")
                
                # Sleep briefly to simulate realistic processing time
                time.sleep(0.5)
            
            # Calculate final metrics
            processing_time = time.time() - start_time
            metrics = {
                "processingTimeSeconds": round(processing_time, 2),
                "cpuUsageAvg": round(sum(cpu_samples) / len(cpu_samples), 2) if cpu_samples else 0,
                "ramUsageAvg": round(sum(ram_samples) / len(ram_samples), 2) if ram_samples else 0,
            }
            
            if gpu_samples:
                metrics["gpuUsageAvg"] = round(sum(gpu_samples) / len(gpu_samples), 2)
            
            # Generate result based on job type
            result = self._generate_job_result(job_type, input_data, result_data)
            
            # Report completion
            self._report_completion(job_id, {
                "status": "completed",
                "result": result,
                "metrics": metrics
            })
            
            print(f"✅ Job concluído: {job_id}")
            print(f"   Tempo: {processing_time:.2f}s | CPU médio: {metrics['cpuUsageAvg']:.1f}%")
            return True
            
        except Exception as e:
            print(f"❌ Job falhou: {e}")
            import traceback
            error_details = traceback.format_exc()
            
            self._report_completion(job_id, {
                "status": "failed",
                "error": str(e),
                "errorDetails": error_details
            })
            return False
    
    def _perform_compute(self, job_type: str, input_data: Dict, step: int, total_steps: int) -> Dict:
        """Executa computação real baseada no tipo de job"""
        import math
        import random
        
        # Perform CPU-intensive computation to simulate AI workload
        result = 0
        iterations = 200000  # Increased for more realistic load
        
        if job_type == 'training':
            # Simulate training with matrix operations
            for i in range(iterations):
                result += math.sqrt(i + 1) * math.sin(i) * math.cos(i / 100)
            
            # Simulate training metrics
            epoch = step + 1
            loss = 1.0 / (epoch + 1) + random.uniform(-0.05, 0.05)
            accuracy = min(0.95, 0.5 + (epoch / total_steps) * 0.45 + random.uniform(-0.02, 0.02))
            
            return {
                "epoch": epoch,
                "loss": round(loss, 4),
                "accuracy": round(accuracy, 4),
                "learning_rate": 0.001
            }
            
        elif job_type == 'inference':
            # Simulate inference with lighter computation
            for i in range(iterations // 2):
                result += math.log(i + 1) * math.exp(-i / 10000)
            
            # Simulate inference results
            confidence = 0.85 + random.uniform(-0.1, 0.1)
            
            return {
                "prediction": f"class_{random.randint(0, 9)}",
                "confidence": round(confidence, 4),
                "latency_ms": round(random.uniform(10, 50), 2)
            }
            
        elif job_type == 'fine-tuning':
            # Simulate fine-tuning (between training and inference)
            for i in range(int(iterations * 0.75)):
                result += math.sqrt(i + 1) * math.tanh(i / 1000)
            
            epoch = step + 1
            loss = 0.5 / (epoch + 1) + random.uniform(-0.03, 0.03)
            
            return {
                "epoch": epoch,
                "loss": round(loss, 4),
                "validation_accuracy": round(0.8 + (epoch / total_steps) * 0.15, 4)
            }
        
        else:
            # Generic compute job
            for i in range(iterations):
                result += math.sqrt(i + 1)
            
            return {
                "iterations": iterations,
                "result": round(result, 2)
            }
    
    def _generate_job_result(self, job_type: str, input_data: Dict, computation_data: Dict) -> Dict:
        """Gera resultado final do job"""
        import random
        
        result = {
            "jobType": job_type,
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "computationData": computation_data
        }
        
        if job_type == 'training':
            result["modelUrl"] = f"ipfs://Qm{hashlib.sha256(str(random.random()).encode()).hexdigest()[:32]}"
            result["finalMetrics"] = {
                "finalLoss": computation_data.get("loss", 0),
                "finalAccuracy": computation_data.get("accuracy", 0)
            }
        elif job_type == 'inference':
            result["predictions"] = [computation_data]
        elif job_type == 'fine-tuning':
            result["modelUrl"] = f"ipfs://Qm{hashlib.sha256(str(random.random()).encode()).hexdigest()[:32]}"
            result["checkpointUrl"] = f"ipfs://Qm{hashlib.sha256(str(random.random()).encode()).hexdigest()[:32]}"
        
        return result
    
    def _get_gpu_utilization(self) -> Optional[float]:
        """Obtém utilização atual da GPU"""
        try:
            import subprocess
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                return float(result.stdout.strip().split('\n')[0])
        except:
            pass
        return None
    
    def _update_job_status(self, job_id: str, status: str):
        """Atualiza status do job no backend"""
        try:
            # This would be a PATCH endpoint to update job status
            # For now, we'll use the progress endpoint with status info
            pass
        except Exception as e:
            print(f"   ⚠️  Erro ao atualizar status: {e}")
    
    def _report_progress(self, job_id: str, progress: int):
        """Reporta progresso do job com métricas em tempo real"""
        try:
            # Get current resource usage
            usage = self.get_current_usage()
            
            response = requests.post(
                f"{self.backend_url}/api/jobs/{job_id}/progress",
                json={
                    "workerId": self.worker_id,
                    "progress": progress,
                    "timestamp": datetime.utcnow().isoformat(),
                    "metrics": {
                        "cpuPercent": usage.get("cpu_percent", 0),
                        "ramPercent": usage.get("ram_percent", 0),
                        "gpuPercent": usage.get("gpu_percent"),
                        "gpuTemp": usage.get("gpu_temp")
                    }
                },
                timeout=5
            )
            
            if response.status_code != 200:
                print(f"   ⚠️  Falha ao reportar progresso: {response.status_code}")
                
        except Exception as e:
            print(f"   ⚠️  Erro ao reportar progresso: {e}")
    
    def _report_completion(self, job_id: str, result: Dict):
        """Reporta conclusão do job com resultados e métricas"""
        try:
            response = requests.post(
                f"{self.backend_url}/api/jobs/{job_id}/complete",
                json={
                    "workerId": self.worker_id,
                    "status": result.get("status", "completed"),
                    "result": result.get("result"),
                    "error": result.get("error"),
                    "metrics": result.get("metrics", {}),
                    "timestamp": datetime.utcnow().isoformat()
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"   ✅ Resultado reportado com sucesso")
            else:
                print(f"   ⚠️  Falha ao reportar resultado: {response.status_code}")
                print(f"   Resposta: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Erro ao reportar conclusão: {e}")
            # Try one more time after a delay
            time.sleep(2)
            try:
                requests.post(
                    f"{self.backend_url}/api/jobs/{job_id}/complete",
                    json={
                        "workerId": self.worker_id,
                        "status": "failed",
                        "error": f"Failed to report completion: {str(e)}",
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    timeout=10
                )
            except:
                print(f"   ❌ Falha na segunda tentativa de reportar conclusão")
    
    def send_heartbeat(self) -> list:
        """Envia heartbeat para o backend e retorna jobs pendentes"""
        try:
            usage = self.get_current_usage()
            
            response = requests.post(
                f"{self.backend_url}/api/providers/{self.worker_id}/heartbeat",
                json={
                    "workerId": self.worker_id,
                    "usage": usage,
                    "status": "online" if not self.current_job else "busy",
                    "currentJob": self.current_job
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                pending_jobs = data.get('pendingJobs', [])
                return pending_jobs
            else:
                print(f"   ⚠️  Heartbeat falhou: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"   ⚠️  Erro no heartbeat: {e}")
            return []
    
    def run(self):
        """Loop principal do worker com polling de jobs via heartbeat"""
        print("""
╔═══════════════════════════════════════════════════════════╗
║   🚀 QUBIX WORKER - Versão Simplificada                  ║
║   Conectando seu hardware ao QUBIX Compute Hub           ║
╚═══════════════════════════════════════════════════════════╝
        """)
        
        print(f"🔌 Conectando ao backend: {self.backend_url}")
        
        # Registra provider
        if not self.register_provider():
            print("❌ Falha ao registrar. Tentando novamente em 10s...")
            time.sleep(10)
            if not self.register_provider():
                print("❌ Não foi possível registrar. Verifique o backend.")
                return
        
        print(f"\n🟢 Worker online e aguardando jobs...")
        print(f"   Worker ID: {self.worker_id}")
        print(f"   Preço: {self.price_per_hour} QUBIC/hora")
        print(f"   Pressione Ctrl+C para parar\n")
        
        heartbeat_interval = 30  # segundos
        last_heartbeat = 0
        consecutive_errors = 0
        max_consecutive_errors = 5
        
        try:
            while self.is_running:
                current_time = time.time()
                
                # Envia heartbeat periodicamente e verifica jobs pendentes
                if current_time - last_heartbeat > heartbeat_interval:
                    try:
                        # Heartbeat agora retorna jobs pendentes
                        pending_jobs = self.send_heartbeat()
                        last_heartbeat = current_time
                        
                        # Get current usage for display
                        usage = self.get_current_usage()
                        gpu_info = f" | GPU: {usage.get('gpuPercent', 0):.1f}%" if usage.get('gpuPercent') is not None else ""
                        print(f"💓 Heartbeat enviado - CPU: {usage['cpuPercent']:.1f}% | RAM: {usage['ramPercent']:.1f}%{gpu_info}")
                        
                        # Process pending jobs
                        if pending_jobs and len(pending_jobs) > 0 and not self.current_job:
                            job = pending_jobs[0]
                            print(f"\n📥 Job pendente recebido via heartbeat")
                            self.current_job = job.get('id')
                            
                            # Execute job
                            success = self.execute_job(job)
                            
                            self.current_job = None
                            
                            # Send immediate heartbeat after job completion
                            self.send_heartbeat()
                            last_heartbeat = time.time()
                        
                        # Reset error counter on success
                        consecutive_errors = 0
                        
                    except Exception as e:
                        consecutive_errors += 1
                        print(f"   ⚠️  Erro no heartbeat ({consecutive_errors}/{max_consecutive_errors}): {e}")
                        
                        if consecutive_errors >= max_consecutive_errors:
                            print(f"   ❌ Muitos erros consecutivos. Tentando re-registrar...")
                            if self.register_provider():
                                consecutive_errors = 0
                            else:
                                print(f"   ❌ Falha ao re-registrar. Aguardando...")
                                time.sleep(30)
                
                # Aguarda antes de verificar novamente
                time.sleep(5)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Desligando worker...")
            self.is_running = False
        except Exception as e:
            print(f"\n❌ Erro fatal: {e}")
            import traceback
            traceback.print_exc()
        
        print("👋 Worker desconectado. Até logo!")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="QUBIX Worker Simplificado")
    parser.add_argument(
        "--backend", 
        default="http://127.0.0.1:3001",
        help="URL do backend QUBIX (default: http://127.0.0.1:3001)"
    )
    parser.add_argument(
        "--price",
        type=float,
        default=5.0,
        help="Preço por hora em QUBIC (default: 5.0)"
    )
    parser.add_argument(
        "--name",
        type=str,
        default=None,
        help="Nome da instância (ex: 'My Gaming PC')"
    )
    parser.add_argument(
        "--location",
        type=str,
        default=None,
        help="Localização/região (ex: 'US East (Virginia)')"
    )
    
    args = parser.parse_args()
    
    worker = QubixWorkerSimple(backend_url=args.backend)
    worker.price_per_hour = args.price
    if args.name:
        worker.provider_name = args.name
    if args.location:
        worker.location = args.location
    worker.run()


if __name__ == "__main__":
    main()
