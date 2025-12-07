#!/bin/bash
set -e

echo "🏗️  Building QUBIX for production..."

# Build backend
echo "📦 Building backend..."
cd backend
npm ci
npm run build
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "✅ Build complete!"
