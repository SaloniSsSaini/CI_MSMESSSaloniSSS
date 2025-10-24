# Carbon Intelligence Mobile App

A React Native mobile application for MSME carbon footprint tracking with professional UI/UX design.

## 📱 Features

### Core Functionality
- **Carbon Footprint Tracking**: Real-time monitoring of CO₂ emissions
- **SMS & Email Analysis**: AI-powered analysis of business communications
- **Analytics Dashboard**: Comprehensive insights and data visualization
- **Transaction Management**: Financial transaction tracking
- **Sustainability Recommendations**: Personalized improvement suggestions
- **Incentive Programs**: Reward system for sustainable practices
- **Reporting**: Generate detailed sustainability reports

### UI/UX Features
- **Material Design**: Professional Material Design 3 implementation
- **Smooth Animations**: React Native Animatable for fluid transitions
- **Loading States**: Comprehensive loading and error handling
- **Dark Mode Support**: User preference for interface themes
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: Full accessibility support

## 🛠️ Technology Stack

- **React Native 0.72.6**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **React Native Paper**: Material Design components
- **React Navigation**: Navigation library
- **React Native Animatable**: Smooth animations
- **React Native Reanimated**: Advanced animations
- **AsyncStorage**: Local data persistence
- **Axios**: HTTP client
- **React Hook Form**: Form management

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- React Native CLI

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **iOS Setup (macOS only)**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Android Setup**
   - Install Android Studio
   - Set up Android SDK
   - Configure environment variables:
     ```bash
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

## 🚀 Running the App

### Development Mode

**Start Metro bundler**
```bash
npm start
```

**Run on Android**
```bash
npm run android
```

**Run on iOS**
```bash
npm run ios
```

### Production Build

**Android APK**
```bash
npm run build:android
```

**iOS Archive**
```bash
npm run build:ios
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Structure
```
src/
├── components/
│   ├── __tests__/
│   │   ├── CarbonScoreCard.test.tsx
│   │   ├── QuickStatsCard.test.tsx
│   │   ├── LoadingScreen.test.tsx
│   │   └── ErrorScreen.test.tsx
├── screens/
│   ├── __tests__/
│   │   ├── DashboardScreen.test.tsx
│   │   └── LoginScreen.test.tsx
└── services/
    └── __tests__/
        └── apiService.test.ts
```

## 📱 App Architecture

### Navigation Structure
```
App
├── AuthStack
│   ├── LoginScreen
│   └── RegisterScreen
└── MainStack
    ├── DashboardScreen
    ├── TransactionScreen
    ├── CarbonFootprintScreen
    ├── CarbonTradingScreen
    ├── AnalyticsScreen
    ├── SMSAnalysisScreen
    ├── EmailAnalysisScreen
    ├── IncentivesScreen
    ├── ReportingScreen
    └── ProfileScreen
```

### Component Hierarchy
```
App
├── SafeAreaProvider
├── PaperProvider
├── AuthContext.Provider
└── NavigationContainer
    └── Stack.Navigator
        ├── DashboardScreen
        │   ├── CarbonScoreCard
        │   ├── QuickStatsCard
        │   ├── RecentTransactionsCard
        │   └── RecommendationsCard
        └── Other Screens...
```

## 🎨 Design System

### Theme Configuration
```typescript
// Primary colors
primary: '#1B5E20'        // Deep Green
secondary: '#FF8F00'       // Amber
tertiary: '#1565C0'        // Blue

// Surface colors
surface: '#FFFFFF'
background: '#FAFBFC'
surfaceVariant: '#F8F9FA'

// Status colors
success: '#4CAF50'
warning: '#FF9800'
error: '#F44336'
info: '#2196F3'
```

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, accessible
- **Captions**: Subtle, informative
- **Labels**: Clear, descriptive

### Spacing
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

## 🔧 Configuration

### Environment Variables
```env
API_BASE_URL=http://localhost:5000/api
WS_URL=ws://localhost:5000
```

### Build Configuration

**Android (android/app/build.gradle)**
```gradle
android {
    compileSdkVersion 33
    defaultConfig {
        applicationId "com.carbonintelligence"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0"
    }
}
```

**iOS (ios/CarbonIntelligence/Info.plist)**
```xml
<key>CFBundleDisplayName</key>
<string>Carbon Intelligence</string>
<key>CFBundleIdentifier</key>
<string>com.carbonintelligence</string>
```

## 📊 Performance Optimization

### Bundle Size Optimization
- **Code Splitting**: Lazy loading of screens
- **Tree Shaking**: Remove unused code
- **Image Optimization**: Compressed assets
- **Font Optimization**: Subset fonts

### Runtime Performance
- **Memoization**: React.memo for components
- **Virtual Lists**: FlatList for large datasets
- **Image Caching**: Efficient image loading
- **Memory Management**: Proper cleanup

### Metrics
- **App Size**: < 50MB
- **Startup Time**: < 3s
- **Memory Usage**: < 100MB
- **Battery Impact**: Minimal

## 🔒 Security

### Data Protection
- **Encryption**: Sensitive data encryption
- **Secure Storage**: Keychain/Keystore usage
- **Network Security**: HTTPS only
- **Authentication**: JWT tokens

### Privacy
- **Data Minimization**: Collect only necessary data
- **User Consent**: Clear privacy policy
- **Data Retention**: Automatic cleanup
- **GDPR Compliance**: European data protection

## 🚀 Deployment

### Android Play Store

1. **Generate signed APK**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Create app listing**
   - App name: Carbon Intelligence
   - Package name: com.carbonintelligence
   - Category: Business
   - Content rating: Everyone

3. **Upload and publish**
   - Upload APK to Play Console
   - Complete store listing
   - Submit for review

### iOS App Store

1. **Build and archive**
   ```bash
   npx react-native run-ios --configuration Release
   ```

2. **Upload to App Store Connect**
   - Use Xcode or Application Loader
   - Complete app information
   - Submit for review

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues**
```bash
npx react-native start --reset-cache
```

**Android build issues**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

**iOS build issues**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

**Dependency issues**
```bash
rm -rf node_modules
npm install
```

### Debug Mode
```bash
# Enable debug mode
npx react-native start --verbose

# Debug on device
npx react-native run-android --variant=debug
```

## 📈 Analytics & Monitoring

### Crash Reporting
- **Sentry**: Error tracking and performance monitoring
- **Firebase Crashlytics**: Crash reporting
- **Custom Analytics**: User behavior tracking

### Performance Monitoring
- **Flipper**: Development debugging
- **React Native Performance**: Performance profiling
- **Custom Metrics**: App-specific metrics

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Run linting
5. Submit pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ for sustainable business practices**