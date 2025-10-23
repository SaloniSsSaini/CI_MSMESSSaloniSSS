import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Factory as FactoryIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  Eco as EcoIcon,
  LocalFireDepartment as FireIcon,
  Park as TreeIcon,
  DirectionsCar as CarIcon,
  Bolt as EnergyIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface MSMEData {
  companyName: string;
  companyType: string;
  industry: string;
  udyogAadharNumber: string;
  gstNumber: string;
  annualTurnover: number;
  numberOfEmployees: number;
  manufacturingUnits: number;
}

interface CarbonSavings {
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [msmeData, setMsmeData] = useState<MSMEData | null>(null);
  const [carbonScore, setCarbonScore] = useState<number>(0);
  const [carbonSavings, setCarbonSavings] = useState<CarbonSavings | null>(null);
  const [additionalMetrics, setAdditionalMetrics] = useState<AdditionalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);

  useEffect(() => {
    // Load MSME registration data
    const savedData = localStorage.getItem('msmeRegistration');
    if (savedData) {
      const data = JSON.parse(savedData);
      setMsmeData(data);
      
      // Simulate carbon score calculation
      setTimeout(() => {
        setCarbonScore(Math.floor(Math.random() * 40) + 60); // Random score between 60-100
        setIsLoading(false);
        loadCarbonSavings();
      }, 1500);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadCarbonSavings = async () => {
    setIsLoadingSavings(true);
    try {
      // In a real application, this would be an API call
      // For now, we'll simulate the data
      setTimeout(() => {
        const mockSavings: CarbonSavings = {
          totalSavings: Math.floor(Math.random() * 500) + 100,
          periodSavings: Math.floor(Math.random() * 200) + 50,
          savingsPercentage: Math.floor(Math.random() * 30) + 10,
          implementedRecommendations: Math.floor(Math.random() * 8) + 2,
          potentialSavings: Math.floor(Math.random() * 300) + 100,
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
            }
          ],
          nextMilestones: [
            {
              type: 'carbon_reduction',
              title: '30% Carbon Reduction',
              description: 'Aim for 30% reduction in next assessment',
              targetValue: 30,
              currentValue: 25,
              priority: 'high'
            },
            {
              type: 'recommendations',
              title: 'Implement 8 Recommendations',
              description: 'Implement 8 sustainability recommendations',
              targetValue: 8,
              currentValue: 5,
              priority: 'medium'
            }
          ],
          benchmarkComparison: {
            performance: 'good'
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

        setCarbonSavings(mockSavings);
        setAdditionalMetrics(mockMetrics);
        setIsLoadingSavings(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading carbon savings:', error);
      setIsLoadingSavings(false);
    }
  };

  const getCompanyTypeColor = (type: string) => {
    switch (type) {
      case 'micro': return 'success';
      case 'small': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getCarbonScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getCarbonScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
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

  if (!msmeData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No MSME registration found. Please complete the registration first.
        <Button 
          variant="contained" 
          sx={{ ml: 2 }}
          onClick={() => navigate('/')}
        >
          Register Now
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome back, {msmeData.companyName}! Here's your carbon footprint overview.
      </Typography>

      <Grid container spacing={3}>
        {/* Company Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Company Name
                </Typography>
                <Typography variant="body1">
                  {msmeData.companyName}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Company Type
                </Typography>
                <Chip 
                  label={msmeData.companyType.toUpperCase()} 
                  color={getCompanyTypeColor(msmeData.companyType) as any}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Industry
                </Typography>
                <Typography variant="body1">
                  {msmeData.industry}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Udyog Aadhar Number
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {msmeData.udyogAadharNumber}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  GST Number
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {msmeData.gstNumber}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Carbon Footprint Score */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Carbon Footprint Score
              </Typography>
              {isLoading ? (
                <Box>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Calculating your carbon footprint...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h2" component="span" sx={{ mr: 2 }}>
                      {carbonScore}
                    </Typography>
                    <Box>
                      <Chip 
                        label={getCarbonScoreLabel(carbonScore)}
                        color={getCarbonScoreColor(carbonScore) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={carbonScore} 
                    sx={{ mb: 2 }}
                    color={getCarbonScoreColor(carbonScore) as any}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Based on your manufacturing processes and environmental compliance
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Carbon Savings Overview */}
        {carbonSavings && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EcoIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Carbon Savings Overview
                  </Typography>
                  {isLoadingSavings && (
                    <CircularProgress size={20} sx={{ ml: 2 }} />
                  )}
                </Box>
                
                <Grid container spacing={3}>
                  {/* Total Savings */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {carbonSavings.totalSavings.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">
                        Total CO₂ Saved (kg)
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Period Savings */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {carbonSavings.periodSavings.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">
                        This Period (kg)
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Savings Percentage */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {carbonSavings.savingsPercentage.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2">
                        Reduction Achieved
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Performance Level */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                      <Typography variant="h4" component="div">
                        {getPerformanceLabel(carbonSavings.benchmarkComparison.performance)}
                      </Typography>
                      <Typography variant="body2">
                        Performance Level
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Environmental Impact */}
                {additionalMetrics && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Environmental Impact
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <TreeIcon color="success" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="h6">
                              {additionalMetrics.environmentalImpact.treesEquivalent}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Trees Equivalent
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <CarIcon color="info" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="h6">
                              {additionalMetrics.environmentalImpact.carsOffRoad}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Cars Off Road
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <EnergyIcon color="warning" sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="h6">
                              {additionalMetrics.environmentalImpact.energySaved}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              kWh Energy Saved
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Achievements and Milestones */}
        {carbonSavings && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Achievements
                </Typography>
                {carbonSavings.achievements.length > 0 ? (
                  <List dense>
                    {carbonSavings.achievements.map((achievement, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getAchievementIcon(achievement.level)}
                        </ListItemIcon>
                        <ListItemText
                          primary={achievement.title}
                          secondary={achievement.description}
                        />
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
        )}

        {carbonSavings && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Next Milestones
                </Typography>
                {carbonSavings.nextMilestones.length > 0 ? (
                  <List dense>
                    {carbonSavings.nextMilestones.map((milestone, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={milestone.title}
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {milestone.description}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={(milestone.currentValue / milestone.targetValue) * 100}
                                sx={{ mt: 1 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {milestone.currentValue} / {milestone.targetValue}
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
        )}

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Carbon Assessment
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Measure your current carbon footprint across all manufacturing processes
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                variant="contained"
                onClick={() => navigate('/carbon-footprint')}
              >
                Start Assessment
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EcoIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Carbon Savings
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Track your carbon savings achievements and environmental impact
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                variant="contained"
                color="success"
                onClick={() => navigate('/carbon-savings')}
              >
                View Savings
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LightbulbIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Recommendations
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Get personalized sustainable manufacturing recommendations
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                variant="contained"
                onClick={() => navigate('/recommendations')}
              >
                View Recommendations
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FactoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Manufacturing Units
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage and monitor your {msmeData.manufacturingUnits} manufacturing units
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="outlined">
                Manage Units
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrophyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Incentives & Rewards
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Earn points and unlock rewards for sustainable practices
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                variant="contained"
                onClick={() => navigate('/incentives')}
              >
                View Incentives
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReportIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Sustainability Reports
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                Generate comprehensive sustainability reports and analytics
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                variant="contained"
                onClick={() => navigate('/reporting')}
              >
                View Reports
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Business Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      ₹{msmeData.annualTurnover.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Annual Turnover
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {msmeData.numberOfEmployees}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Employees
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {msmeData.manufacturingUnits}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manufacturing Units
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;