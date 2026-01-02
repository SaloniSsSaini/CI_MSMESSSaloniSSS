import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionScreen from './src/screens/TransactionScreen';
import CarbonFootprintScreen from './src/screens/CarbonFootprintScreen';
import CarbonTradingScreen from './src/screens/CarbonTradingScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SMSAnalysisScreen from './src/screens/SMSAnalysisScreen';
import EmailAnalysisScreen from './src/screens/EmailAnalysisScreen';
import IncentivesScreen from './src/screens/IncentivesScreen';
import ReportingScreen from './src/screens/ReportingScreen';

// Import theme
import { theme } from './src/theme/theme';
import { AuthContext } from './src/context/AuthContext';

const Stack = createStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUserToken(token);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    signIn: async (token, userData) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUserToken(token);
        setUser(userData);
      } catch (error) {
        console.error('Error signing in:', error);
      }
    },
    signOut: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        setUserToken(null);
        setUser(null);
      } catch (error) {
        console.error('Error signing out:', error);
      }
    },
    user,
    isLoading
  };

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthContext.Provider value={authContext}>
          <NavigationContainer>
            <StatusBar 
              barStyle="dark-content" 
              backgroundColor={theme.colors.primary}
            />
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {userToken ? (
                // Authenticated screens
                <>
                  <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen}
                    options={{ title: 'Carbon Intelligence' }}
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
                    name="Incentives" 
                    component={IncentivesScreen}
                    options={{ title: 'Incentives & Rewards' }}
                  />
                  <Stack.Screen 
                    name="Reporting" 
                    component={ReportingScreen}
                    options={{ title: 'Sustainability Reports' }}
                  />
                  <Stack.Screen 
                    name="Profile" 
                    component={ProfileScreen}
                    options={{ title: 'Profile' }}
                  />
                </>
              ) : (
                // Unauthenticated screens
                <>
                  <Stack.Screen 
                    name="Login" 
                    component={LoginScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="Register" 
                    component={RegisterScreen}
                    options={{ title: 'Register' }}
                  />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;