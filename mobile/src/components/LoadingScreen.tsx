import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ActivityIndicator, Text, Card } from 'react-native-paper';
import { theme } from '../theme/theme';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  showCard?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showCard = true,
}) => {
  const LoadingContent = () => (
    <View style={styles.content}>
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={1500}
        style={styles.iconContainer}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Animatable.View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );

  if (showCard) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <LoadingContent />
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadingContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    elevation: 8,
    borderRadius: theme.roundness,
  },
  content: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  message: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoadingScreen;