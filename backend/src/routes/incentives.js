const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Mock data - in production, this would come from database
const userStats = {
  totalPoints: 1250,
  level: 3,
  nextLevelPoints: 2000,
  currentLevelPoints: 1000,
  achievementsUnlocked: 8,
  totalAchievements: 15,
  streak: 7,
  carbonSaved: 45.2
};

const achievements = [
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
  }
];

const rewards = [
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
  }
];

// Get user stats and achievements
router.get('/stats', auth, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        userStats,
        achievements,
        rewards
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: error.message
    });
  }
});

// Redeem a reward
router.post('/redeem', auth, (req, res) => {
  try {
    const { rewardId } = req.body;
    
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (!reward.available) {
      return res.status(400).json({
        success: false,
        message: 'Reward is not available'
      });
    }

    if (reward.cost > userStats.totalPoints) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Update user stats
    userStats.totalPoints -= reward.cost;
    
    // Check for level up
    if (userStats.totalPoints >= userStats.nextLevelPoints) {
      userStats.level += 1;
      userStats.currentLevelPoints = userStats.nextLevelPoints;
      userStats.nextLevelPoints = userStats.currentLevelPoints + 1000;
    }

    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: {
        userStats,
        redeemedReward: reward
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error redeeming reward',
      error: error.message
    });
  }
});

// Update achievement progress
router.post('/achievements/:achievementId/progress', auth, (req, res) => {
  try {
    const { achievementId } = req.params;
    const { progress } = req.body;

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }

    achievement.progress = Math.min(progress, achievement.maxProgress);
    
    if (achievement.progress >= achievement.maxProgress && !achievement.completed) {
      achievement.completed = true;
      userStats.totalPoints += achievement.points;
      userStats.achievementsUnlocked += 1;
    }

    res.json({
      success: true,
      message: 'Achievement progress updated',
      data: {
        achievement,
        userStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating achievement progress',
      error: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, (req, res) => {
  try {
    // Mock leaderboard data
    const leaderboard = [
      { rank: 1, companyName: 'GreenTech Solutions', points: 2500, level: 5 },
      { rank: 2, companyName: 'EcoManufacturing Ltd', points: 2200, level: 4 },
      { rank: 3, companyName: 'Sustainable Industries', points: 1800, level: 4 },
      { rank: 4, companyName: 'Carbon Neutral Corp', points: 1650, level: 3 },
      { rank: 5, companyName: 'EcoFriendly Co', points: 1400, level: 3 }
    ];

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

// Get daily tasks
router.get('/daily-tasks', auth, (req, res) => {
  try {
    const dailyTasks = [
      {
        id: '1',
        title: 'Upload transaction data',
        description: 'Upload your daily transaction files for carbon analysis',
        points: 25,
        completed: false,
        category: 'Data'
      },
      {
        id: '2',
        title: 'Review recommendations',
        description: 'Check and implement at least one sustainability recommendation',
        points: 50,
        completed: false,
        category: 'Action'
      },
      {
        id: '3',
        title: 'Energy audit',
        description: 'Complete a quick energy consumption check',
        points: 30,
        completed: true,
        category: 'Assessment'
      },
      {
        id: '4',
        title: 'Share progress',
        description: 'Share your sustainability progress on social media',
        points: 20,
        completed: false,
        category: 'Social'
      }
    ];

    res.json({
      success: true,
      data: dailyTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching daily tasks',
      error: error.message
    });
  }
});

// Complete daily task
router.post('/daily-tasks/:taskId/complete', auth, (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Mock task completion
    const taskPoints = 25; // This would be fetched from the task
    userStats.totalPoints += taskPoints;
    userStats.streak += 1;

    res.json({
      success: true,
      message: 'Task completed successfully',
      data: {
        pointsEarned: taskPoints,
        userStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing task',
      error: error.message
    });
  }
});

module.exports = router;