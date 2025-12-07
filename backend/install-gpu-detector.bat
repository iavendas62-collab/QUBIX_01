@echo off
echo ========================================
echo   QUBIX GPU Detector - Installation
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements-gpu.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo To run the GPU detector:
echo   python gpu-detector.py
echo.
echo Or start the mock-server (auto-starts detector):
echo   node mock-server.js
echo.
pause
