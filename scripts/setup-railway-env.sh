#!/bin/bash

# Railway Environment Setup Script
# This script helps configure Railway environment variables

echo "🚂 Setting up Railway Environment Variables..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set!"
    echo "Please add a PostgreSQL database to your Railway project and set DATABASE_URL"
    exit 1
fi

# Check if DIRECT_DATABASE_URL is set (for Prisma)
if [ -z "$DIRECT_DATABASE_URL" ]; then
    echo "⚠️  DIRECT_DATABASE_URL not set, using DATABASE_URL"
    export DIRECT_DATABASE_URL=$DATABASE_URL
fi

# Check other required variables
REQUIRED_VARS=(
    "JWT_SECRET"
    "QUBIC_PLATFORM_SEED"
    "QUBIC_PLATFORM_ADDRESS"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var is not set! Using default value for development."
        case $var in
            "JWT_SECRET")
                export JWT_SECRET="railway_dev_jwt_secret_change_in_production"
                ;;
            "QUBIC_PLATFORM_SEED")
                export QUBIC_PLATFORM_SEED="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                ;;
            "QUBIC_PLATFORM_ADDRESS")
                export QUBIC_PLATFORM_ADDRESS="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                ;;
        esac
    fi
done

# Set default values for optional variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export LOG_LEVEL=${LOG_LEVEL:-info}
export QUBIC_NETWORK=${QUBIC_NETWORK:-mainnet}
export QUBIC_CONFIRMATIONS=${QUBIC_CONFIRMATIONS:-3}
export QUBIC_GAS_LIMIT=${QUBIC_GAS_LIMIT:-1000000}

# Redis is optional - disable if not available
if [ -z "$REDIS_URL" ]; then
    echo "⚠️  Redis not configured - some features may be limited"
fi

echo "✅ Railway environment setup complete!"
echo "📋 Environment Variables:"
echo "   DATABASE_URL: ✅ Set"
echo "   DIRECT_DATABASE_URL: ✅ Set"
echo "   JWT_SECRET: ✅ Set"
echo "   REDIS_URL: $([ -z "$REDIS_URL" ] && echo "❌ Not set" || echo "✅ Set")"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
