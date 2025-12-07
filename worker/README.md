# 🖥️ QUBIX Worker

Transforme seu hardware em uma fonte de renda passiva!

## 🚀 Instalação Rápida

### Windows
```batch
# Baixe e execute o instalador:
https://qubix.network/install-windows.bat
```

Ou manualmente:
```batch
pip install psutil requests
python qubix_worker_simple.py
```

### Linux / Mac
```bash
# Uma linha:
curl -sSL https://qubix.network/install.sh | bash
```

Ou manualmente:
```bash
pip3 install psutil requests
python3 qubix_worker_simple.py
```

## ⚙️ Configuração

### Definir preço por hora
```bash
python qubix_worker_simple.py --price 10
```

### Conectar a servidor específico
```bash
python qubix_worker_simple.py --backend http://localhost:3001
```

## 📊 O que o Worker faz

1. **Detecta seu hardware** - CPU, RAM, GPU automaticamente
2. **Registra no marketplace** - Seu hardware aparece para aluguel
3. **Aguarda jobs** - Verifica a cada 5 segundos
4. **Executa jobs** - Processa tarefas de IA/ML
5. **Recebe pagamento** - QUBIC depositado na sua wallet

## 💰 Quanto posso ganhar?

| Hardware | Preço sugerido | Ganho estimado/mês |
|----------|----------------|-------------------|
| RTX 3080 | 5-6 QUBIC/h | 500-1000 QUBIC |
| RTX 4090 | 10-13 QUBIC/h | 1000-2000 QUBIC |
| A100 | 35-50 QUBIC/h | 3000-5000 QUBIC |

## 🔧 Requisitos

- Python 3.8+
- 4GB RAM mínimo
- Conexão internet estável
- GPU NVIDIA (opcional, mas recomendado)

## 🛡️ Segurança

- O worker roda em sandbox isolado
- Não tem acesso aos seus arquivos pessoais
- Comunicação criptografada com o backend
- Você pode parar a qualquer momento (Ctrl+C)

## 📝 Logs

Os logs são salvos em:
- Windows: `%USERPROFILE%\.qubix\logs\`
- Linux/Mac: `~/.qubix/logs/`

## ❓ FAQ

**P: Preciso deixar o PC ligado 24/7?**
R: Não! Você ganha apenas quando está online. Pode ligar/desligar quando quiser.

**P: Vai deixar meu PC lento?**
R: O worker usa recursos ociosos. Se você precisar do PC, os jobs são pausados.

**P: É seguro?**
R: Sim! O worker roda isolado e não acessa seus arquivos.

## 🆘 Suporte

- Discord: https://discord.gg/qubix
- Email: support@qubix.network
- Docs: https://docs.qubix.network
