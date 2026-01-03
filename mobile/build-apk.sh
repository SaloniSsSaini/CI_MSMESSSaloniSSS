#!/bin/bash

# Carbon Intelligence Mobile App - APK Build Script
# This script builds the Android APK for the Carbon Intelligence mobile app

set -e

echo "🚀 Building Carbon Intelligence Mobile App APK..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the mobile app root directory."
    exit 1
fi

# Check if Android directory exists
if [ ! -d "android" ]; then
    print_error "Android directory not found. Please ensure the Android project is set up."
    exit 1
fi

# Check for required tools
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check Java
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java JDK 17."
    exit 1
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME environment variable is not set."
    print_warning "Please set ANDROID_HOME to your Android SDK path."
    print_warning "Example: export ANDROID_HOME=\$HOME/Android/Sdk"
    exit 1
fi

# Check if gradlew exists
if [ ! -f "android/gradlew" ]; then
    print_error "gradlew not found. Please ensure the Android project is properly set up."
    exit 1
fi

print_success "Prerequisites check completed."

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies."
    exit 1
fi

print_success "Dependencies installed successfully."

# Clean previous builds
print_status "Cleaning previous builds..."
cd android
./gradlew clean

if [ $? -ne 0 ]; then
    print_error "Failed to clean previous builds."
    exit 1
fi

print_success "Previous builds cleaned."

# Build debug APK
print_status "Building debug APK..."
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    print_error "Failed to build debug APK."
    exit 1
fi

print_success "Debug APK built successfully."

# Build release APK (if keystore is configured)
print_status "Building release APK..."
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    print_warning "Failed to build release APK. This is normal if no keystore is configured."
    print_warning "Debug APK is available for testing."
else
    print_success "Release APK built successfully."
fi

# Find APK files
print_status "Locating APK files..."

DEBUG_APK=$(find app/build/outputs/apk/debug -name "*.apk" 2>/dev/null | head -1)
RELEASE_APK=$(find app/build/outputs/apk/release -name "*.apk" 2>/dev/null | head -1)

cd ..

# Display results
echo ""
print_success "Build completed successfully!"
echo ""

if [ -n "$DEBUG_APK" ]; then
    print_success "Debug APK: $DEBUG_APK"
    echo "   Size: $(du -h "$DEBUG_APK" | cut -f1)"
    echo "   Install: adb install \"$DEBUG_APK\""
fi

if [ -n "$RELEASE_APK" ]; then
    print_success "Release APK: $RELEASE_APK"
    echo "   Size: $(du -h "$RELEASE_APK" | cut -f1)"
    echo "   Install: adb install \"$RELEASE_APK\""
fi

echo ""
print_status "APK files are ready for installation or distribution."
print_status "For production deployment, configure proper signing in android/app/build.gradle"

# Optional: Install on connected device
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
    if [ $DEVICES -gt 0 ]; then
        echo ""
        read -p "Do you want to install the debug APK on connected device? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [ -n "$DEBUG_APK" ]; then
                print_status "Installing debug APK on connected device..."
                adb install -r "$DEBUG_APK"
                if [ $? -eq 0 ]; then
                    print_success "APK installed successfully on device."
                else
                    print_error "Failed to install APK on device."
                fi
            fi
        fi
    fi
fi

echo ""
print_success "Build script completed!"