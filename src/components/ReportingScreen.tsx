import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Nature as EcoIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface CarbonData {
  month: string;
  carbonFootprint: number;
  target: number;
  reduction: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface TrendData {
  period: string;
  current: number;
  previous: number;
  change: number;
}

const ReportingScreen: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('6months');
  const [reportType, setReportType] = useState('comprehensive');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Sample data - in real app, this would come from API
  const carbonData: CarbonData[] = [
    { month: 'Jan', carbonFootprint: 45.2, target: 40, reduction: 2.1 },
    { month: 'Feb', carbonFootprint: 42.8, target: 40, reduction: 3.2 },
    { month: 'Mar', carbonFootprint: 38.5, target: 40, reduction: 4.8 },
    { month: 'Apr', carbonFootprint: 35.2, target: 40, reduction: 6.1 },
    { month: 'May', carbonFootprint: 32.8, target: 40, reduction: 7.5 },
    { month: 'Jun', carbonFootprint: 29.5, target: 40, reduction: 9.2 }
  ];

  const categoryData: CategoryData[] = [
    { name: 'Energy', value: 35, color: '#8884d8' },
    { name: 'Transportation', value: 25, color: '#82ca9d' },
    { name: 'Waste', value: 20, color: '#ffc658' },
    { name: 'Water', value: 15, color: '#ff7300' },
    { name: 'Materials', value: 5, color: '#00ff00' }
  ];

  const trendData: TrendData[] = [
    { period: 'This Month', current: 29.5, previous: 32.8, change: -10.1 },
    { period: 'This Quarter', current: 101.5, previous: 115.2, change: -11.9 },
    { period: 'This Year', current: 223.8, previous: 245.6, change: -8.9 }
  ];

  const recommendations = [
    {
      id: 1,
      title: 'Switch to LED Lighting',
      impact: 'High',
      cost: 'Low',
      savings: '15% energy reduction',
      status: 'Not Implemented'
    },
    {
      id: 2,
      title: 'Install Solar Panels',
      impact: 'Very High',
      cost: 'High',
      savings: '40% energy reduction',
      status: 'In Progress'
    },
    {
      id: 3,
      title: 'Implement Waste Segregation',
      impact: 'Medium',
      cost: 'Low',
      savings: '20% waste reduction',
      status: 'Completed'
    },
    {
      id: 4,
      title: 'Use Electric Vehicles',
      impact: 'High',
      cost: 'Medium',
      savings: '30% transport emissions',
      status: 'Not Implemented'
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    setSnackbarMessage('Report exported successfully!');
    setSnackbarOpen(true);
    setExportDialogOpen(false);
  };

  const handleEmailReport = () => {
    setSnackbarMessage(`Report sent to ${email} successfully!`);
    setSnackbarOpen(true);
    setEmailDialogOpen(false);
    setEmail('');
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Very High': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'warning';
      case 'Not Implemented': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon color="primary" />
          Sustainability Reports
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => setEmailDialogOpen(true)}
          >
            Email
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <MenuItem value="1month">Last Month</MenuItem>
                  <MenuItem value="3months">Last 3 Months</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="1year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="summary">Summary</MenuItem>
                  <MenuItem value="comprehensive">Comprehensive</MenuItem>
                  <MenuItem value="executive">Executive Summary</MenuItem>
                  <MenuItem value="detailed">Detailed Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" fullWidth>
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
            <Tab label="Overview" />
            <Tab label="Carbon Footprint" />
            <Tab label="Recommendations" />
            <Tab label="Trends" />
            <Tab label="Comparisons" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Carbon Footprint Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={carbonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="carbonFootprint"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Actual"
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Emissions by Category
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key Performance Indicators
                  </Typography>
                  <Grid container spacing={2}>
                    {trendData.map((trend, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {trend.current.toFixed(1)} tCO₂
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {trend.period}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {trend.change < 0 ? (
                              <TrendingDownIcon color="success" />
                            ) : (
                              <TrendingUpIcon color="error" />
                            )}
                            <Typography
                              variant="body2"
                              color={trend.change < 0 ? 'success.main' : 'error.main'}
                            >
                              {Math.abs(trend.change).toFixed(1)}% vs previous
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Carbon Footprint Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Carbon Footprint Analysis
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={carbonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="carbonFootprint"
                        stroke="#8884d8"
                        strokeWidth={3}
                        name="Carbon Footprint (tCO₂)"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Target (tCO₂)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Reduction Progress
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={carbonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="reduction" fill="#4caf50" name="Reduction (tCO₂)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Category Breakdown
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Percentage (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Recommendations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sustainability Recommendations
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Recommendation</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Potential Savings</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recommendations.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {rec.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rec.impact}
                            color={getImpactColor(rec.impact) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rec.cost}
                            color={rec.cost === 'Low' ? 'success' : rec.cost === 'High' ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{rec.savings}</TableCell>
                        <TableCell>
                          <Chip
                            label={rec.status}
                            color={getStatusColor(rec.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Trends Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={carbonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="carbonFootprint"
                        stroke="#8884d8"
                        strokeWidth={3}
                        name="Carbon Footprint"
                      />
                      <Line
                        type="monotone"
                        dataKey="reduction"
                        stroke="#4caf50"
                        strokeWidth={2}
                        name="Monthly Reduction"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Comparisons Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Industry Comparison
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Your Performance vs Industry Average
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Your Carbon Footprint</Typography>
                        <Typography variant="body2">29.5 tCO₂</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={65} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Industry Average</Typography>
                        <Typography variant="body2">45.2 tCO₂</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <Typography variant="body2" color="success.main">
                      You're performing 35% better than industry average!
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Goal Progress
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Annual Carbon Reduction Goal
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress</Typography>
                        <Typography variant="body2">75%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={75} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Target: 40% reduction by end of year
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      On track to exceed goal!
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Export Report
            <IconButton onClick={() => setExportDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Choose export format:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="outlined" fullWidth>
                PDF
              </Button>
              <Button variant="outlined" fullWidth>
                Excel
              </Button>
              <Button variant="outlined" fullWidth>
                CSV
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Email Report
            <IconButton onClick={() => setEmailDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              The report will be sent as a PDF attachment to the specified email address.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEmailReport} variant="contained" disabled={!email}>
            Send Report
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

export default ReportingScreen;