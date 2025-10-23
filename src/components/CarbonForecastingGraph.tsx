import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Nature as EcoIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';

interface ForecastData {
  period: number;
  date: string;
  year: number;
  month: number;
  totalCO2: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  breakdown: any;
  carbonScore: number;
  esgScopes: any;
}

interface HistoricalData {
  period: number;
  date: string;
  year: number;
  month: number;
  totalCO2: number;
  breakdown: any;
  carbonScore: number;
  esgScopes: any;
}

interface ForecastResponse {
  historical: HistoricalData[];
  current: HistoricalData[];
  forecast: {
    data: ForecastData[];
    parameters: any;
    model: string;
  };
  accuracy: {
    mape: number;
    rmse: number;
    mae: number;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    impact: number;
  }>;
  model: {
    type: string;
    parameters: any;
  };
}

const CarbonForecastingGraph: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastPeriods, setForecastPeriods] = useState(12);
  const [modelType, setModelType] = useState('auto');
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  useEffect(() => {
    loadForecastData();
  }, [forecastPeriods, modelType, confidenceLevel]);

  const loadForecastData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/carbon-forecasting/forecast?forecastPeriods=${forecastPeriods}&modelType=${modelType}&confidenceLevel=${confidenceLevel}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load forecast data');
      }

      const result = await response.json();
      
      if (result.success) {
        setForecastData(result.data);
      } else {
        throw new Error(result.message || 'Failed to generate forecast');
      }
    } catch (err) {
      console.error('Error loading forecast data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!forecastData) return [];

    const historical = forecastData.historical.map(item => ({
      ...item,
      type: 'Historical',
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }));

    const forecast = forecastData.forecast.data.map(item => ({
      ...item,
      type: 'Forecast',
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      lowerBound: item.confidenceInterval.lower,
      upperBound: item.confidenceInterval.upper
    }));

    return [...historical, ...forecast];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon color="error" />;
      case 'decreasing':
        return <TrendingDownIcon color="success" />;
      default:
        return <TrendingFlatIcon color="info" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'error';
      case 'decreasing':
        return 'success';
      default:
        return 'info';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const chartData = formatChartData();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Generating carbon footprint forecast...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <IconButton onClick={loadForecastData} sx={{ ml: 1 }}>
          <RefreshIcon />
        </IconButton>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Carbon Footprint Forecasting
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Predictive analysis of your carbon footprint with past, current, and future projections
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Forecast Period</InputLabel>
                <Select
                  value={forecastPeriods}
                  onChange={(e) => setForecastPeriods(Number(e.target.value))}
                  label="Forecast Period"
                >
                  <MenuItem value={6}>6 Months</MenuItem>
                  <MenuItem value={12}>12 Months</MenuItem>
                  <MenuItem value={18}>18 Months</MenuItem>
                  <MenuItem value={24}>24 Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  label="Model Type"
                >
                  <MenuItem value="auto">Auto Select</MenuItem>
                  <MenuItem value="linear">Linear Regression</MenuItem>
                  <MenuItem value="exponential">Exponential Smoothing</MenuItem>
                  <MenuItem value="movingAverage">Moving Average</MenuItem>
                  <MenuItem value="arima">ARIMA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Confidence Level</InputLabel>
                <Select
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                  label="Confidence Level"
                >
                  <MenuItem value={0.90}>90%</MenuItem>
                  <MenuItem value={0.95}>95%</MenuItem>
                  <MenuItem value={0.99}>99%</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {forecastData && (
        <Grid container spacing={3}>
          {/* Main Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimelineIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Carbon Footprint Forecast
                  </Typography>
                  <Chip
                    label={forecastData.model.type.toUpperCase()}
                    size="small"
                    sx={{ ml: 2 }}
                    color="primary"
                  />
                </Box>
                
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      label={{ value: 'CO₂ Emissions (kg)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [
                        `${value} kg CO₂`,
                        name === 'totalCO2' ? 'Total CO₂' : name
                      ]}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Legend />
                    
                    {/* Historical data */}
                    <Area
                      type="monotone"
                      dataKey="totalCO2"
                      stroke="#1976d2"
                      fill="#1976d2"
                      fillOpacity={0.3}
                      name="Historical"
                      connectNulls={false}
                    />
                    
                    {/* Forecast data */}
                    <Area
                      type="monotone"
                      dataKey="totalCO2"
                      stroke="#ff9800"
                      fill="#ff9800"
                      fillOpacity={0.2}
                      name="Forecast"
                      strokeDasharray="5 5"
                    />
                    
                    {/* Confidence interval */}
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      stroke="none"
                      fill="#ff9800"
                      fillOpacity={0.1}
                      name="Confidence Interval"
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      stroke="none"
                      fill="#ff9800"
                      fillOpacity={0.1}
                    />
                    
                    {/* Current year reference line */}
                    <ReferenceLine 
                      x={new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      stroke="#f44336"
                      strokeDasharray="3 3"
                      label="Current"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Forecast Summary */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Forecast Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Model Accuracy
                  </Typography>
                  <Typography variant="h6">
                    {forecastData.accuracy.mape.toFixed(1)}% MAPE
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Root Mean Square Error
                  </Typography>
                  <Typography variant="h6">
                    {forecastData.accuracy.rmse.toFixed(1)} kg CO₂
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Mean Absolute Error
                  </Typography>
                  <Typography variant="h6">
                    {forecastData.accuracy.mae.toFixed(1)} kg CO₂
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Year Average
                  </Typography>
                  <Typography variant="h6">
                    {forecastData.current.length > 0 
                      ? Math.round(forecastData.current.reduce((sum, d) => sum + d.totalCO2, 0) / forecastData.current.length)
                      : 0} kg CO₂
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Projected Next Year Average
                  </Typography>
                  <Typography variant="h6">
                    {Math.round(forecastData.forecast.data.reduce((sum, d) => sum + d.totalCO2, 0) / forecastData.forecast.data.length)} kg CO₂
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Forecast Insights
                </Typography>
                
                {forecastData.insights.length > 0 ? (
                  <List dense>
                    {forecastData.insights.map((insight, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color={getPriorityColor(insight.priority) as any} />
                        </ListItemIcon>
                        <ListItemText
                          primary={insight.title}
                          secondary={insight.description}
                        />
                        <Chip
                          label={insight.priority}
                          size="small"
                          color={getPriorityColor(insight.priority) as any}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific insights available for this forecast.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Historical vs Forecast Comparison */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Historical vs Forecast Comparison
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {forecastData.historical.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Historical Data Points
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {forecastData.forecast.data.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Forecast Periods
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {forecastData.current.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Year Data Points
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CarbonForecastingGraph;