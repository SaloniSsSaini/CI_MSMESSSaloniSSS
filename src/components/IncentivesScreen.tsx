import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  Nature as EcoIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

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
  image?: string;
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

  const [achievements, setAchievements] = useState<Achievement[]>([
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

  const [rewards, setRewards] = useState<Reward[]>([
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
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const levelProgress = ((userStats.totalPoints - userStats.currentLevelPoints) / 
    (userStats.nextLevelPoints - userStats.currentLevelPoints)) * 100;

  const handleRedeemReward = (reward: Reward) => {
    if (reward.cost > userStats.totalPoints) {
      setSnackbarMessage('Insufficient points! Keep earning to unlock this reward.');
      setSnackbarOpen(true);
      return;
    }
    setSelectedReward(reward);
    setRedeemDialogOpen(true);
  };

  const confirmRedeem = () => {
    if (selectedReward) {
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints - selectedReward.cost
      }));
      setSnackbarMessage(`Successfully redeemed ${selectedReward.title}!`);
      setSnackbarOpen(true);
      setRedeemDialogOpen(false);
      setSelectedReward(null);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 5) return '#FFD700';
    if (level >= 3) return '#C0C0C0';
    return '#CD7F32';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrophyIcon color="primary" />
        Incentives & Rewards
      </Typography>

      {/* User Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: getLevelColor(userStats.level), mr: 2, width: 56, height: 56 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {userStats.level}
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Level {userStats.level} - Carbon Champion
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userStats.totalPoints} total points • {userStats.achievementsUnlocked}/{userStats.totalAchievements} achievements
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Progress to Level {userStats.level + 1}</Typography>
                  <Typography variant="body2">
                    {userStats.totalPoints - userStats.currentLevelPoints} / {userStats.nextLevelPoints - userStats.currentLevelPoints}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={levelProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">{userStats.streak}</Typography>
                    <Typography variant="body2" color="text.secondary">Day Streak</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">{userStats.carbonSaved}kg</Typography>
                    <Typography variant="body2" color="text.secondary">CO₂ Saved</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">{userStats.achievementsUnlocked}</Typography>
                    <Typography variant="body2" color="text.secondary">Achievements</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main">{userStats.totalPoints}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Points</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FireIcon color="warning" />
                Current Streak
              </Typography>
              <Typography variant="h3" color="warning.main" sx={{ mb: 1 }}>
                {userStats.streak}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Keep it up! Complete daily tasks to maintain your streak.
              </Typography>
              <Button variant="contained" color="warning" fullWidth>
                View Daily Tasks
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Achievements Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarIcon color="primary" />
            Achievements
          </Typography>
          <Grid container spacing={2}>
            {achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    border: achievement.completed ? '2px solid #4caf50' : '1px solid #e0e0e0',
                    bgcolor: achievement.completed ? '#f1f8e9' : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h4" sx={{ mr: 1 }}>
                        {achievement.icon}
                      </Typography>
                      {achievement.completed && (
                        <CheckCircleIcon color="success" />
                      )}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {achievement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {achievement.description}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress</Typography>
                        <Typography variant="body2">
                          {achievement.progress}/{achievement.maxProgress}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(achievement.progress / achievement.maxProgress) * 100}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                    <Chip 
                      label={`${achievement.points} pts`} 
                      color={achievement.completed ? 'success' : 'default'}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Rewards Section */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EcoIcon color="primary" />
            Available Rewards
          </Typography>
          <Grid container spacing={2}>
            {rewards.map((reward) => (
              <Grid item xs={12} sm={6} md={4} key={reward.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    height: '100%',
                    opacity: reward.available ? 1 : 0.6
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">
                        {reward.title}
                      </Typography>
                      <Chip 
                        label={reward.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {reward.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {reward.cost} pts
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!reward.available || reward.cost > userStats.totalPoints}
                        onClick={() => handleRedeemReward(reward)}
                      >
                        Redeem
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={redeemDialogOpen} onClose={() => setRedeemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Redeem Reward
            <IconButton onClick={() => setRedeemDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReward && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedReward.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedReward.description}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Cost: <strong>{selectedReward.cost} points</strong>
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your balance: <strong>{userStats.totalPoints} points</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                After redemption, you will have {userStats.totalPoints - selectedReward.cost} points remaining.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedeemDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRedeem} variant="contained" color="primary">
            Confirm Redemption
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IncentivesScreen;