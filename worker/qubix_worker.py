#!/usr/bin/env python3
"""
QUBIX WORKER CLIENT
Software que roda na máquina do provider (minerador)
Conecta hardware ao QUBIX Orchestrator
"""

import asyncio
import json
import platform
import psutil
import torch
import websockets
import docker
import subprocess
import hashlib
import os
from typing import Dict, Optional
from datetime import datetime


class QubixWorkerClient:
    """
    Cliente que roda na máquina do provider
    Gerencia recursos e executa jobs de AI
    """
    
    def __init__(self, api_key: str, orchestrator_url: str = "wss://api.qubix.io/worker"):
        self.api_key = api_key
        self.orchestrator_url = orchestrator_url
        self.worker_id = self._generate_worker_id()
        self.ws = None
        self.current_job = None
        self.is_running = True
        
        # Docker client para rodar jobs isolados
        self.docker_client = docker.from_env()
    
    def _generate_worker_id(self) -> str:
        """Gera ID único baseado no hardware"""
        import uuid
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                       for elements in range(0,2*6,2)][::-1])
        return hashlib.sha256(mac.encode()).hexdigest()[:16]
    
    def get_hardware_specs(self) -> Dict:
        """Detecta especificações do hardware"""
        specs = {
            "worker_id": self.worker_id,
            "hostname": platform.node(),
            "os": f"{platform.system()} {platform.release()}",
            
            # CPU
            "cpu_model": platform.processor(),
            "cpu_cores_physical": psutil.cpu_count(logical=False),
            "cpu_cores_logical": psutil.cpu_count(logical=True),
            "cpu_freq_ghz": psutil.cpu_freq().max / 1000 if psutil.cpu_freq() else 0,
            
            # RAM
            "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "ram_available_gb": round(psutil.virtual_memory().available / (1024**3), 2),
            
            # GPU
            "gpu_available": torch.cuda.is_available(),
            "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "gpu_models": [],
            "gpu_vram_total_gb": 0,
            
            # Storage
            "storage_total_gb": round(psutil.disk_usage('/').total / (1024**3), 2),
            "storage_free_gb": round(psutil.disk_usage('/').free / (1024**3), 2),
            
            # Network
            "network_speed_mbps": self._test_network_speed(),
        }
        
        # GPU details
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                gpu_name = torch.cuda.get_device_name(i)
                gpu_vram = torch.cuda.get_device_properties(i).total_memory / (1024**3)
                specs["gpu_models"].append({
                    "index": i,
                    "name": gpu_name,
                    "vram_gb": round(gpu_vram, 2)
                })
                specs["gpu_vram_total_gb"] += round(gpu_vram, 2)
        
        return specs
    
    def get_current_usage(self) -> Dict:
        """Retorna uso atual dos recursos"""
        return {
            "cpu_usage_percent": psutil.cpu_percent(interval=1),
            "ram_usage_percent": psutil.virtual_memory().percent,
            "gpu_usage_percent": self._get_gpu_usage(),
            "storage_usage_percent": psutil.disk_usage('/').percent,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_gpu_usage(self) -> float:
        """Retorna uso médio da GPU"""
        if not torch.cuda.is_available():
            return 0.0
        
        try:
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'],
                capture_output=True,
                text=True
            )
            usages = [float(x) for x in result.stdout.strip().split('\n')]
            return sum(usages) / len(usages)
        except:
            return 0.0
    
    def _test_network_speed(self) -> float:
        """Testa velocidade da rede (simplificado)"""
        # TODO: Implementar teste real de velocidade
        return 100.0  # Mock: 100 Mbps
    
    async def connect(self):
        """Conecta ao orchestrator"""
        while self.is_running:
            try:
                print(f"🔌 Connecting to QUBIX Orchestrator...")
                async with websockets.connect(
                    self.orchestrator_url,
                    extra_headers={"Authorization": f"Bearer {self.api_key}"}
                ) as ws:
                    self.ws = ws
                    print(f"✅ Connected! Worker ID: {self.worker_id}")
                    
                    # Registra worker
                    await self._register_worker()
                    
                    # Loop principal
                    await self._message_loop()
                    
            except Exception as e:
                print(f"❌ Connection error: {e}")
                print("🔄 Reconnecting in 10 seconds...")
                await asyncio.sleep(10)
    
    async def _register_worker(self):
        """Registra worker no orchestrator"""
        specs = self.get_hardware_specs()
        
        await self.ws.send(json.dumps({
            "type": "register",
            "worker_id": self.worker_id,
            "specs": specs,
            "pricing": {
                "price_per_hour": 5.0,  # QUBIC por hora
                "minimum_duration": 1,   # horas
            },
            "availability": {
                "hours_per_day": 24,
                "timezone": "UTC"
            }
        }))
        
        response = await self.ws.recv()
        data = json.loads(response)
        
        if data.get("status") == "registered":
            print(f"✅ Worker registered successfully!")
            print(f"📊 Hardware: {specs['cpu_cores_logical']} CPU cores, "
                  f"{specs['ram_total_gb']}GB RAM, "
                  f"{specs['gpu_count']} GPU(s)")
        else:
            print(f"❌ Registration failed: {data.get('error')}")
    
    async def _message_loop(self):
        """Loop principal de mensagens"""
        async for message in self.ws:
            try:
                data = json.loads(message)
                msg_type = data.get("type")
                
                if msg_type == "job_assigned":
                    await self._handle_job_assigned(data)
                elif msg_type == "job_cancel":
                    await self._handle_job_cancel(data)
                elif msg_type == "heartbeat":
                    await self._send_heartbeat()
                elif msg_type == "shutdown":
                    print("🛑 Shutdown requested by orchestrator")
                    self.is_running = False
                    break
                    
            except Exception as e:
                print(f"❌ Error processing message: {e}")
    
    async def _handle_job_assigned(self, data: Dict):
        """Lida com novo job atribuído"""
        job = data.get("job")
        job_id = job.get("id")
        
        print(f"\n🎯 New job assigned: {job_id}")
        print(f"📝 Type: {job.get('type')}")
        print(f"💰 Payment: {job.get('total_payment')} QUBIC")
        
        # Aceita job
        await self.ws.send(json.dumps({
            "type": "job_accepted",
            "job_id": job_id,
            "worker_id": self.worker_id
        }))
        
        # Executa job em background
        asyncio.create_task(self._execute_job(job))
    
    async def _execute_job(self, job: Dict):
        """Executa job de AI training/inference"""
        job_id = job.get("id")
        job_type = job.get("type")
        
        try:
            print(f"\n🚀 Starting job execution: {job_id}")
            
            # Reporta início
            await self._report_status(job_id, "running", 0)
            
            if job_type == "training":
                await self._execute_training_job(job)
            elif job_type == "inference":
                await self._execute_inference_job(job)
            elif job_type == "fine-tuning":
                await self._execute_finetuning_job(job)
            else:
                raise ValueError(f"Unknown job type: {job_type}")
            
            # Reporta conclusão
            await self._report_status(job_id, "completed", 100)
            print(f"✅ Job completed: {job_id}")
            
        except Exception as e:
            print(f"❌ Job failed: {e}")
            await self._report_status(job_id, "failed", 0, str(e))
    
    async def _execute_training_job(self, job: Dict):
        """Executa job de AI training usando Docker"""
        job_id = job.get("id")
        dataset_url = job.get("dataset_url")
        model_type = job.get("model_type")
        epochs = job.get("epochs", 10)
        
        # Pull imagem Docker com ambiente de training
        print(f"📦 Pulling Docker image: qubix/ai-trainer:latest")
        self.docker_client.images.pull("qubix/ai-trainer", tag="latest")
        
        # Prepara volumes
        workspace = f"/tmp/qubix-jobs/{job_id}"
        os.makedirs(workspace, exist_ok=True)
        
        # Download dataset
        print(f"📥 Downloading dataset from {dataset_url}")
        # TODO: Implementar download do dataset
        
        # Roda container Docker
        print(f"🐳 Starting Docker container for training...")
        container = self.docker_client.containers.run(
            "qubix/ai-trainer:latest",
            command=[
                "python", "train.py",
                "--model", model_type,
                "--dataset", "/workspace/dataset",
                "--epochs", str(epochs),
                "--output", "/workspace/model"
            ],
            volumes={workspace: {"bind": "/workspace", "mode": "rw"}},
            device_requests=[
                docker.types.DeviceRequest(count=-1, capabilities=[['gpu']])
            ] if torch.cuda.is_available() else [],
            detach=True,
            remove=True
        )
        
        # Monitora progresso
        for i in range(epochs):
            await asyncio.sleep(30)  # Simula tempo de epoch
            progress = int((i + 1) / epochs * 100)
            await self._report_status(job_id, "running", progress)
            print(f"⏳ Training progress: {progress}%")
        
        # Espera container finalizar
        result = container.wait()
        if result['StatusCode'] != 0:
            raise Exception(f"Training failed with exit code {result['StatusCode']}")
        
        # Upload resultado para IPFS/S3
        model_path = f"{workspace}/model"
        result_url = await self._upload_result(model_path)
        
        # Envia resultado
        await self.ws.send(json.dumps({
            "type": "job_result",
            "job_id": job_id,
            "result_url": result_url,
            "metrics": {
                "training_time_hours": 2.5,
                "final_accuracy": 0.95,
                "final_loss": 0.05
            }
        }))
    
    async def _execute_inference_job(self, job: Dict):
        """Executa job de inference"""
        # TODO: Implementar inference
        await asyncio.sleep(5)  # Simula processamento
    
    async def _execute_finetuning_job(self, job: Dict):
        """Executa job de fine-tuning"""
        # TODO: Implementar fine-tuning
        await asyncio.sleep(10)  # Simula processamento
    
    async def _upload_result(self, local_path: str) -> str:
        """Upload resultado para storage (IPFS/S3)"""
        # TODO: Implementar upload real
        # Por agora, retorna mock URL
        return f"ipfs://Qm{os.urandom(32).hex()}"
    
    async def _report_status(self, job_id: str, status: str, progress: int, error: str = None):
        """Reporta status do job"""
        await self.ws.send(json.dumps({
            "type": "job_status",
            "job_id": job_id,
            "worker_id": self.worker_id,
            "status": status,
            "progress": progress,
            "error": error,
            "timestamp": datetime.utcnow().isoformat()
        }))
    
    async def _send_heartbeat(self):
        """Envia heartbeat com uso de recursos"""
        usage = self.get_current_usage()
        await self.ws.send(json.dumps({
            "type": "heartbeat",
            "worker_id": self.worker_id,
            "usage": usage,
            "timestamp": datetime.utcnow().isoformat()
        }))
    
    async def _handle_job_cancel(self, data: Dict):
        """Cancela job em execução"""
        job_id = data.get("job_id")
        print(f"🛑 Canceling job: {job_id}")
        # TODO: Implementar cancelamento real
        # Parar container Docker, limpar recursos, etc.
    
    def shutdown(self):
        """Desliga worker gracefully"""
        print("\n🛑 Shutting down worker...")
        self.is_running = False


# ============================================
# CLI INTERFACE
# ============================================

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="QUBIX Worker Client")
    parser.add_argument("--api-key", required=True, help="API key from QUBIX dashboard")
    parser.add_argument("--orchestrator", default="wss://api.qubix.io/worker", 
                       help="Orchestrator WebSocket URL")
    
    args = parser.parse_args()
    
    print("""
╔═══════════════════════════════════════╗
║   🚀 QUBIX WORKER CLIENT             ║
║   Connecting your hardware to QUBIX  ║
╚═══════════════════════════════════════╝
""")
    
    # Cria e inicia worker
    worker = QubixWorkerClient(
        api_key=args.api_key,
        orchestrator_url=args.orchestrator
    )
    
    try:
        await worker.connect()
    except KeyboardInterrupt:
        worker.shutdown()
        print("\n👋 Goodbye!")


if __name__ == "__main__":
    asyncio.run(main())
