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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  Rating
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Park as EcoIcon,
  EnergySavingsLeaf as EnergySavingsLeafIcon,
  Water as WaterIcon,
  Recycling as RecyclingIcon,
  LocalShipping as LocalShippingIcon,
  Factory as FactoryIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface Recommendation {
  id: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  impact: number; // 1-5 scale
  cost: 'low' | 'medium' | 'high';
  timeline: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  description: string;
  benefits: string[];
  implementation: string[];
  estimatedSavings: number;
  co2Reduction: number;
  paybackPeriod: number; // in months
}

const Recommendations: React.FC = () => {
  const [msmeData, setMsmeData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load MSME registration data
    const savedData = localStorage.getItem('msmeRegistration');
    if (savedData) {
      setMsmeData(JSON.parse(savedData));
    }

    // Generate recommendations based on MSME data
    setTimeout(() => {
      setRecommendations(generateRecommendations());
      setIsLoading(false);
    }, 1500);
  }, []);

  const generateRecommendations = (): Recommendation[] => {
    return [
      {
        id: 'renewable-energy',
        title: 'Switch to Renewable Energy Sources',
        category: 'Energy',
        priority: 'high',
        impact: 5,
        cost: 'high',
        timeline: 'medium-term',
        description: 'Install solar panels or wind turbines to power your manufacturing operations with clean energy.',
        benefits: [
          'Reduce electricity costs by 60-80%',
          'Eliminate carbon emissions from electricity consumption',
          'Qualify for government incentives and subsidies',
          'Improve brand reputation and marketability'
        ],
        implementation: [
          'Conduct energy audit to assess current consumption',
          'Get quotes from 3-5 solar installation companies',
          'Apply for government subsidies and incentives',
          'Install solar panels with battery storage',
          'Monitor energy production and savings'
        ],
        estimatedSavings: 50000,
        co2Reduction: 1200,
        paybackPeriod: 36
      },
      {
        id: 'energy-efficient-equipment',
        title: 'Upgrade to Energy-Efficient Equipment',
        category: 'Energy',
        priority: 'high',
        impact: 4,
        cost: 'medium',
        timeline: 'short-term',
        description: 'Replace old machinery with energy-efficient alternatives to reduce power consumption.',
        benefits: [
          'Reduce energy consumption by 20-40%',
          'Lower maintenance costs',
          'Improve production efficiency',
          'Reduce carbon footprint significantly'
        ],
        implementation: [
          'Audit current equipment for energy efficiency',
          'Identify equipment with highest energy consumption',
          'Research energy-efficient alternatives',
          'Plan phased replacement schedule',
          'Train staff on new equipment operation'
        ],
        estimatedSavings: 25000,
        co2Reduction: 600,
        paybackPeriod: 24
      },
      {
        id: 'waste-recycling',
        title: 'Implement Comprehensive Waste Recycling Program',
        category: 'Waste',
        priority: 'medium',
        impact: 3,
        cost: 'low',
        timeline: 'immediate',
        description: 'Set up systematic waste segregation and recycling processes to minimize landfill waste.',
        benefits: [
          'Reduce waste disposal costs',
          'Generate revenue from recyclable materials',
          'Improve environmental compliance',
          'Reduce carbon footprint from waste decomposition'
        ],
        implementation: [
          'Conduct waste audit to identify recyclable materials',
          'Set up waste segregation bins and systems',
          'Partner with local recycling companies',
          'Train employees on waste segregation',
          'Monitor and track recycling rates'
        ],
        estimatedSavings: 15000,
        co2Reduction: 200,
        paybackPeriod: 6
      },
      {
        id: 'water-conservation',
        title: 'Implement Water Conservation Measures',
        category: 'Water',
        priority: 'medium',
        impact: 3,
        cost: 'low',
        timeline: 'short-term',
        description: 'Install water-saving devices and implement water recycling systems.',
        benefits: [
          'Reduce water consumption by 30-50%',
          'Lower water bills significantly',
          'Improve water security',
          'Reduce energy for water treatment'
        ],
        implementation: [
          'Install low-flow faucets and fixtures',
          'Implement rainwater harvesting',
          'Set up water recycling systems',
          'Monitor water usage with smart meters',
          'Train employees on water conservation'
        ],
        estimatedSavings: 20000,
        co2Reduction: 150,
        paybackPeriod: 12
      },
      {
        id: 'green-transportation',
        title: 'Adopt Green Transportation Practices',
        category: 'Transportation',
        priority: 'medium',
        impact: 3,
        cost: 'medium',
        timeline: 'medium-term',
        description: 'Switch to electric or hybrid vehicles and optimize delivery routes.',
        benefits: [
          'Reduce fuel costs by 40-60%',
          'Eliminate vehicle emissions',
          'Improve delivery efficiency',
          'Qualify for green vehicle incentives'
        ],
        implementation: [
          'Audit current vehicle fleet and usage',
          'Research electric vehicle options',
          'Plan vehicle replacement schedule',
          'Install charging infrastructure',
          'Train drivers on eco-friendly driving'
        ],
        estimatedSavings: 30000,
        co2Reduction: 400,
        paybackPeriod: 30
      },
      {
        id: 'process-optimization',
        title: 'Optimize Manufacturing Processes',
        category: 'Manufacturing',
        priority: 'high',
        impact: 4,
        cost: 'low',
        timeline: 'immediate',
        description: 'Implement lean manufacturing principles and process improvements.',
        benefits: [
          'Increase production efficiency by 15-25%',
          'Reduce material waste',
          'Lower energy consumption',
          'Improve product quality'
        ],
        implementation: [
          'Map current manufacturing processes',
          'Identify bottlenecks and inefficiencies',
          'Implement lean manufacturing tools',
          'Train staff on process optimization',
          'Monitor and measure improvements'
        ],
        estimatedSavings: 40000,
        co2Reduction: 300,
        paybackPeriod: 3
      },
      {
        id: 'supply-chain-optimization',
        title: 'Optimize Supply Chain for Sustainability',
        category: 'Supply Chain',
        priority: 'medium',
        impact: 3,
        cost: 'low',
        timeline: 'short-term',
        description: 'Source materials locally and work with sustainable suppliers.',
        benefits: [
          'Reduce transportation emissions',
          'Support local economy',
          'Improve supply chain resilience',
          'Reduce costs through shorter supply chains'
        ],
        implementation: [
          'Audit current suppliers and their locations',
          'Identify local sustainable suppliers',
          'Negotiate contracts with new suppliers',
          'Implement supplier sustainability criteria',
          'Monitor supplier performance'
        ],
        estimatedSavings: 20000,
        co2Reduction: 250,
        paybackPeriod: 8
      },
      {
        id: 'employee-engagement',
        title: 'Engage Employees in Sustainability',
        category: 'Culture',
        priority: 'low',
        impact: 2,
        cost: 'low',
        timeline: 'immediate',
        description: 'Create awareness and engagement programs for employees.',
        benefits: [
          'Improve employee morale and retention',
          'Generate innovative sustainability ideas',
          'Reduce operational costs',
          'Build sustainability culture'
        ],
        implementation: [
          'Conduct sustainability awareness training',
          'Form employee sustainability committee',
          'Implement suggestion system for improvements',
          'Recognize and reward sustainable practices',
          'Regular communication and updates'
        ],
        estimatedSavings: 10000,
        co2Reduction: 100,
        paybackPeriod: 2
      }
    ];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Energy': return <EnergySavingsLeafIcon />;
      case 'Waste': return <RecyclingIcon />;
      case 'Water': return <WaterIcon />;
      case 'Transportation': return <LocalShippingIcon />;
      case 'Manufacturing': return <FactoryIcon />;
      case 'Supply Chain': return <TrendingUpIcon />;
      case 'Culture': return <EcoIcon />;
      default: return <EcoIcon />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getTimelineIcon = (timeline: string) => {
    switch (timeline) {
      case 'immediate': return <CheckCircleIcon />;
      case 'short-term': return <TimelineIcon />;
      case 'medium-term': return <ScheduleIcon />;
      case 'long-term': return <AttachMoneyIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(recommendations.map(rec => rec.category)))];

  if (!msmeData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please complete MSME registration first to access personalized recommendations.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ mt: 4 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="h6" align="center">
          Generating personalized recommendations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Sustainable Manufacturing Recommendations
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Personalized recommendations to help {msmeData.companyName} reduce carbon footprint and improve sustainability.
      </Typography>

      {/* Category Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter by Category
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category === 'all' ? 'All Categories' : category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      {/* Recommendations List */}
      <Grid container spacing={3}>
        {filteredRecommendations.map((recommendation) => (
          <Grid item xs={12} key={recommendation.id}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getCategoryIcon(recommendation.category)}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {recommendation.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={recommendation.priority.toUpperCase()} 
                        color={getPriorityColor(recommendation.priority) as any}
                        size="small"
                      />
                      <Chip 
                        label={`${recommendation.cost.toUpperCase()} COST`} 
                        color={getCostColor(recommendation.cost) as any}
                        size="small"
                      />
                      <Chip 
                        label={recommendation.timeline.toUpperCase()} 
                        color="info"
                        size="small"
                        icon={getTimelineIcon(recommendation.timeline)}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary">
                      ₹{recommendation.estimatedSavings.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Annual Savings
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="body1" paragraph>
                      {recommendation.description}
                    </Typography>

                    <Typography variant="h6" gutterBottom>
                      Benefits
                    </Typography>
                    <List dense>
                      {recommendation.benefits.map((benefit, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={benefit} />
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Implementation Steps
                    </Typography>
                    <List dense>
                      {recommendation.implementation.map((step, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={`${index + 1}. ${step}`}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Impact Metrics
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Environmental Impact
                          </Typography>
                          <Rating value={recommendation.impact} readOnly size="small" />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {recommendation.co2Reduction} kg CO₂ reduction/year
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Financial Impact
                          </Typography>
                          <Typography variant="h6" color="success">
                            ₹{recommendation.estimatedSavings.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Annual savings
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Payback Period
                          </Typography>
                          <Typography variant="h6">
                            {recommendation.paybackPeriod} months
                          </Typography>
                        </Box>

                        <CardActions>
                          <Button 
                            variant="contained" 
                            fullWidth
                            startIcon={<EcoIcon />}
                          >
                            Implement This
                          </Button>
                        </CardActions>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Implementation Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {filteredRecommendations.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recommendations
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="success">
                  ₹{filteredRecommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Annual Savings
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="info">
                  {filteredRecommendations.reduce((sum, rec) => sum + rec.co2Reduction, 0)} kg
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CO₂ Reduction Potential
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Recommendations;