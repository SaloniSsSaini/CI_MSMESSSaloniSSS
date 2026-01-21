#!/bin/bash

# Carbon Intelligence - MSME Deployment Script

echo "🌱 Carbon Intelligence - MSME Deployment Script"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false --passWithNoTests

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed, but continuing with build..."
fi

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Application built successfully"

# Check if serve is installed globally
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve globally..."
    npm install -g serve
fi

echo "🚀 Starting development server..."
echo "📱 Open your browser and navigate to: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"

# Serve the built application
serve -s build -l 3000