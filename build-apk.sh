#!/bin/bash

# Carbon Intelligence APK Build Script
# This script builds the mobile APK for the Carbon Intelligence application

echo "Building Carbon Intelligence Mobile APK..."

# Navigate to the mobile project directory
cd /workspace/mobile

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "Error: ANDROID_HOME environment variable is not set."
    echo "Please install Android SDK and set ANDROID_HOME to the SDK location."
    echo "Example: export ANDROID_HOME=/path/to/android-sdk"
    exit 1
fi

# Check if Java is available
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed or not in PATH."
    echo "Please install Java JDK 8 or higher."
    exit 1
fi

# Build APK (React Native CLI project)
echo "Building APK..."
./build-apk.sh

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "APK built successfully!"
    echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "APK build failed. Please check the error messages above."
    exit 1
fi