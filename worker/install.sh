#!/bin/bash
# QUBIX Worker - Instalador Universal (Linux/Mac)
# Uso: curl -sSL https://qubix.network/install.sh | bash

set -e

echo ""
echo "🚀 QUBIX Worker - Instalação Automática"
echo "========================================"
echo ""

# Create temp directory
INSTALL_DIR="$HOME/.qubix"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Check/Install Python
if ! command -v python3 &> /dev/null; then
    echo "📥 Instalando Python..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y python3 python3-pip
    elif command -v brew &> /dev/null; then
        brew install python3
    fi
fi

# Install dependencies
echo "📦 Instalando dependências..."
pip3 install psutil requests -q

# Download worker
echo "📥 Baixando QUBIX Worker..."
curl -sSL -o qubix_worker.py https://raw.githubusercontent.com/qubix-network/worker/main/qubix_worker_simple.py 2>/dev/null || \
curl -sSL -o qubix_worker.py http://localhost:3001/worker.py 2>/dev/null || \
echo "⚠️  Usando worker local..."

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
cd ~/.qubix
python3 qubix_worker.py --backend https://api.qubix.network
EOF
chmod +x start.sh

echo ""
echo "✅ Instalação completa!"
echo ""
echo "🎮 Para iniciar o worker, execute:"
echo "   ~/.qubix/start.sh"
echo ""
echo "💰 Seu hardware começará a ganhar QUBIC automaticamente!"
echo ""

# Auto-start
read -p "Iniciar agora? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    ./start.sh
fi
