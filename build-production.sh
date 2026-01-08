#!/bin/bash

# Production build script for POS Frontend

echo "🚀 Building POS Frontend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building application..."
npm run build

echo "✅ Production build complete! Files are in the 'dist' directory."
echo "📁 Deploy the 'dist' directory to your web server."