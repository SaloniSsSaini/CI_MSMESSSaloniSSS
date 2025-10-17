#!/bin/bash

echo "Building Carbon Intelligence APK..."

# Create a minimal package.json for build
cat > package-minimal.json << EOF
{
  "name": "carbon-intelligence",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "build-android": "cd android && ./gradlew assembleRelease"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.25.0",
    "react-native-safe-area-context": "^4.7.4",
    "react-native-gesture-handler": "^2.13.4",
    "react-native-vector-icons": "^10.0.3",
    "react-native-paper": "^5.11.6",
    "react-native-linear-gradient": "^2.8.3",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "^13.14.0",
    "react-native-permissions": "^4.1.1",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "crypto-js": "^4.2.0",
    "axios": "^1.6.2",
    "react-native-device-info": "^10.11.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/eslint-config": "^0.72.2",
    "@react-native/metro-config": "^0.72.11",
    "@tsconfig/react-native": "^3.0.0",
    "@types/react": "^18.0.24",
    "@types/react-test-renderer": "^18.0.0",
    "babel-jest": "^29.2.1",
    "eslint": "^8.19.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.76.8",
    "prettier": "^2.4.1",
    "react-test-renderer": "18.2.0",
    "typescript": "4.8.4"
  }
}
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Ensure gradle wrapper exists
if [ ! -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
    echo "Gradle wrapper not found, downloading..."
    cd android
    ./gradlew wrapper --gradle-version=7.5
    cd ..
fi

# Set permissions
chmod +x android/gradlew

# Build the APK
echo "Building APK..."
cd android
./gradlew assembleRelease

echo "APK build completed!"
echo "APK location: android/app/build/outputs/apk/release/app-release.apk"