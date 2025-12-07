#!/bin/bash

echo "========================================"
echo "QUBIX Database Setup Script"
echo "========================================"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Docker detected! Using Docker setup..."
    echo ""
    
    # Go to project root
    cd ..
    
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    if [ $? -eq 0 ]; then
        echo "PostgreSQL container started successfully!"
        echo "Waiting 5 seconds for PostgreSQL to initialize..."
        sleep 5
        
        cd backend
        echo ""
        echo "Running Prisma migrations..."
        npm run migrate
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "========================================"
            echo "Database setup completed successfully!"
            echo "========================================"
            echo ""
            echo "You can now start the backend server with: npm run dev"
            echo ""
        else
            echo ""
            echo "Migration failed. Please check the error messages above."
            echo ""
        fi
    else
        echo "Failed to start PostgreSQL container."
        echo "Please check Docker is running."
        echo ""
    fi
else
    echo "Docker not found!"
    echo ""
    echo "Please install Docker or PostgreSQL manually."
    echo "See DATABASE_SETUP.md for detailed instructions."
    echo ""
fi
