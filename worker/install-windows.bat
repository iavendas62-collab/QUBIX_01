@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║   🚀 QUBIX WORKER - Instalador Automatico                ║
echo ║   Seu hardware vai comecar a ganhar QUBIC!               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python nao encontrado!
    echo.
    echo 📥 Baixando Python automaticamente...
    echo.
    
    :: Download Python installer
    curl -o python-installer.exe https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe
    
    echo 📦 Instalando Python (isso pode demorar 1-2 minutos)...
    python-installer.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0
    
    :: Clean up
    del python-installer.exe
    
    echo ✅ Python instalado!
    echo.
    echo ⚠️  IMPORTANTE: Feche este terminal e abra novamente!
    echo    Depois execute este script de novo.
    pause
    exit
)

echo ✅ Python encontrado!
python --version
echo.

:: Install dependencies
echo 📦 Instalando dependencias...
pip install psutil requests --quiet
echo ✅ Dependencias instaladas!
echo.

:: Run worker
echo 🚀 Iniciando QUBIX Worker...
echo.
echo ════════════════════════════════════════════════════════════
echo   Seu hardware esta sendo registrado no marketplace!
echo   Mantenha esta janela aberta para continuar ganhando QUBIC.
echo   Pressione Ctrl+C para parar.
echo ════════════════════════════════════════════════════════════
echo.

python qubix_worker_simple.py --backend https://api.qubix.network

pause
