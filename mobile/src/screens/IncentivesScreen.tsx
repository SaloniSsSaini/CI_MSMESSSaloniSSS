import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, Button, ProgressBar, Chip, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: string;
  available: boolean;
}

interface UserStats {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentLevelPoints: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  streak: number;
  carbonSaved: number;
}

const IncentivesScreen: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 1250,
    level: 3,
    nextLevelPoints: 2000,
    currentLevelPoints: 1000,
    achievementsUnlocked: 8,
    totalAchievements: 19,
    streak: 7,
    carbonSaved: 45.2
  });

  const [achievements, _setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'Carbon Warrior',
      description: 'Complete 10 carbon footprint assessments',
      points: 100,
      icon: '🛡️',
      completed: true,
      progress: 10,
      maxProgress: 10
    },
    {
      id: '2',
      title: 'Green Streak',
      description: 'Maintain a 7-day activity streak',
      points: 50,
      icon: '🔥',
      completed: true,
      progress: 7,
      maxProgress: 7
    },
    {
      id: '3',
      title: 'Eco Explorer',
      description: 'Try 5 different sustainable practices',
      points: 75,
      icon: '🌱',
      completed: false,
      progress: 3,
      maxProgress: 5
    },
    {
      id: '4',
      title: 'Data Master',
      description: 'Upload 20 transaction files',
      points: 150,
      icon: '📊',
      completed: false,
      progress: 12,
      maxProgress: 20
    },
    {
      id: '5',
      title: 'Recommendation Follower',
      description: 'Implement 3 sustainability recommendations',
      points: 200,
      icon: '💡',
      completed: false,
      progress: 1,
      maxProgress: 3
    },
    {
      id: '6',
      title: 'Green Finance Pioneer',
      description: 'Apply for 2 green finance schemes or loans',
      points: 300,
      icon: '💰',
      completed: false,
      progress: 0,
      maxProgress: 2
    },
    {
      id: '7',
      title: 'ESG Investor',
      description: 'Complete ESG compliance assessment',
      points: 250,
      icon: '📈',
      completed: false,
      progress: 0,
      maxProgress: 1
    },
    {
      id: '8',
      title: 'Carbon Credit Trader',
      description: 'Participate in carbon credit trading',
      points: 400,
      icon: '🌍',
      completed: false,
      progress: 0,
      maxProgress: 1
    }
  ]);

  const [rewards, _setRewards] = useState<Reward[]>([
    {
      id: '1',
      title: 'Eco-Friendly Water Bottle',
      description: 'Stainless steel water bottle with company logo',
      cost: 500,
      category: 'Merchandise',
      available: true
    },
    {
      id: '2',
      title: 'Carbon Offset Certificate',
      description: 'Official certificate for 1 ton CO2 offset',
      cost: 1000,
      category: 'Certificates',
      available: true
    },
    {
      id: '3',
      title: 'Premium Analytics Report',
      description: 'Detailed sustainability report for your business',
      cost: 750,
      category: 'Services',
      available: true
    },
    {
      id: '4',
      title: 'Green Business Badge',
      description: 'Digital badge for your website and marketing',
      cost: 300,
      category: 'Digital',
      available: true
    },
    {
      id: '5',
      title: 'Sustainability Consultation',
      description: '1-hour consultation with sustainability expert',
      cost: 2000,
      category: 'Services',
      available: false
    },
    {
      id: '6',
      title: 'Green Loan Application Support',
      description: 'Assistance with green finance loan applications',
      cost: 800,
      category: 'Green Finance',
      available: true
    },
    {
      id: '7',
      title: 'ESG Reporting Template',
      description: 'Professional ESG reporting template and guidance',
      cost: 1200,
      category: 'Green Finance',
      available: true
    },
    {
      id: '8',
      title: 'Carbon Credit Marketplace Access',
      description: 'Access to verified carbon credit trading platform',
      cost: 1500,
      category: 'Green Finance',
      available: true
    },
    {
      id: '9',
      title: 'Green Bond Issuance Guide',
      description: 'Complete guide for issuing green bonds',
      cost: 2500,
      category: 'Green Finance',
      available: true
    },
    {
      id: '10',
      title: 'Sustainability Finance Workshop',
      description: '2-day workshop on sustainable finance strategies',
      cost: 3000,
      category: 'Green Finance',
      available: false
    }
  ]);

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const levelProgress = ((userStats.totalPoints - userStats.currentLevelPoints) / 
    (userStats.nextLevelPoints - userStats.currentLevelPoints)) * 100;

  const handleRedeemReward = (reward: Reward) => {
    if (reward.cost > userStats.totalPoints) {
      Alert.alert('Insufficient Points', 'Keep earning to unlock this reward!');
      return;
    }
    setSelectedReward(reward);
    setRedeemModalVisible(true);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints - selectedReward.cost
      }));
      Alert.alert('Success!', `Successfully redeemed ${selectedReward.title}!`);
      setRedeemModalVisible(false);
      setSelectedReward(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return '#FFD700';
    if (level >= 3) return '#C0C0C0';
    return '#CD7F32';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Merchandise': return '#4CAF50';
      case 'Certificates': return '#2196F3';
      case 'Services': return '#FF9800';
      case 'Digital': return '#9C27B0';
      case 'Green Finance': return '#2E7D32';
      default: return '#757575';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name="emoji-events" size={32} color="#1976d2" />
          <Text style={styles.headerTitle}>Incentives & Rewards</Text>
        </View>

        {/* User Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.levelContainer}>
              <Avatar.Text
                size={60}
                label={userStats.level.toString()}
                style={{ backgroundColor: getLevelColor(userStats.level) }}
              />
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>Level {userStats.level} - Carbon Champion</Text>
                <Text style={styles.levelSubtitle}>
                  {userStats.totalPoints} total points • {userStats.achievementsUnlocked}/{userStats.totalAchievements} achievements
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress to Level {userStats.level + 1}</Text>
                <Text style={styles.progressValue}>
                  {userStats.totalPoints - userStats.currentLevelPoints} / {userStats.nextLevelPoints - userStats.currentLevelPoints}
                </Text>
              </View>
              <ProgressBar
                progress={levelProgress / 100}
                color="#1976d2"
                style={styles.progressBar}
              />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{userStats.carbonSaved}kg</Text>
                <Text style={styles.statLabel}>CO₂ Saved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#FF9800' }]}>{userStats.achievementsUnlocked}</Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#2196F3' }]}>{userStats.totalPoints}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Streak Card */}
        <Card style={styles.streakCard}>
          <Card.Content>
            <View style={styles.streakHeader}>
              <Icon name="local-fire-department" size={24} color="#FF9800" />
              <Text style={styles.streakTitle}>Current Streak</Text>
            </View>
            <Text style={styles.streakValue}>{userStats.streak}</Text>
            <Text style={styles.streakSubtitle}>
              Keep it up! Complete daily tasks to maintain your streak.
            </Text>
            <Button mode="contained" style={styles.streakButton}>
              View Daily Tasks
            </Button>
          </Card.Content>
        </Card>

        {/* Achievements Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="star" size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  achievement.completed && styles.completedAchievement
                ]}
              >
                <Card.Content>
                  <View style={styles.achievementHeader}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    {achievement.completed && (
                      <Icon name="check-circle" size={20} color="#4CAF50" />
                    )}
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  
                  <View style={styles.achievementProgress}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>
                        {achievement.progress}/{achievement.maxProgress}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={achievement.progress / achievement.maxProgress}
                      color={achievement.completed ? "#4CAF50" : "#1976d2"}
                      style={styles.achievementProgressBar}
                    />
                  </View>
                  
                  <Chip
                    mode="outlined"
                    textStyle={{ color: achievement.completed ? "#4CAF50" : "#757575" }}
                    style={[
                      styles.pointsChip,
                      achievement.completed && { borderColor: "#4CAF50" }
                    ]}
                  >
                    {achievement.points} pts
                  </Chip>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>

        {/* Rewards Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="eco" size={24} color="#1976d2" />
              <Text style={styles.sectionTitle}>Available Rewards</Text>
            </View>
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                style={[
                  styles.rewardCard,
                  !reward.available && styles.unavailableReward
                ]}
              >
                <Card.Content>
                  <View style={styles.rewardHeader}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Chip
                      mode="outlined"
                      textStyle={{ color: getCategoryColor(reward.category) }}
                      style={[styles.categoryChip, { borderColor: getCategoryColor(reward.category) }]}
                    >
                      {reward.category}
                    </Chip>
                  </View>
                  <Text style={styles.rewardDescription}>{reward.description}</Text>
                  <View style={styles.rewardFooter}>
                    <Text style={styles.rewardCost}>{reward.cost} pts</Text>
                    <Button
                      mode="contained"
                      compact
                      disabled={!reward.available || reward.cost > userStats.totalPoints}
                      onPress={() => handleRedeemReward(reward)}
                      style={styles.redeemButton}
                    >
                      Redeem
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Redeem Modal */}
      <Modal
        visible={redeemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Redeem Reward</Text>
              <TouchableOpacity onPress={() => setRedeemModalVisible(false)}>
                <Icon name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            {selectedReward && (
              <View style={styles.modalBody}>
                <Text style={styles.modalRewardTitle}>{selectedReward.title}</Text>
                <Text style={styles.modalRewardDescription}>{selectedReward.description}</Text>
                <Text style={styles.modalCost}>Cost: {selectedReward.cost} points</Text>
                <Text style={styles.modalBalance}>Your balance: {userStats.totalPoints} points</Text>
                <Text style={styles.modalRemaining}>
                  After redemption, you will have {userStats.totalPoints - selectedReward.cost} points remaining.
                </Text>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setRedeemModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={confirmRedeem}
                style={styles.modalButton}
              >
                Confirm Redemption
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1976d2',
  },
  statsCard: {
    margin: 16,
    elevation: 4,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelInfo: {
    marginLeft: 16,
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#757575',
  },
  progressValue: {
    fontSize: 14,
    color: '#757575',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  streakCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
    backgroundColor: '#fff3e0',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
    marginVertical: 8,
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
  },
  streakButton: {
    backgroundColor: '#FF9800',
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  achievementCard: {
    marginBottom: 12,
    elevation: 2,
  },
  completedAchievement: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#f1f8e9',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  achievementProgress: {
    marginBottom: 8,
  },
  achievementProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  pointsChip: {
    alignSelf: 'flex-start',
  },
  rewardCard: {
    marginBottom: 12,
    elevation: 2,
  },
  unavailableReward: {
    opacity: 0.6,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  redeemButton: {
    backgroundColor: '#1976d2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalRewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalRewardDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  modalCost: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalBalance: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalRemaining: {
    fontSize: 12,
    color: '#757575',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default IncentivesScreen;