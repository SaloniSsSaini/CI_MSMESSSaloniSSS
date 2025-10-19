import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  List,
  Avatar,
  Divider,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';
import { apiService } from '../services/apiService';

const ProfileScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMSMEProfile();
      if (response.success) {
        setProfileData(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Info', 'Edit profile feature coming soon!');
  };

  const handleChangePassword = () => {
    // TODO: Navigate to change password screen
    Alert.alert('Info', 'Change password feature coming soon!');
  };

  const handleExportData = () => {
    // TODO: Implement data export
    Alert.alert('Info', 'Data export feature coming soon!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Info', 'Account deletion feature coming soon!');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Text style={styles.profileRole}>
                  {user?.role?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* MSME Information */}
        {user?.msme && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Company Information</Title>
              <List.Item
                title="Company Name"
                description={user.msme.companyName}
                left={() => <List.Icon icon="domain" />}
              />
              <List.Item
                title="Company Type"
                description={user.msme.companyType.toUpperCase()}
                left={() => <List.Icon icon="factory" />}
              />
              <List.Item
                title="Industry"
                description={user.msme.industry}
                left={() => <List.Icon icon="briefcase" />}
              />
              <List.Item
                title="Carbon Score"
                description={`${user.msme.carbonScore}/100`}
                left={() => <List.Icon icon="leaf" />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Settings</Title>
            <List.Item
              title="Notifications"
              description="Receive push notifications"
              left={() => <List.Icon icon="bell" />}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Auto Sync"
              description="Automatically sync data"
              left={() => <List.Icon icon="sync" />}
              right={() => (
                <Switch
                  value={autoSync}
                  onValueChange={setAutoSync}
                />
              )}
            />
            <Divider />
            <List.Item
              title="Change Password"
              description="Update your password"
              left={() => <List.Icon icon="lock" />}
              onPress={handleChangePassword}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Data Management</Title>
            <List.Item
              title="Export Data"
              description="Download your data"
              left={() => <List.Icon icon="download" />}
              onPress={handleExportData}
            />
            <Divider />
            <List.Item
              title="Clear Cache"
              description="Clear app cache"
              left={() => <List.Icon icon="delete-sweep" />}
              onPress={() => {
                Alert.alert('Info', 'Clear cache feature coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>App Information</Title>
            <List.Item
              title="Version"
              description="1.0.0"
              left={() => <List.Icon icon="information" />}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              description="View privacy policy"
              left={() => <List.Icon icon="shield-account" />}
              onPress={() => {
                Alert.alert('Info', 'Privacy policy feature coming soon!');
              }}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              description="View terms of service"
              left={() => <List.Icon icon="file-document" />}
              onPress={() => {
                Alert.alert('Info', 'Terms of service feature coming soon!');
              }}
            />
          </Card.Content>
        </Card>

        {/* Sign Out */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleSignOut}
              style={styles.signOutButton}
              buttonColor={theme.colors.error}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>

        {/* Delete Account */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={styles.deleteButton}
              textColor={theme.colors.error}
            >
              Delete Account
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  profileCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  editButton: {
    marginTop: theme.spacing.sm,
  },
  card: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  signOutButton: {
    marginTop: theme.spacing.sm,
  },
  deleteButton: {
    marginTop: theme.spacing.sm,
    borderColor: theme.colors.error,
  },
});

export default ProfileScreen;