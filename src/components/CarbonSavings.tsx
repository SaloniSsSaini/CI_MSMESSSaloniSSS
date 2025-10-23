import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Nature as EcoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Park as TreeIcon,
  DirectionsCar as CarIcon,
  Bolt as EnergyIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface CarbonSavingsData {
  totalSavings: number;
  periodSavings: number;
  savingsPercentage: number;
  implementedRecommendations: number;
  potentialSavings: number;
  achievements: Array<{
    type: string;
    title: string;
    description: string;
    level: string;
    co2Saved?: number;
  }>;
  nextMilestones: Array<{
    type: string;
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    priority: string;
  }>;
  benchmarkComparison: {
    performance: string;
    industryAverage: number;
    bestInClass: number;
  };
  trends: {
    monthly: Array<{
      month: string;
      totalCO2Emissions: number;
      carbonScore: number;
      savings: number;
    }>;
    quarterly: Array<{
      quarter: string;
      totalCO2Emissions: number;
      carbonScore: number;
    }>;
  };
}

interface AdditionalMetrics {
  totalCO2Saved: number;
  averageMonthlySavings: number;
  projectedAnnualSavings: number;
  costSavings: number;
  environmentalImpact: {
    treesEquivalent: number;
    carsOffRoad: number;
    energySaved: number;
  };
}

const CarbonSavings: React.FC = () => {
  const [savingsData, setSavingsData] = useState<CarbonSavingsData | null>(null);
  const [additionalMetrics, setAdditionalMetrics] = useState<AdditionalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadCarbonSavings();
  }, []);

  const loadCarbonSavings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const mockSavings: CarbonSavingsData = {
          totalSavings: 1250.5,
          periodSavings: 180.3,
          savingsPercentage: 22.5,
          implementedRecommendations: 6,
          potentialSavings: 320.8,
          achievements: [
            {
              type: 'carbon_reduction',
              title: 'Carbon Reduction Champion',
              description: 'Achieved 25% reduction in carbon emissions',
              level: 'gold',
              co2Saved: 150
            },
            {
              type: 'implementation',
              title: 'Sustainability Leader',
              description: 'Implemented 5 sustainability recommendations',
              level: 'gold'
            },
            {
              type: 'score',
              title: 'Green Achiever',
              description: 'Achieved carbon score of 85',
              level: 'silver'
            }
          ],
          nextMilestones: [
            {
              type: 'carbon_reduction',
              title: '30% Carbon Reduction',
              description: 'Aim for 30% reduction in next assessment',
              targetValue: 30,
              currentValue: 22.5,
              priority: 'high'
            },
            {
              type: 'recommendations',
              title: 'Implement 8 Recommendations',
              description: 'Implement 8 sustainability recommendations',
              targetValue: 8,
              currentValue: 6,
              priority: 'medium'
            },
            {
              type: 'score',
              title: 'Carbon Score 90',
              description: 'Achieve carbon score of 90',
              targetValue: 90,
              currentValue: 85,
              priority: 'medium'
            }
          ],
          benchmarkComparison: {
            performance: 'good',
            industryAverage: 2.5,
            bestInClass: 1.2
          },
          trends: {
            monthly: [
              { month: '2024-01', totalCO2Emissions: 800, carbonScore: 75, savings: 50 },
              { month: '2024-02', totalCO2Emissions: 750, carbonScore: 78, savings: 100 },
              { month: '2024-03', totalCO2Emissions: 700, carbonScore: 80, savings: 150 },
              { month: '2024-04', totalCO2Emissions: 650, carbonScore: 82, savings: 200 },
              { month: '2024-05', totalCO2Emissions: 600, carbonScore: 85, savings: 250 }
            ],
            quarterly: [
              { quarter: '2024-Q1', totalCO2Emissions: 2250, carbonScore: 77 },
              { quarter: '2024-Q2', totalCO2Emissions: 1950, carbonScore: 83 }
            ]
          }
        };

        const mockMetrics: AdditionalMetrics = {
          totalCO2Saved: mockSavings.totalSavings,
          averageMonthlySavings: mockSavings.totalSavings / 12,
          projectedAnnualSavings: mockSavings.totalSavings * 1.2,
          costSavings: mockSavings.totalSavings * 0.05,
          environmentalImpact: {
            treesEquivalent: Math.round(mockSavings.totalSavings / 22),
            carsOffRoad: Math.round(mockSavings.totalSavings / 4600),
            energySaved: Math.round(mockSavings.totalSavings / 0.8)
          }
        };

        setSavingsData(mockSavings);
        setAdditionalMetrics(mockMetrics);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading carbon savings:', error);
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'average': return 'warning';
      case 'below_average': return 'error';
      default: return 'default';
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'average': return 'Average';
      case 'below_average': return 'Below Average';
      case 'poor': return 'Needs Improvement';
      default: return 'Unknown';
    }
  };

  const getAchievementIcon = (level: string) => {
    switch (level) {
      case 'gold': return <StarIcon sx={{ color: '#FFD700' }} />;
      case 'silver': return <StarIcon sx={{ color: '#C0C0C0' }} />;
      case 'bronze': return <StarIcon sx={{ color: '#CD7F32' }} />;
      default: return <CheckIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!savingsData) {
    return (
      <Alert severity="error">
        Failed to load carbon savings data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Carbon Savings Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadCarbonSavings}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Trends" />
        <Tab label="Achievements" />
        <Tab label="Milestones" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {savingsData.totalSavings.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">
                        Total CO₂ Saved (kg)
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {savingsData.periodSavings.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">
                        This Period (kg)
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {savingsData.savingsPercentage.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        Reduction Achieved
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {savingsData.implementedRecommendations}
                      </Typography>
                      <Typography variant="body2">
                        Recommendations Implemented
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Environmental Impact */}
          {additionalMetrics && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Environmental Impact
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <TreeIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${additionalMetrics.environmentalImpact.treesEquivalent} Trees Equivalent`}
                        secondary="CO₂ absorbed by trees"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CarIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${additionalMetrics.environmentalImpact.carsOffRoad} Cars Off Road`}
                        secondary="Equivalent to taking cars off the road"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EnergyIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${additionalMetrics.environmentalImpact.energySaved} kWh Energy Saved`}
                        secondary="Equivalent energy savings"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Performance Comparison */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Comparison
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Your Performance
                  </Typography>
                  <Chip
                    label={getPerformanceLabel(savingsData.benchmarkComparison.performance)}
                    color={getPerformanceColor(savingsData.benchmarkComparison.performance) as any}
                    size="medium"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Industry Average
                  </Typography>
                  <Typography variant="h6">
                    {savingsData.benchmarkComparison.industryAverage} kg CO₂/₹1000
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Best in Class
                  </Typography>
                  <Typography variant="h6">
                    {savingsData.benchmarkComparison.bestInClass} kg CO₂/₹1000
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Trends Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">CO₂ Emissions (kg)</TableCell>
                        <TableCell align="right">Carbon Score</TableCell>
                        <TableCell align="right">Savings (kg)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {savingsData.trends.monthly.map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell>{trend.month}</TableCell>
                          <TableCell align="right">{trend.totalCO2Emissions}</TableCell>
                          <TableCell align="right">{trend.carbonScore}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                              {trend.savings}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Achievements Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Achievements
                </Typography>
                {savingsData.achievements.length > 0 ? (
                  <List>
                    {savingsData.achievements.map((achievement, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          {getAchievementIcon(achievement.level)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {achievement.title}
                              <Chip
                                label={achievement.level.toUpperCase()}
                                size="small"
                                color={achievement.level === 'gold' ? 'warning' : 'default'}
                              />
                            </Box>
                          }
                          secondary={achievement.description}
                        />
                        {achievement.co2Saved && (
                          <Typography variant="body2" color="success.main">
                            +{achievement.co2Saved} kg CO₂ saved
                          </Typography>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No achievements yet. Keep working on your sustainability goals!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Milestones Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Next Milestones
                </Typography>
                {savingsData.nextMilestones.length > 0 ? (
                  <List>
                    {savingsData.nextMilestones.map((milestone, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {milestone.title}
                              <Chip
                                label={milestone.priority.toUpperCase()}
                                size="small"
                                color={getPriorityColor(milestone.priority) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {milestone.description}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={(milestone.currentValue / milestone.targetValue) * 100}
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Progress: {milestone.currentValue} / {milestone.targetValue} ({((milestone.currentValue / milestone.targetValue) * 100).toFixed(1)}%)
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    All milestones achieved! Great job!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CarbonSavings;