@echo off
echo ========================================
echo QUBIX Database Setup Script
echo ========================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker detected! Using Docker setup...
    echo.
    
    REM Go to project root
    cd ..
    
    echo Starting PostgreSQL container...
    docker-compose up -d postgres
    
    if %errorlevel% equ 0 (
        echo PostgreSQL container started successfully!
        echo Waiting 5 seconds for PostgreSQL to initialize...
        timeout /t 5 /nobreak >nul
        
        cd backend
        echo.
        echo Running Prisma migrations...
        call npm run migrate
        
        if %errorlevel% equ 0 (
            echo.
            echo ========================================
            echo Database setup completed successfully!
            echo ========================================
            echo.
            echo You can now start the backend server with: npm run dev
            echo.
        ) else (
            echo.
            echo Migration failed. Please check the error messages above.
            echo.
        )
    ) else (
        echo Failed to start PostgreSQL container.
        echo Please check Docker Desktop is running.
        echo.
    )
) else (
    echo Docker not found!
    echo.
    echo Please install Docker Desktop or PostgreSQL manually.
    echo See DATABASE_SETUP.md for detailed instructions.
    echo.
    pause
)
