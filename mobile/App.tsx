import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import SmsAndroid from 'react-native-get-sms-android';
// @ts-ignore - JS module
import {createSpamDetector} from './src/pipeline';

type SmsMessage = {
  _id: number | string;
  address?: string;
  body?: string;
  date?: number;
  read?: 0 | 1;
};

// Spam detection result type
type SpamResult = {
  isSpam: boolean;
  confidence: number;
  reasonCodes: string[];
  ruleScore: number | null;
  mlScore: number | null;
  isTransactional: boolean;
};

type ClassifiedMessage = SmsMessage & {
  spamResult: SpamResult;
};

type TabType = 'all' | 'spam' | 'ham';

type PermissionState = 'unknown' | 'granted' | 'denied';

function formatSmsDate(dateMs?: number): string {
  if (!dateMs) {
    return '';
  }
  return new Date(dateMs).toLocaleString();
}

async function requestReadSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    {
      title: 'Read SMS permission',
      message:
        'This app needs access to your SMS inbox so it can display messages on screen.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

// Tab button component
function TabButton({
  title,
  count,
  isActive,
  onPress,
}: {
  title: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, isActive && styles.tabButtonActive]}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {title}
      </Text>
      <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
        <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function App(): JSX.Element {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClassifiedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spamDetector] = useState<any>(() => createSpamDetector());

  const classifyMessages = useCallback(
    (rawMessages: SmsMessage[]): ClassifiedMessage[] => {
      return rawMessages.map(msg => ({
        ...msg,
        spamResult: spamDetector.predict(msg.body || '', msg.address || null),
      }));
    },
    [spamDetector],
  );

  const loadInbox = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setError('SMS inbox access is Android-only.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const filter = {
      box: 'inbox',
      indexFrom: 0,
      maxCount: 100,
    };

    await new Promise<void>(resolve => {
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: string) => {
          setError(String(fail));
          setIsLoading(false);
          resolve();
        },
        (_count: number, smsList: string) => {
          try {
            const parsed = JSON.parse(smsList) as SmsMessage[];
            const classified = classifyMessages(parsed);
            setMessages(classified);
          } catch (e) {
            setError(`Failed to parse SMS list: ${String(e)}`);
          } finally {
            setIsLoading(false);
            resolve();
          }
        },
      );
    });
  }, [classifyMessages]);

  const onRequestPermissionAndLoad = useCallback(async () => {
    setError(null);
    const ok = await requestReadSmsPermission();
    setPermission(ok ? 'granted' : 'denied');
    if (ok) {
      await loadInbox();
    }
  }, [loadInbox]);

  useEffect(() => {
    if (process.env.JEST_WORKER_ID) {
      return;
    }
    if (Platform.OS !== 'android') {
      return;
    }
    onRequestPermissionAndLoad().catch(e => setError(String(e)));
  }, [onRequestPermissionAndLoad]);

  // Filter messages based on active tab
  const filteredMessages = useMemo(() => {
    switch (activeTab) {
      case 'spam':
        return messages.filter(m => m.spamResult.isSpam);
      case 'ham':
        return messages.filter(m => !m.spamResult.isSpam);
      default:
        return messages;
    }
  }, [messages, activeTab]);

  // Count for each category
  const counts = useMemo(() => {
    const spam = messages.filter(m => m.spamResult.isSpam).length;
    return {
      all: messages.length,
      spam,
      ham: messages.length - spam,
    };
  }, [messages]);

  const headerSubtitle = useMemo(() => {
    if (Platform.OS !== 'android') {
      return 'Android-only feature';
    }
    if (permission === 'unknown') {
      return 'Requesting READ_SMS…';
    }
    if (permission === 'denied') {
      return 'Permission denied';
    }
    if (isLoading) {
      return 'Loading & classifying inbox…';
    }
    return `${messages.length} messages classified`;
  }, [isLoading, messages.length, permission]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>SMS Classifier</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onRequestPermissionAndLoad}
          style={({pressed}) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}>
          <Text style={styles.buttonText}>
            {permission === 'granted' ? 'Refresh' : 'Enable'}
          </Text>
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton
          title="All"
          count={counts.all}
          isActive={activeTab === 'all'}
          onPress={() => setActiveTab('all')}
        />
        <TabButton
          title="Other"
          count={counts.spam}
          isActive={activeTab === 'spam'}
          onPress={() => setActiveTab('spam')}
        />
        <TabButton
          title="Important"
          count={counts.ham}
          isActive={activeTab === 'ham'}
          onPress={() => setActiveTab('ham')}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filteredMessages}
        keyExtractor={item => String(item._id)}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <View
            style={[
              styles.row,
              item.spamResult.isSpam ? styles.rowSpam : styles.rowHam,
            ]}>
            <View style={styles.rowHeader}>
              <Text numberOfLines={1} style={styles.address}>
                {item.address ?? 'Unknown sender'}
              </Text>
              <View
                style={[
                  styles.badge,
                  item.spamResult.isSpam ? styles.badgeSpam : styles.badgeHam,
                ]}>
                <Text style={styles.badgeText}>
                  {item.spamResult.isSpam ? 'OTHER' : 'IMPORTANT'}
                </Text>
              </View>
            </View>

            <Text style={styles.date}>{formatSmsDate(item.date)}</Text>

            <Text numberOfLines={3} style={styles.body}>
              {item.body ?? ''}
            </Text>

            {/* Confidence & Reason Codes */}
            <View style={styles.metaRow}>
              <Text style={styles.confidence}>
                Confidence: {(item.spamResult.confidence * 100).toFixed(1)}%
              </Text>
              <Text style={styles.reasonCodes} numberOfLines={1}>
                {item.spamResult.reasonCodes.slice(0, 2).join(' • ')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {permission === 'granted'
              ? activeTab === 'spam'
                ? 'No other messages found.'
                : activeTab === 'ham'
                ? 'No important transactions found.'
                : 'No messages found (or inbox is not accessible on this device).'
              : 'Grant permission to load your inbox.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4F7CFF',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#4F7CFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  error: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    color: '#FF6B6B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  rowSpam: {
    backgroundColor: 'rgba(255,200,100,0.08)',
    borderColor: 'rgba(255,200,100,0.25)',
  },
  rowHam: {
    backgroundColor: 'rgba(100,255,150,0.06)',
    borderColor: 'rgba(100,255,150,0.15)',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  address: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSpam: {
    backgroundColor: '#FF9944',
  },
  badgeHam: {
    backgroundColor: '#22AA55',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confidence: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  reasonCodes: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  empty: {
    paddingVertical: 30,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});

export default App;


// import React, { useEffect, useState } from 'react';
// import { StatusBar } from 'react-native';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { Provider as PaperProvider } from 'react-native-paper';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
// import LoginScreen from './src/screens/LoginScreen';
// import RegisterScreen from './src/screens/RegisterScreen';
// import DashboardScreen from './src/screens/DashboardScreen';
// import TransactionScreen from './src/screens/TransactionScreen';
// import CarbonFootprintScreen from './src/screens/CarbonFootprintScreen';
// import CarbonTradingScreen from './src/screens/CarbonTradingScreen';
// import AnalyticsScreen from './src/screens/AnalyticsScreen';
// import ProfileScreen from './src/screens/ProfileScreen';
// import SMSAnalysisScreen from './src/screens/SMSAnalysisScreen';
// import EmailAnalysisScreen from './src/screens/EmailAnalysisScreen';
// import IncentivesScreen from './src/screens/IncentivesScreen';
// import ReportingScreen from './src/screens/ReportingScreen';

// Import theme
// import { theme } from './src/theme/theme';
// import { AuthContext } from './src/context/AuthContext';

// const Stack = createStackNavigator();

// const App = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [userToken, setUserToken] = useState(null);
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     checkAuthState();
//   }, []);

//   const checkAuthState = async () => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       const userData = await AsyncStorage.getItem('userData');
      
//       if (token && userData) {
//         setUserToken(token);
//         setUser(JSON.parse(userData));
//       }
//     } catch (error) {
//       console.error('Error checking auth state:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const authContext = {
//     signIn: async (token, userData) => {
//       try {
//         await AsyncStorage.setItem('userToken', token);
//         await AsyncStorage.setItem('userData', JSON.stringify(userData));
//         setUserToken(token);
//         setUser(userData);
//       } catch (error) {
//         console.error('Error signing in:', error);
//       }
//     },
//     signOut: async () => {
//       try {
//         await AsyncStorage.removeItem('userToken');
//         await AsyncStorage.removeItem('userData');
//         setUserToken(null);
//         setUser(null);
//       } catch (error) {
//         console.error('Error signing out:', error);
//       }
//     },
//     user,
//     isLoading
//   };

//   if (isLoading) {
//     return null; // You can add a loading screen here
//   }

//   return (
//     <SafeAreaProvider>
//       <PaperProvider theme={theme}>
//         <AuthContext.Provider value={authContext}>
//           <NavigationContainer>
//             <StatusBar 
//               barStyle="dark-content" 
//               backgroundColor={theme.colors.primary}
//             />
//             <Stack.Navigator
//               screenOptions={{
//                 headerStyle: {
//                   backgroundColor: theme.colors.primary,
//                 },
//                 headerTintColor: '#fff',
//                 headerTitleStyle: {
//                   fontWeight: 'bold',
//                 },
//               }}
//             >
//               {userToken ? (
//                 // Authenticated screens
//                 <>
//                   <Stack.Screen 
//                     name="Dashboard" 
//                     component={DashboardScreen}
//                     options={{ title: 'Carbon Intelligence' }}
//                   />
//                   <Stack.Screen 
//                     name="Transactions" 
//                     component={TransactionScreen}
//                     options={{ title: 'Transactions' }}
//                   />
//                   <Stack.Screen 
//                     name="CarbonFootprint" 
//                     component={CarbonFootprintScreen}
//                     options={{ title: 'Carbon Footprint' }}
//                   />
//                   <Stack.Screen 
//                     name="CarbonTrading" 
//                     component={CarbonTradingScreen}
//                     options={{ title: 'Carbon Trading' }}
//                   />
//                   <Stack.Screen 
//                     name="Analytics" 
//                     component={AnalyticsScreen}
//                     options={{ title: 'Analytics' }}
//                   />
//                   <Stack.Screen 
//                     name="SMSAnalysis" 
//                     component={SMSAnalysisScreen}
//                     options={{ title: 'SMS Analysis' }}
//                   />
//                   <Stack.Screen 
//                     name="EmailAnalysis" 
//                     component={EmailAnalysisScreen}
//                     options={{ title: 'Email Analysis' }}
//                   />
//                   <Stack.Screen 
//                     name="Incentives" 
//                     component={IncentivesScreen}
//                     options={{ title: 'Incentives & Rewards' }}
//                   />
//                   <Stack.Screen 
//                     name="Reporting" 
//                     component={ReportingScreen}
//                     options={{ title: 'Sustainability Reports' }}
//                   />
//                   <Stack.Screen 
//                     name="Profile" 
//                     component={ProfileScreen}
//                     options={{ title: 'Profile' }}
//                   />
//                 </>
//               ) : (
//                 // Unauthenticated screens
//                 <>
//                   <Stack.Screen 
//                     name="Login" 
//                     component={LoginScreen}
//                     options={{ headerShown: false }}
//                   />
//                   <Stack.Screen 
//                     name="Register" 
//                     component={RegisterScreen}
//                     options={{ title: 'Register' }}
//                   />
//                 </>
//               )}
//             </Stack.Navigator>
//           </NavigationContainer>
//         </AuthContext.Provider>
//       </PaperProvider>
//     </SafeAreaProvider>
//   );
// };

// export default App;

// import React, { useState, useEffect, useRef } from 'react';
// import { StatusBar, LogBox } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { Provider as PaperProvider } from 'react-native-paper';
// import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
// import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Theme and Context
// import { theme } from './src/theme/theme';
// import { AuthContext, type AuthContextType, type User } from './src/context/AuthContext';

// // Components
// import { LoadingScreen } from './src/components/LoadingScreen';
// import ErrorBoundary from './src/components/ErrorBoundary';

// // Screens (Authenticated)
// import DashboardScreen from './src/screens/DashboardScreen';
// import TransactionScreen from './src/screens/TransactionScreen';
// import CarbonFootprintScreen from './src/screens/CarbonFootprintScreen';
// import CarbonTradingScreen from './src/screens/CarbonTradingScreen';
// import AnalyticsScreen from './src/screens/AnalyticsScreen';
// import SMSAnalysisScreen from './src/screens/SMSAnalysisScreen';
// import EmailAnalysisScreen from './src/screens/EmailAnalysisScreen';
// // import IncentivesScreen from './src/screens/IncentivesScreen';
// // import ReportingScreen from './src/screens/ReportingScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

// // Screens (Unauthenticated)
// import LoginScreen from './src/screens/LoginScreen';
// import RegisterScreen from './src/screens/RegisterScreen';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// const Stack = createStackNavigator();

// // Ignore specific warnings
// LogBox.ignoreLogs([
//   'AsyncStorage has been extracted',
// ]);

// // Create a navigation theme based on your paper theme
// const navigationTheme = {
//   ...NavigationDefaultTheme,
//   dark: false,
//   colors: {
//     ...NavigationDefaultTheme.colors,
//     primary: theme.colors.primary,
//     background: theme.colors.background,
//     card: theme.colors.surface,
//     text: theme.colors.onSurface,
//     border: theme.colors.outline,
//     notification: theme.colors.error,
//   },
//   fonts: NavigationDefaultTheme.fonts, // Add fonts from default theme
// };

// // Header configuration with proper typing
// const headerOptions: StackNavigationOptions = {
//   headerStyle: {
//     backgroundColor: theme.colors.primary,
//     elevation: 0,
//     shadowOpacity: 0,
//   },
//   headerTitleStyle: {
//     fontSize: 20,
//     fontWeight: '600' as const, // Use const assertion for specific font weights
//     color: theme.colors.onPrimary,
//   },
//   headerTintColor: theme.colors.onPrimary,
//   headerBackTitleStyle: false,
//   headerTitleAlign: 'center' as const,
// };

// const App: React.FC = () => {
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [userToken, setUserToken] = useState<string | null>(null);
//   const [user, setUser] = useState<User | null>(null);
//   const isMountedRef = useRef<boolean>(true);

//   useEffect(() => {
//     isMountedRef.current = true;
//     checkAuthState();
    
//     return () => {
//       isMountedRef.current = false;
//     };
//   }, []);

//   const checkAuthState = async (): Promise<void> => {
//     try {
//       const [token, userData] = await Promise.all([
//         AsyncStorage.getItem('userToken'),
//         AsyncStorage.getItem('userData'),
//       ]);
      
//       if (token && userData) {
//         const isValid = await validateToken(token);
        
//         if (isValid && isMountedRef.current) {
//           setUserToken(token);
//           setUser(JSON.parse(userData));
//         } else {
//           await clearAuthData();
//         }
//       }
//     } catch (error) {
//       console.error('Error checking auth state:', error);
//       await clearAuthData();
//     } finally {
//       if (isMountedRef.current) {
//         setIsLoading(false);
//       }
//     }
//   };

//   const validateToken = async (token: string): Promise<boolean> => {
//     try {
//       if (!token || token.length < 10) {
//         return false;
//       }
      
//       // Optional: Parse JWT and check expiration
//       if (token.includes('.')) {
//         const parts = token.split('.');
//         if (parts.length === 3) {
//           try {
//             const payload = JSON.parse(atob(parts[1]));
//             const currentTime = Math.floor(Date.now() / 1000);
//             if (payload.exp && payload.exp < currentTime) {
//               return false;
//             }
//           } catch (e) {
//             console.warn('Error parsing token payload:', e);
//           }
//         }
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Error validating token:', error);
//       return false;
//     }
//   };

//   const clearAuthData = async (): Promise<void> => {
//     try {
//       await Promise.all([
//         AsyncStorage.removeItem('userToken'),
//         AsyncStorage.removeItem('userData'),
//       ]);
//       if (isMountedRef.current) {
//         setUserToken(null);
//         setUser(null);
//       }
//     } catch (error) {
//       console.error('Error clearing auth data:', error);
//     }
//   };

//   const authContext: AuthContextType = {
//     signIn: async (token: string, userData: User): Promise<void> => {
//       try {
//         await Promise.all([
//           AsyncStorage.setItem('userToken', token),
//           AsyncStorage.setItem('userData', JSON.stringify(userData)),
//         ]);
        
//         if (isMountedRef.current) {
//           setUserToken(token);
//           setUser(userData);
//         }
//       } catch (error) {
//         console.error('Error signing in:', error);
//         throw error;
//       }
//     },
//     signOut: async (): Promise<void> => {
//       try {
//         await clearAuthData();
//       } catch (error) {
//         console.error('Error signing out:', error);
//         throw error;
//       }
//     },
//     user,
//     isLoading,
//   };

//   if (isLoading) {
//     return (
//       <LoadingScreen 
//         message="Loading Carbon Intelligence..."
//         showCard={true}
//       />
//     );
//   }

//   return (
//     <ErrorBoundary>
//       <SafeAreaProvider>
//         <PaperProvider theme={theme}
//           settings={{
//             icon: (props) => <MaterialCommunityIcons {...props} />,
//           }}
//         >
//           <AuthContext.Provider value={authContext}>
//             <NavigationContainer theme={navigationTheme}>
//               <StatusBar 
//                 barStyle="light-content" 
//                 backgroundColor={theme.colors.primary}
//                 translucent={false}
//               />
//               <Stack.Navigator 
//                 screenOptions={headerOptions}
//                 initialRouteName={userToken ? "Dashboard" : "Login"}
//               >
//                 {userToken ? (
//                   // Authenticated Screens
//                   <>
//                     <Stack.Screen 
//                       name="Dashboard" 
//                       component={DashboardScreen}
//                       options={{ 
//                         title: 'Carbon Intelligence',
//                         headerLeft: () => null,
//                       }}
//                     />
//                     <Stack.Screen 
//                       name="Transactions" 
//                       component={TransactionScreen}
//                       options={{ title: 'Transactions' }}
//                     />
//                     <Stack.Screen 
//                       name="CarbonFootprint" 
//                       component={CarbonFootprintScreen}
//                       options={{ title: 'Carbon Footprint' }}
//                     />
//                     <Stack.Screen 
//                       name="CarbonTrading" 
//                       component={CarbonTradingScreen}
//                       options={{ title: 'Carbon Trading' }}
//                     />
//                     <Stack.Screen 
//                       name="Analytics" 
//                       component={AnalyticsScreen}
//                       options={{ title: 'Analytics' }}
//                     />
//                     <Stack.Screen 
//                       name="SMSAnalysis" 
//                       component={SMSAnalysisScreen}
//                       options={{ title: 'SMS Analysis' }}
//                     />
//                     <Stack.Screen 
//                       name="EmailAnalysis" 
//                       component={EmailAnalysisScreen}
//                       options={{ title: 'Email Analysis' }}
//                     />
//                     {/* <Stack.Screen 
//                       name="Incentives" 
//                       component={IncentivesScreen}
//                       options={{ title: 'Incentives & Rewards' }}
//                     /> */}
//                     {/* <Stack.Screen 
//                       name="Reporting" 
//                       component={ReportingScreen}
//                       options={{ title: 'Sustainability Reports' }}
//                     /> */}
//                     <Stack.Screen 
//                       name="Profile" 
//                       component={ProfileScreen}
//                       options={{ 
//                         title: 'Profile',
//                         headerStyle: {
//                           backgroundColor: theme.colors.surface,
//                         },
//                         headerTintColor: theme.colors.primary,
//                         headerTitleStyle: {
//                           fontSize: 20,
//                           fontWeight: '600' as const,
//                           color: theme.colors.onSurface,
//                         },
//                       }}
//                     />
//                   </>
//                 ) : (
//                   // Unauthenticated Screens
//                   <>
//                     <Stack.Screen 
//                       name="Login" 
//                       component={LoginScreen}
//                       options={{ headerShown: false }}
//                     />
//                     <Stack.Screen 
//                       name="Register" 
//                       component={RegisterScreen}
//                       options={{ 
//                         title: 'Create Account',
//                         headerStyle: {
//                           backgroundColor: theme.colors.surface,
//                         },
//                         headerTintColor: theme.colors.primary,
//                         headerTitleStyle: {
//                           fontSize: 20,
//                           fontWeight: '600' as const,
//                           color: theme.colors.onSurface,
//                         },
//                       }}
//                     />
//                   </>
//                 )}
//               </Stack.Navigator>
//             </NavigationContainer>
//           </AuthContext.Provider>
//         </PaperProvider>
//       </SafeAreaProvider>
//     </ErrorBoundary>
//   );
// };

// export default App;

// import React, { useState, useEffect, useRef } from 'react';
// import { StatusBar, LogBox } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { Provider as PaperProvider } from 'react-native-paper';
// import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
// import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import base64Library from 'base-64';
// import IncentivesScreen from './src/screens/IncentivesScreen';

// // Theme and Context
// import { theme } from './src/theme/theme';
// import { AuthContext, type AuthContextType, type User } from './src/context/AuthContext';

// // API Service
// import { apiService } from './src/services/apiService';

// // Components
// import { LoadingScreen } from './src/components/LoadingScreen';
// import ErrorBoundary from './src/components/ErrorBoundary';

// // Screens (Authenticated)
// import DashboardScreen from './src/screens/DashboardScreen';
// import TransactionScreen from './src/screens/TransactionScreen';
// import CarbonFootprintScreen from './src/screens/CarbonFootprintScreen';
// import CarbonTradingScreen from './src/screens/CarbonTradingScreen';
// import AnalyticsScreen from './src/screens/AnalyticsScreen';
// import SMSAnalysisScreen from './src/screens/SMSAnalysisScreen';
// import EmailAnalysisScreen from './src/screens/EmailAnalysisScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

// // Screens (Unauthenticated)
// import LoginScreen from './src/screens/LoginScreen';
// import RegisterScreen from './src/screens/RegisterScreen';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// const Stack = createStackNavigator();

// // Ignore specific warnings
// LogBox.ignoreLogs([
//   'AsyncStorage has been extracted',
// ]);

// // Create a navigation theme based on your paper theme
// const navigationTheme = {
//   ...NavigationDefaultTheme,
//   dark: false,
//   colors: {
//     ...NavigationDefaultTheme.colors,
//     primary: theme.colors.primary,
//     background: theme.colors.background,
//     card: theme.colors.surface,
//     text: theme.colors.onSurface,
//     border: theme.colors.outline,
//     notification: theme.colors.error,
//   },
//   fonts: NavigationDefaultTheme.fonts,
// };

// // Header configuration with proper typing
// const headerOptions: StackNavigationOptions = {
//   headerStyle: {
//     backgroundColor: theme.colors.primary,
//     elevation: 0,
//     shadowOpacity: 0,
//   },
//   headerTitleStyle: {
//     fontSize: 20,
//     fontWeight: '600' as const,
//     color: theme.colors.onPrimary,
//   },
//   headerTintColor: theme.colors.onPrimary,
//   headerBackTitleStyle: false,
//   headerTitleAlign: 'center' as const,
// };

// const App: React.FC = () => {
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [userToken, setUserToken] = useState<string | null>(null);
//   const [user, setUser] = useState<User | null>(null);
//   const isMountedRef = useRef<boolean>(true);

//   useEffect(() => {
//     isMountedRef.current = true;
//     checkAuthState();
    
//     return () => {
//       isMountedRef.current = false;
//     };
//   }, []);

//   const checkAuthState = async (): Promise<void> => {
//     try {
//       const [token, userData] = await Promise.all([
//         AsyncStorage.getItem('userToken'),
//         AsyncStorage.getItem('userData'),
//       ]);
      
//       if (token && userData) {
//         // Validate token by checking expiration (if JWT) or via API
//         const isValid = await validateToken(token);
        
//         if (isValid && isMountedRef.current) {
//           setUserToken(token);
//           setUser(JSON.parse(userData));
//           // Set the auth token for API calls
//           apiService.setAuthToken(token);
//         } else {
//           await clearAuthData();
//         }
//       }
//     } catch (error) {
//       console.error('Error checking auth state:', error);
//       await clearAuthData();
//     } finally {
//       if (isMountedRef.current) {
//         setIsLoading(false);
//       }
//     }
//   };

//   const validateToken = async (token: string): Promise<boolean> => {
//     try {
//       if (!token || token.length < 10) {
//         return false;
//       }
      
//       // Parse JWT using base64Library
//       if (token.includes('.')) {
//         const parts = token.split('.');
//         if (parts.length === 3) {
//           try {
//             const payload = JSON.parse(base64Library.decode(parts[1]));
//             const currentTime = Math.floor(Date.now() / 1000);
//             if (payload.exp && payload.exp < currentTime) {
//               console.log('Token expired');
//               return false;
//             }
//           } catch (e) {
//             console.warn('Error parsing token payload:', e);
//           }
//         }
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Error validating token:', error);
//       return false;
//     }
//   };

//   const clearAuthData = async (): Promise<void> => {
//     try {
//       await Promise.all([
//         AsyncStorage.removeItem('userToken'),
//         AsyncStorage.removeItem('userData'),
//       ]);
//       // Clear the API auth token
//       apiService.setAuthToken(null);
      
//       if (isMountedRef.current) {
//         setUserToken(null);
//         setUser(null);
//       }
//     } catch (error) {
//       console.error('Error clearing auth data:', error);
//     }
//   };

//   const authContext: AuthContextType = {
//     signIn: async (token: string, userData: User): Promise<void> => {
//       try {
//         await Promise.all([
//           AsyncStorage.setItem('userToken', token),
//           AsyncStorage.setItem('userData', JSON.stringify(userData)),
//         ]);
        
//         // Set the auth token for API calls
//         apiService.setAuthToken(token);
        
//         if (isMountedRef.current) {
//           setUserToken(token);
//           setUser(userData);
//         }
//       } catch (error) {
//         console.error('Error signing in:', error);
//         throw error;
//       }
//     },
//     signOut: async (): Promise<void> => {
//       try {
//         await clearAuthData();
//       } catch (error) {
//         console.error('Error signing out:', error);
//         throw error;
//       }
//     },
//     user,
//     isLoading,
//   };

//   if (isLoading) {
//     return (
//       <LoadingScreen 
//         message="Loading Carbon Intelligence..."
//         showCard={true}
//       />
//     );
//   }

//   return (
//     <ErrorBoundary>
//       <SafeAreaProvider>
//         <PaperProvider theme={theme}
//           settings={{
//             icon: (props) => <MaterialCommunityIcons {...props} />,
//           }}
//         >
//           <AuthContext.Provider value={authContext}>
//             <NavigationContainer theme={navigationTheme}>
//               <StatusBar 
//                 barStyle="light-content" 
//                 backgroundColor={theme.colors.primary}
//                 translucent={false}
//               />
//               <Stack.Navigator 
//                 screenOptions={headerOptions}
//                 initialRouteName={userToken ? "Dashboard" : "Login"}
//               >
//                 {userToken ? (
//                   // Authenticated Screens
//                   <>
//                     <Stack.Screen 
//                       name="Dashboard" 
//                       component={DashboardScreen}
//                       options={{ 
//                         title: 'Carbon Intelligence',
//                         headerLeft: () => null,
//                       }}
//                     />
//                     <Stack.Screen 
//                       name="Transactions" 
//                       component={TransactionScreen}
//                       options={{ title: 'Transactions' }}
//                     />
//                     <Stack.Screen 
//                       name="CarbonFootprint" 
//                       component={CarbonFootprintScreen}
//                       options={{ title: 'Carbon Footprint' }}
//                     />
//                     <Stack.Screen 
//                       name="CarbonTrading" 
//                       component={CarbonTradingScreen}
//                       options={{ title: 'Carbon Trading' }}
//                     />
//                     <Stack.Screen 
//                       name="Analytics" 
//                       component={AnalyticsScreen}
//                       options={{ title: 'Analytics' }}
//                     />
//                     <Stack.Screen 
//                       name="SMSAnalysis" 
//                       component={SMSAnalysisScreen}
//                       options={{ title: 'SMS Analysis' }}
//                     />
//                     <Stack.Screen 
//                       name="EmailAnalysis" 
//                       component={EmailAnalysisScreen}
//                       options={{ title: 'Email Analysis' }}
//                     />
//                     <Stack.Screen 
//                       name="Incentives" 
//                       component={IncentivesScreen}
//                       options={{ title: 'Incentives & Rewards' }}
//                     />
//                     <Stack.Screen 
//                       name="Profile" 
//                       component={ProfileScreen}
//                       options={{ 
//                         title: 'Profile',
//                         headerStyle: {
//                           backgroundColor: theme.colors.surface,
//                         },
//                         headerTintColor: theme.colors.primary,
//                         headerTitleStyle: {
//                           fontSize: 20,
//                           fontWeight: '600' as const,
//                           color: theme.colors.onSurface,
//                         },
//                       }}
//                     />
//                   </>
//                 ) : (
//                   // Unauthenticated Screens
//                   <>
//                     <Stack.Screen 
//                       name="Login" 
//                       component={LoginScreen}
//                       options={{ headerShown: false }}
//                     />
//                     <Stack.Screen 
//                       name="Register" 
//                       component={RegisterScreen}
//                       options={{ 
//                         title: 'Create Account',
//                         headerStyle: {
//                           backgroundColor: theme.colors.surface,
//                         },
//                         headerTintColor: theme.colors.primary,
//                         headerTitleStyle: {
//                           fontSize: 20,
//                           fontWeight: '600' as const,
//                           color: theme.colors.onSurface,
//                         },
//                       }}
//                     />
//                   </>
//                 )}
//               </Stack.Navigator>
//             </NavigationContainer>
//           </AuthContext.Provider>
//         </PaperProvider>
//       </SafeAreaProvider>
//     </ErrorBoundary>
//   );
// };

// export default App;