import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Read the Python worker code
const getWorkerCode = (): string => {
  const workerPath = path.join(__dirname, '../../..', 'worker', 'qubix_worker_simple.py');
  try {
    return fs.readFileSync(workerPath, 'utf-8');
  } catch (error) {
    console.error('Failed to read worker code:', error);
    throw new Error('Worker code not found');
  }
};

// Generate Windows installer (.bat)
const generateWindowsInstaller = (backendUrl: string): string => {
  const workerCode = getWorkerCode();
  
  // Escape the Python code for embedding in batch file
  const escapedWorkerCode = workerCode
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\n');

  return `@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║   🚀 QUBIX WORKER - Auto Installer                       ║
echo ║   Your hardware will start earning QUBIC!                ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: Create installation directory
set INSTALL_DIR=%USERPROFILE%\\.qubix
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found!
    echo.
    echo 📥 Downloading Python installer...
    echo.
    
    :: Download Python installer
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe' -OutFile 'python-installer.exe'"
    
    if %errorlevel% neq 0 (
        echo ❌ Failed to download Python. Please install Python manually from python.org
        pause
        exit /b 1
    )
    
    echo 📦 Installing Python (this may take 1-2 minutes)...
    python-installer.exe /quiet InstallAllUsers=0 PrependPath=1 Include_test=0
    
    :: Clean up
    del python-installer.exe
    
    echo ✅ Python installed!
    echo.
    echo ⚠️  IMPORTANT: Please close this terminal and run the installer again!
    pause
    exit /b 0
)

echo ✅ Python found!
python --version
echo.

:: Install dependencies
echo 📦 Installing dependencies...
python -m pip install --upgrade pip --quiet
pip install psutil requests --quiet
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed!
echo.

:: Create worker Python file
echo 📝 Creating worker script...
(
echo ${escapedWorkerCode}
) > qubix_worker.py

:: Create startup script
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo python qubix_worker.py --backend ${backendUrl}
) > start_worker.bat

echo.
echo ✅ Installation complete!
echo.
echo 🚀 Starting QUBIX Worker...
echo.
echo ════════════════════════════════════════════════════════════
echo   Your hardware is being registered on the marketplace!
echo   Keep this window open to continue earning QUBIC.
echo   Press Ctrl+C to stop.
echo ════════════════════════════════════════════════════════════
echo.

:: Start the worker
python qubix_worker.py --backend ${backendUrl}

pause
`;
};

// Generate Linux/macOS installer (.sh)
const generateUnixInstaller = (backendUrl: string, os: 'linux' | 'macos'): string => {
  const workerCode = getWorkerCode();
  
  // Escape the Python code for embedding in shell script
  const escapedWorkerCode = workerCode
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/\$/g, '\\$');

  return `#!/bin/bash
# QUBIX Worker - Auto Installer for ${os === 'macos' ? 'macOS' : 'Linux'}
# This script will install and start the QUBIX worker

set -e

echo ""
echo "🚀 QUBIX Worker - Auto Installer"
echo "========================================"
echo ""

# Create installation directory
INSTALL_DIR="$HOME/.qubix"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Check/Install Python
if ! command -v python3 &> /dev/null; then
    echo "📥 Installing Python..."
    if command -v apt-get &> /dev/null; then
        echo "Using apt-get (Debian/Ubuntu)..."
        sudo apt-get update && sudo apt-get install -y python3 python3-pip
    elif command -v yum &> /dev/null; then
        echo "Using yum (RedHat/CentOS)..."
        sudo yum install -y python3 python3-pip
    elif command -v brew &> /dev/null; then
        echo "Using Homebrew (macOS)..."
        brew install python3
    else
        echo "❌ Could not install Python automatically."
        echo "Please install Python 3.8+ manually and run this script again."
        exit 1
    fi
fi

echo "✅ Python found!"
python3 --version
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
python3 -m pip install --upgrade pip --quiet
pip3 install psutil requests --quiet || python3 -m pip install psutil requests --quiet
echo "✅ Dependencies installed!"
echo ""

# Create worker Python file
echo "📝 Creating worker script..."
cat > qubix_worker.py << 'WORKER_EOF'
${workerCode}
WORKER_EOF

chmod +x qubix_worker.py

# Create startup script
cat > start_worker.sh << 'START_EOF'
#!/bin/bash
cd "$HOME/.qubix"
python3 qubix_worker.py --backend ${backendUrl}
START_EOF

chmod +x start_worker.sh

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Starting QUBIX Worker..."
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Your hardware is being registered on the marketplace!"
echo "  Keep this terminal open to continue earning QUBIC."
echo "  Press Ctrl+C to stop."
echo "════════════════════════════════════════════════════════════"
echo ""

# Start the worker
python3 qubix_worker.py --backend ${backendUrl}
`;
};

// GET /api/installer/worker.py - Download raw worker Python file (must be before /:os route)
router.get('/worker.py', (req: Request, res: Response) => {
  try {
    const workerCode = getWorkerCode();
    
    res.setHeader('Content-Type', 'text/x-python');
    res.setHeader('Content-Disposition', 'attachment; filename="qubix_worker.py"');
    res.send(workerCode);
  } catch (error: any) {
    console.error('Worker download error:', error);
    res.status(500).json({ 
      error: 'Failed to download worker',
      message: error.message 
    });
  }
});

// GET /api/installer/:os - Download installer for specific OS
router.get('/:os', (req: Request, res: Response) => {
  try {
    const { os } = req.params;
    const backendUrl = req.query.backend as string || process.env.BACKEND_URL || 'http://localhost:3001';

    let installerContent: string;
    let filename: string;
    let contentType: string;

    switch (os.toLowerCase()) {
      case 'windows':
        installerContent = generateWindowsInstaller(backendUrl);
        filename = 'qubix-worker-installer.bat';
        contentType = 'application/x-bat';
        break;
      
      case 'linux':
        installerContent = generateUnixInstaller(backendUrl, 'linux');
        filename = 'qubix-worker-installer.sh';
        contentType = 'application/x-sh';
        break;
      
      case 'macos':
      case 'darwin':
        installerContent = generateUnixInstaller(backendUrl, 'macos');
        filename = 'qubix-worker-installer.sh';
        contentType = 'application/x-sh';
        break;
      
      default:
        return res.status(400).json({ 
          error: 'Invalid OS. Supported: windows, linux, macos' 
        });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(installerContent);
  } catch (error: any) {
    console.error('Installer generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate installer',
      message: error.message 
    });
  }
});

export default router;
