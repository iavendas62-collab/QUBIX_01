@echo off
REM QUBIX Production Deployment Script for Windows
REM Requirements: All - Deploy and configure production environment

echo ========================================
echo   QUBIX Production Deployment Script
echo ========================================

REM Check for Docker
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not installed
    exit /b 1
)
echo [OK] Docker is installed

REM Check for environment file
if not exist ".env.production" (
    echo Error: .env.production file not found
    echo Please copy .env.production.example to .env.production and configure it
    exit /b 1
)
echo [OK] Environment file found

REM Create SSL directory if not exists
if not exist "ssl" mkdir ssl

REM Check for SSL certificates
if not exist "ssl\fullchain.pem" (
    echo Warning: SSL certificates not found in .\ssl\
    echo For production, generate certificates with Let's Encrypt
    echo Creating self-signed certificates for testing...
    
    REM Note: This requires OpenSSL to be installed
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 ^
        -keyout ssl\privkey.pem ^
        -out ssl\fullchain.pem ^
        -subj "/C=US/ST=State/L=City/O=QUBIX/CN=localhost" 2>nul
    
    if %ERRORLEVEL% neq 0 (
        echo Warning: Could not create self-signed certificates
        echo Please install OpenSSL or provide certificates manually
    ) else (
        echo [OK] Self-signed certificates created
    )
) else (
    echo [OK] SSL certificates found
)

echo.
echo Building and deploying QUBIX...

REM Pull latest images
echo Pulling latest base images...
docker compose -f docker-compose.prod.yml pull postgres redis

REM Build application images
echo Building application images...
docker compose -f docker-compose.prod.yml build --no-cache

REM Stop existing containers
echo Stopping existing containers...
docker compose -f docker-compose.prod.yml down

REM Start services
echo Starting services...
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

REM Wait for services
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Run database migrations
echo Running database migrations...
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Container Status:
docker ps --filter "name=qubix" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo QUBIX is now running!
echo Frontend: https://localhost (or your domain)
echo Backend API: https://localhost/api
echo WebSocket: wss://localhost/ws
echo.
echo View logs with: docker compose -f docker-compose.prod.yml logs -f

pause
