import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      
      if (response.success) {
        await signIn(response.data.token, response.data.user);
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Carbon Intelligence</Text>
          <Paragraph style={styles.subtitle}>
            Track your MSME's carbon footprint and sustainable manufacturing
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Sign In</Title>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              disabled={isLoading}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              disabled={isLoading}
            />
            
            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={isLoading}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
              disabled={isLoading}
            >
              Don't have an account? Register
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>SMS & Email Analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🌱</Text>
            <Text style={styles.featureText}>Carbon Footprint Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Analytics & Insights</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💡</Text>
            <Text style={styles.featureText}>Sustainability Recommendations</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    marginBottom: theme.spacing.xl,
    elevation: 4,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  loginButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  registerButton: {
    marginTop: theme.spacing.sm,
  },
  features: {
    marginTop: theme.spacing.lg,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    flex: 1,
  },
});

export default LoginScreen;