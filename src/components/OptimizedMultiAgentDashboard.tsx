import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Cpu as CpuIcon,
  NetworkCheck as NetworkIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter
} from 'recharts';
import axios from 'axios';

interface OptimizationMetrics {
  cache: {
    hitRate: number;
    size: number;
  };
  agents: Record<string, any>;
  connections: Record<string, any>;
}

interface SystemStatus {
  optimization: {
    cacheHitRate: number;
    cacheSize: number;
    activeOptimizations: number;
    performanceScore: number;
  };
  multiAgent: {
    totalAgents: number;
    activeAgents: number;
    processingTasks: number;
    queuedTasks: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
  timestamp: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  estimatedDuration: number;
  steps: Array<{
    stepId: string;
    name: string;
    type: string;
    dependencies: string[];
    optimization: {
      parallelizable: boolean;
      cacheable: boolean;
      resourceIntensive: boolean;
    };
  }>;
}

const OptimizedMultiAgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [optimizationMetrics, setOptimizationMetrics] = useState<OptimizationMetrics | null>(null);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [coordinationDialogOpen, setCoordinationDialogOpen] = useState(false);
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      const [statusResponse, metricsResponse, templatesResponse] = await Promise.all([
        axios.get('/api/optimized-ai-agents/optimization-status'),
        axios.get('/api/optimized-ai-agents/performance-metrics'),
        axios.get('/api/optimized-ai-agents/workflow-templates')
      ]);

      setSystemStatus(statusResponse.data.data);
      setOptimizationMetrics(metricsResponse.data.data.optimization);
      setWorkflowTemplates(templatesResponse.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch optimization data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteWorkflow = async (workflow: WorkflowTemplate) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/optimized-ai-agents/execute-optimized-workflow', {
        workflowType: workflow.id,
        input: {
          sampleData: true,
          timestamp: new Date().toISOString()
        },
        options: {
          autoOptimization: true,
          performanceMonitoring: true
        }
      });

      console.log('Workflow executed:', response.data);
      setWorkflowDialogOpen(false);
      await fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to execute workflow');
      console.error('Error executing workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedCoordination = async (coordinationData: any) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/optimized-ai-agents/advanced-coordination', coordinationData);
      console.log('Advanced coordination executed:', response.data);
      setCoordinationDialogOpen(false);
      await fetchData();
    } catch (err) {
      setError('Failed to execute advanced coordination');
      console.error('Error executing coordination:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoOptimize = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/optimized-ai-agents/auto-optimize', {
        optimizationTypes: ['performance', 'resource', 'quality']
      });
      console.log('Auto-optimization completed:', response.data);
      await fetchData();
    } catch (err) {
      setError('Failed to execute auto-optimization');
      console.error('Error executing auto-optimization:', err);
    } finally {
      setLoading(false);
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

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'very_high': return 'error';
      default: return 'default';
    }
  };

  if (loading && !systemStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Optimized Multi-Agent Dashboard
        </Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh"
          />
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleAutoOptimize}
            disabled={loading}
            sx={{ ml: 2 }}
          >
            Auto-Optimize
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Performance" />
        <Tab label="Workflows" />
        <Tab label="Optimization" />
        <Tab label="Analytics" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && systemStatus && (
        <Grid container spacing={3}>
          {/* Performance Score */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Performance Score
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {systemStatus.optimization.performanceScore.toFixed(1)}%
                    </Typography>
                  </Box>
                  <SpeedIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemStatus.optimization.performanceScore}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Cache Hit Rate */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Cache Hit Rate
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {(systemStatus.optimization.cacheHitRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <MemoryIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemStatus.optimization.cacheHitRate * 100}
                  color="success"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Active Agents */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Agents
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {systemStatus.multiAgent.activeAgents}
                    </Typography>
                  </Box>
                  <GroupIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  of {systemStatus.multiAgent.totalAgents} total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Processing Tasks */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Processing Tasks
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {systemStatus.multiAgent.processingTasks}
                    </Typography>
                  </Box>
                  <TimelineIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {systemStatus.multiAgent.queuedTasks} queued
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Recommendations
                </Typography>
                <List>
                  {systemStatus.recommendations.map((rec, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {rec.priority === 'high' ? <ErrorIcon color="error" /> :
                           rec.priority === 'medium' ? <WarningIcon color="warning" /> :
                           <InfoIcon color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.message}
                          secondary={`Priority: ${rec.priority} | Type: ${rec.type}`}
                        />
                        <Chip
                          label={rec.priority}
                          color={getPriorityColor(rec.priority) as any}
                          size="small"
                        />
                      </ListItem>
                      {index < systemStatus.recommendations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Performance Tab */}
      {activeTab === 1 && optimizationMetrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Agent Performance
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent Type</TableCell>
                        <TableCell>Success Rate</TableCell>
                        <TableCell>Response Time</TableCell>
                        <TableCell>Tasks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(optimizationMetrics.agents).map(([type, metrics]) => (
                        <TableRow key={type}>
                          <TableCell>
                            <Chip label={type} size="small" />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {(metrics.successRate * 100).toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={metrics.successRate * 100}
                                sx={{ width: 60, height: 6 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            {metrics.averageResponseTime?.toFixed(0) || 0}ms
                          </TableCell>
                          <TableCell>
                            {metrics.tasksCompleted || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cache Performance
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="body2">Hit Rate</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {(optimizationMetrics.cache.hitRate * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={optimizationMetrics.cache.hitRate * 100}
                    sx={{ mb: 3 }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="body2">Cache Size</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {optimizationMetrics.cache.size} entries
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(optimizationMetrics.cache.size / 1000) * 100}
                    color="secondary"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Workflows Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Available Workflow Templates</Typography>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => setWorkflowDialogOpen(true)}
              >
                Execute Workflow
              </Button>
            </Box>
          </Grid>

          {workflowTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Typography variant="h6">{template.name}</Typography>
                    <Chip
                      label={template.complexity}
                      color={getComplexityColor(template.complexity) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="caption">
                      {template.steps.length} steps
                    </Typography>
                    <Typography variant="caption">
                      ~{Math.round(template.estimatedDuration / 1000)}s
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} sx={{ mb: 2 }}>
                    {template.steps.slice(0, 3).map((step) => (
                      <Chip
                        key={step.stepId}
                        label={step.type}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {template.steps.length > 3 && (
                      <Chip
                        label={`+${template.steps.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => {
                      setSelectedWorkflow(template);
                      setWorkflowDialogOpen(true);
                    }}
                  >
                    Execute
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Optimization Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Optimization Settings
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto-optimization"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Predictive scaling"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Performance monitoring"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Resource optimization"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Load Balancing
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Strategy</InputLabel>
                  <Select defaultValue="predictive">
                    <MenuItem value="round_robin">Round Robin</MenuItem>
                    <MenuItem value="weighted_round_robin">Weighted Round Robin</MenuItem>
                    <MenuItem value="least_connections">Least Connections</MenuItem>
                    <MenuItem value="performance_based">Performance Based</MenuItem>
                    <MenuItem value="predictive">Predictive</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => setCoordinationDialogOpen(true)}
                >
                  Configure Coordination
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Analytics Tab */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Analytics
                </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="performance" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Workflow Execution Dialog */}
      <Dialog
        open={workflowDialogOpen}
        onClose={() => setWorkflowDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Execute Workflow</DialogTitle>
        <DialogContent>
          {selectedWorkflow && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedWorkflow.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {selectedWorkflow.description}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Steps:
              </Typography>
              <List dense>
                {selectedWorkflow.steps.map((step, index) => (
                  <ListItem key={step.stepId}>
                    <ListItemIcon>
                      <Typography variant="body2">{index + 1}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={step.name}
                      secondary={step.type}
                    />
                    <Chip
                      label={step.optimization.parallelizable ? 'Parallel' : 'Sequential'}
                      size="small"
                      color={step.optimization.parallelizable ? 'success' : 'default'}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkflowDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedWorkflow && handleExecuteWorkflow(selectedWorkflow)}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Execute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OptimizedMultiAgentDashboard;