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
  Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Factory as FactoryIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
  Assessment as ReportIcon
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [msmeData, setMsmeData] = useState<MSMEData | null>(null);
  const [carbonScore, setCarbonScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

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
      }, 1500);
    } else {
      setIsLoading(false);
    }
  }, []);

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