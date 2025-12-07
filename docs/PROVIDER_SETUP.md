# 🚀 QUBIX Provider Setup Guide

**Como Conectar Seu Hardware ao QUBIX e Começar a Ganhar**

---

## 📋 Requisitos Mínimos

### Hardware
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recomendado)
- **Storage**: 50GB+ livre
- **GPU**: Opcional, mas recomendado (NVIDIA com CUDA)
- **Internet**: 10 Mbps+ (100 Mbps+ recomendado)

### Software
- **OS**: Linux (Ubuntu 22.04+), macOS, ou Windows 10/11
- **Docker**: 20.10+
- **Python**: 3.10+
- **CUDA Drivers**: 12.0+ (se usar GPU NVIDIA)

---

## 🛠️ Instalação Passo-a-Passo

### Step 1: Instalar Docker

#### Linux (Ubuntu/Debian)
```bash
# Remove versões antigas
sudo apt-get remove docker docker-engine docker.io containerd runc

# Instala dependências
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release

# Adiciona repo oficial Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instala Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verifica instalação
sudo docker run hello-world
```

#### macOS
```bash
# Baixa Docker Desktop de: https://www.docker.com/products/docker-desktop
# Ou via Homebrew:
brew install --cask docker
```

#### Windows
```bash
# Baixa Docker Desktop de: https://www.docker.com/products/docker-desktop
# Ou via winget:
winget install Docker.DockerDesktop
```

### Step 2: Instalar NVIDIA Container Toolkit (para GPU)

Se você tem GPU NVIDIA, instale o suporte Docker:

```bash
# Adiciona repo NVIDIA
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Instala nvidia-docker2
sudo apt-get update
sudo apt-get install -y nvidia-docker2

# Reinicia Docker
sudo systemctl restart docker

# Testa GPU no Docker
sudo docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
```

### Step 3: Instalar QUBIX Worker Client

#### Opção A: Via pip (Recomendado)
```bash
pip install qubix-worker
```

#### Opção B: Via código-fonte
```bash
git clone https://github.com/qubix-ai/worker-client.git
cd worker-client
pip install -r requirements.txt
python setup.py install
```

#### Opção C: Via executável (Windows/macOS)
```bash
# Linux
wget https://qubix.io/download/qubix-worker-linux-amd64
chmod +x qubix-worker-linux-amd64
./qubix-worker-linux-amd64 --version

# macOS
wget https://qubix.io/download/qubix-worker-darwin-amd64
chmod +x qubix-worker-darwin-amd64
./qubix-worker-darwin-amd64 --version

# Windows
# Download qubix-worker-windows-amd64.exe e execute
```

### Step 4: Criar Conta QUBIX

1. Acesse: https://dashboard.qubix.io
2. Conecte sua wallet Qubic (MetaMask/WalletConnect)
3. Vá em "Provider Settings"
4. Clique em "Generate API Key"
5. Copie sua API key: `qbx_1234567890abcdef...`

### Step 5: Configurar Worker

Crie arquivo de configuração `~/.qubix/config.yml`:

```yaml
# QUBIX Worker Configuration

# API Key (OBRIGATÓRIO)
api_key: "qbx_1234567890abcdef..."

# Orchestrator URL
orchestrator_url: "wss://api.qubix.io/worker"

# Pricing (em QUBIC por hora)
pricing:
  cpu_only: 3.0        # Jobs sem GPU
  gpu_basic: 5.0       # Jobs com GPU básica
  gpu_premium: 10.0    # Jobs com GPU premium

# Availability
availability:
  enabled: true
  hours_per_day: 24    # Horas disponíveis por dia
  timezone: "UTC"

# Resource Limits (opcional)
limits:
  max_cpu_cores: 8     # Máximo de CPU cores por job
  max_ram_gb: 32       # Máximo de RAM por job
  max_gpu_memory_gb: 24  # Máximo de GPU VRAM por job
  max_storage_gb: 100  # Máximo de storage por job

# Auto-accept jobs (opcional)
auto_accept:
  enabled: true
  min_payment: 5.0     # Mínimo payment em QUBIC
  max_duration: 24     # Máximo duration em horas
  
# Logging
logging:
  level: "info"        # debug, info, warning, error
  file: "/var/log/qubix/worker.log"
```

### Step 6: Iniciar Worker

#### Modo Interativo (para testar)
```bash
qubix-worker start

# Ou se instalou via source:
python -m qubix_worker.main --config ~/.qubix/config.yml
```

#### Modo Background (produção)
```bash
# Linux/macOS
qubix-worker start --daemon

# Ou via systemd (recomendado)
sudo systemctl start qubix-worker
sudo systemctl enable qubix-worker  # Auto-start on boot
```

#### Via Docker (isolado)
```bash
docker run -d \
  --name qubix-worker \
  --restart unless-stopped \
  --gpus all \
  -v ~/.qubix:/root/.qubix \
  -v /var/run/docker.sock:/var/run/docker.sock \
  qubix/worker:latest
```

### Step 7: Verificar Status

```bash
# Status do worker
qubix-worker status

# Logs em tempo real
qubix-worker logs --follow

# Hardware detectado
qubix-worker info

# Earnings até agora
qubix-worker earnings
```

**Output esperado:**
```
╔═══════════════════════════════════════╗
║   🚀 QUBIX WORKER STATUS             ║
╠═══════════════════════════════════════╣
║  Worker ID: abc123def456             ║
║  Status: Online ✅                    ║
║  Connected: 2h 15m                   ║
║                                       ║
║  Hardware:                            ║
║    CPU: 16 cores @ 3.8 GHz           ║
║    RAM: 64 GB                        ║
║    GPU: NVIDIA RTX 4090 (24GB)       ║
║                                       ║
║  Current Job: training-xyz789        ║
║  Progress: 67% (2h remaining)        ║
║                                       ║
║  Earnings Today: 45.3 QUBIC          ║
║  Total Earnings: 1,234.5 QUBIC       ║
╚═══════════════════════════════════════╝
```

---

## 📊 Dashboard & Monitoramento

Acesse o dashboard em: **https://dashboard.qubix.io/provider**

Você verá:
- ✅ Status do worker (online/offline)
- 📊 Hardware utilization em tempo real
- 💼 Jobs em execução
- 💰 Earnings históricos
- ⭐ Reputation score
- 📈 Performance metrics

---

## 💰 Como Funciona o Pagamento

### Fluxo de Pagamento:

1. **Job Assignment**: Consumer paga total upfront em escrow
2. **Job Execution**: Você executa o job
3. **Job Completion**: Você envia resultado
4. **Validation**: Orchestrator valida resultado
5. **Payment Release**: Escrow libera pagamento automaticamente

### Fee Structure:
- **Você recebe**: 95% do payment
- **Platform fee**: 5%
- **Exemplo**: Job de 100 QUBIC → Você recebe 95 QUBIC

### Payment Schedule:
- Payments são liberados **imediatamente** após conclusão
- Funds aparecem na sua wallet Qubic em ~30 segundos
- Zero lock-up period

---

## 🔒 Segurança & Privacidade

### O que é protegido:
✅ Jobs rodam em containers Docker isolados  
✅ Sem acesso ao seu filesystem host  
✅ Resource limits previnem abuse  
✅ Network sandboxed  
✅ Apenas código auditado roda  

### O que você compartilha:
✅ Hardware specs (CPU, RAM, GPU)  
✅ Pricing configuration  
✅ Availability hours  

❌ **NÃO compartilhamos**: Seus dados pessoais, IP address, localização exata

---

## ❓ FAQ

**Q: Preciso de GPU?**  
A: Não é obrigatório, mas jobs com GPU pagam 2-3x mais.

**Q: Quanto vou ganhar?**  
A: Depende do seu hardware e availability. Estimativa:
- CPU básico (4 cores): $50-100/mês
- CPU premium (16+ cores): $200-400/mês
- GPU básica (8GB): $300-600/mês
- GPU premium (24GB+): $800-2000/mês

**Q: Posso pausar/parar o worker?**  
A: Sim! Use `qubix-worker stop`. Não afeta seu reputation score.

**Q: E se meu computador crashar durante um job?**  
A: Job é re-assigned para outro worker. Você não perde reputation se acontecer raramente.

**Q: Quais tipos de jobs vou executar?**  
A: AI training (GPT, BERT, etc), inference, fine-tuning, image processing.

**Q: É seguro?**  
A: Sim! Jobs rodam isolados em Docker. Código é auditado. Zero acesso ao seu sistema.

---

## 🆘 Troubleshooting

### Worker não conecta:
```bash
# Verifica conectividade
ping api.qubix.io

# Verifica API key
qubix-worker verify-key

# Logs de debug
qubix-worker logs --level debug
```

### GPU não detectada:
```bash
# Verifica CUDA
nvidia-smi

# Verifica Docker GPU support
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Reinstala nvidia-docker2
sudo apt-get install --reinstall nvidia-docker2
sudo systemctl restart docker
```

### Jobs falhando:
```bash
# Verifica resources
qubix-worker info

# Limpa cache
qubix-worker clean

# Atualiza worker
qubix-worker update
```

---

## 📞 Suporte

- **Discord**: https://discord.gg/qubix
- **Docs**: https://docs.qubix.io
- **Email**: support@qubix.io
- **Status**: https://status.qubix.io

---

## 🚀 Próximos Passos

✅ Instale o worker  
✅ Configure pricing  
✅ Inicie worker  
✅ Monitore dashboard  
✅ Receba primeiro pagamento  
🎉 **Profit!**

---

**Bem-vindo ao QUBIX! 💜**

Transforme seu hardware idle em receita passiva.
