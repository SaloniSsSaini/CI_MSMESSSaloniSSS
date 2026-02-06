import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import base64Library from 'base-64';

// Theme and Context
import { theme } from './src/theme/theme';
import { AuthContext, type AuthContextType, type User } from './src/context/AuthContext';

// API Service
import { apiService } from './src/services/apiService';

// Components
import { LoadingScreen } from './src/components/LoadingScreen';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens (Authenticated)
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import CarbonFootprintScreen from './src/screens/CarbonFootprintScreen';
import CarbonTradingScreen from './src/screens/CarbonTradingScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SMSAnalysisScreen from './src/screens/SMSAnalysisScreen';
import EmailAnalysisScreen from './src/screens/EmailAnalysisScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReportingScreen from './src/screens/ReportingScreen';
import IncentivesScreen from './src/screens/IncentivesScreen';
import SmsReadingScreen from './src/screens/SmsReadingScreen';

// Screens (Unauthenticated)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createStackNavigator();

// Ignore specific warnings
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
]);

// Create a navigation theme based on your paper theme
const navigationTheme = {
  ...NavigationDefaultTheme,
  dark: false,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.onSurface,
    border: theme.colors.outline,
    notification: theme.colors.error,
  },
  fonts: NavigationDefaultTheme.fonts,
};

// Header configuration with proper typing
const headerOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: theme.colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.onPrimary,
  },
  headerTintColor: theme.colors.onPrimary,
  headerBackTitleStyle: false,
  headerTitleAlign: 'center' as const,
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    checkAuthState();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkAuthState = async (): Promise<void> => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userData'),
      ]);
      
      if (token && userData && isMountedRef.current) {
        // Set token in API service first
        await apiService.setToken(token);
        
        // Validate token with backend
        const isValid = await validateTokenWithBackend(token);
        
        if (isValid && isMountedRef.current) {
          setUserToken(token);
          setUser(JSON.parse(userData));
        } else {
          await clearAuthData();
        }
      } else if (isMountedRef.current) {
        // No token found, ensure we're in logged out state
        await clearAuthData();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await clearAuthData();
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const decodeBase64 = (str: string): string => {
    try {
      // Replace URL-safe base64 characters
      const base64String = str.replace(/-/g, '+').replace(/_/g, '/');
      
      // Use the library's decode method
      const decoded = base64Library.decode(base64String);
      return decoded;
    } catch (error) {
      console.error('Base64 decode error:', error);
      throw new Error('Failed to decode base64: ' + (error as Error).message);
    }
  };

  const validateTokenWithBackend = async (token: string): Promise<boolean> => {
    try {
      // Basic validation first
      if (!token || token.length < 10) {
        return false;
      }
      
      // Check JWT expiration if it's a JWT token
      if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length === 3) {
          try {
            const decodedPayload = decodeBase64(parts[1]);
            const payload = JSON.parse(decodedPayload);
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Check if token is expired
            if (payload.exp && payload.exp < currentTime) {
              console.log('Token expired');
              return false;
            }
          } catch (e) {
            console.warn('Error parsing token payload:', e);
            // Continue to backend validation if parsing fails
          }
        }
      }
      
      // Verify with backend
      try {
        await apiService.getCurrentUser();
        return true;
      } catch (error: any) {
        console.log('Token validation failed:', error.message);
        // Token is invalid if backend rejects it
        if (error.status === 401 || error.status === 403) {
          return false;
        }
        // For other errors (network, etc), consider token valid
        // to avoid logging out user due to temporary issues
        return true;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  const clearAuthData = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('userToken'),
        AsyncStorage.removeItem('userData'),
        apiService.clearToken(),
      ]);
      
      if (isMountedRef.current) {
        setUserToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const authContext: AuthContextType = {
    signIn: async (token: string, userData: User): Promise<void> => {
      try {
        // Store in AsyncStorage and API service
        await Promise.all([
          AsyncStorage.setItem('userToken', token),
          AsyncStorage.setItem('userData', JSON.stringify(userData)),
          apiService.setToken(token),
        ]);
        
        if (isMountedRef.current) {
          setUserToken(token);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error signing in:', error);
        // Cleanup on error
        await clearAuthData();
        throw error;
      }
    },
    signOut: async (): Promise<void> => {
      try {
        await clearAuthData();
      } catch (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    },
    user,
    isLoading,
  };

  if (isLoading) {
    return (
      <LoadingScreen 
        message="Loading Carbon Intelligence..."
        showCard={true}
      />
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider 
          theme={theme}
          settings={{
            icon: (props) => <MaterialCommunityIcons {...props} />,
          }}
        >
          <AuthContext.Provider value={authContext}>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.primary}
                translucent={false}
              />
              <Stack.Navigator
                screenOptions={headerOptions}
              >
                {userToken ? (
                  // Authenticated Screens
                  <>
                    <Stack.Screen
                      name="Dashboard"
                      component={DashboardScreen}
                      options={{
                        title: 'Carbon Intelligence',
                        headerLeft: () => null,
                      }}
                    />
                    <Stack.Screen
                      name="Transactions"
                      component={TransactionScreen}
                      options={{ title: 'Transactions' }}
                    />
                    <Stack.Screen
                      name="CarbonFootprint"
                      component={CarbonFootprintScreen}
                      options={{ title: 'Carbon Footprint' }}
                    />
                    <Stack.Screen
                      name="CarbonTrading"
                      component={CarbonTradingScreen}
                      options={{ title: 'Carbon Trading' }}
                    />
                    <Stack.Screen
                      name="Analytics"
                      component={AnalyticsScreen}
                      options={{ title: 'Analytics' }}
                    />
                    <Stack.Screen
                      name="SMSAnalysis"
                      component={SMSAnalysisScreen}
                      options={{ title: 'SMS Analysis' }}
                    />
                    <Stack.Screen
                      name="EmailAnalysis"
                      component={EmailAnalysisScreen}
                      options={{ title: 'Email Analysis' }}
                    />
                    <Stack.Screen
                      name="Reporting"
                      component={ReportingScreen}
                      options={{ title: 'Sustainability Reports' }}
                    />
                    <Stack.Screen
                      name="Incentives"
                      component={IncentivesScreen}
                      options={{ title: 'Incentives & Rewards' }}
                    />
                    <Stack.Screen
                      name="SmsReading"
                      component={SmsReadingScreen}
                      options={{ title: 'SMS Inbox' }}
                    />
                    <Stack.Screen
                      name="Profile"
                      component={ProfileScreen}
                      options={{
                        title: 'Profile',
                        headerStyle: {
                          backgroundColor: theme.colors.surface,
                        },
                        headerTintColor: theme.colors.primary,
                        headerTitleStyle: {
                          fontSize: 20,
                          fontWeight: '600' as const,
                          color: theme.colors.onSurface,
                        },
                      }}
                    />
                  </>
                ) : (
                  // Unauthenticated Screens - Login/Register shown by default
                  <>
                    <Stack.Screen
                      name="Login"
                      component={LoginScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="Register"
                      component={RegisterScreen}
                      options={{
                        title: 'Create Account',
                        headerStyle: {
                          backgroundColor: theme.colors.surface,
                        },
                        headerTintColor: theme.colors.primary,
                        headerTitleStyle: {
                          fontSize: 20,
                          fontWeight: '600' as const,
                          color: theme.colors.onSurface,
                        },
                      }}
                    />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </AuthContext.Provider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;