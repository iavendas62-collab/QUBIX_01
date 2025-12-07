#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🚀 QUBIX WORKER - Instalador Automático                ║"
echo "║   Seu hardware vai começar a ganhar QUBIC!               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python não encontrado!"
    echo ""
    echo "📥 Instalando Python..."
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v brew &> /dev/null; then
        brew install python3
    else
        echo "❌ Não foi possível instalar Python automaticamente."
        echo "   Por favor, instale Python 3 manualmente."
        exit 1
    fi
fi

echo "✅ Python encontrado!"
python3 --version
echo ""

# Install dependencies
echo "📦 Instalando dependências..."
pip3 install psutil requests --quiet
echo "✅ Dependências instaladas!"
echo ""

# Run worker
echo "🚀 Iniciando QUBIX Worker..."
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Seu hardware está sendo registrado no marketplace!"
echo "  Mantenha este terminal aberto para continuar ganhando QUBIC."
echo "  Pressione Ctrl+C para parar."
echo "════════════════════════════════════════════════════════════"
echo ""

python3 qubix_worker_simple.py --backend https://api.qubix.network
