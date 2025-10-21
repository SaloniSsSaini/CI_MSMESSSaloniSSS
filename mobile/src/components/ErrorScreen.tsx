import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, IconButton } from 'react-native-paper';
import { theme } from '../theme/theme';
import * as Animatable from 'react-native-animatable';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showCard?: boolean;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  onDismiss,
  showCard = true,
}) => {
  const ErrorContent = () => (
    <View style={styles.content}>
      <Animatable.View
        animation="shake"
        duration={1000}
        style={styles.iconContainer}
      >
        <IconButton
          icon="alert-circle"
          size={64}
          iconColor={theme.colors.error}
        />
      </Animatable.View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      <View style={styles.buttonContainer}>
        {onRetry && (
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.retryButton}
            contentStyle={styles.buttonContent}
          >
            Try Again
          </Button>
        )}
        {onDismiss && (
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.dismissButton}
            contentStyle={styles.buttonContent}
          >
            Dismiss
          </Button>
        )}
      </View>
    </View>
  );

  if (showCard) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <ErrorContent />
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorContent />
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
    maxWidth: 400,
    elevation: 8,
    borderRadius: theme.roundness,
  },
  content: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  retryButton: {
    flex: 1,
  },
  dismissButton: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
});

export default ErrorScreen;