import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
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
  Cell
} from 'recharts';
import axios from 'axios';

interface AgentActivity {
  agentId: string;
  agentName: string;
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  startTime: string;
  duration?: number;
  progress: number;
}

interface SystemMetrics {
  timestamp: string;
  activeAgents: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  systemLoad: number;
}

interface CoordinationExecution {
  executionId: string;
  mode: string;
  status: string;
  participatingAgents: string[];
  startTime: string;
  duration?: number;
  results: any;
}

const MultiAgentDashboard: React.FC = () => {
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [coordinationExecutions, setCoordinationExecutions] = useState<CoordinationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 2000); // Refresh every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      const [statusResponse, metricsResponse] = await Promise.all([
        axios.get('/api/ai-agents/multi-agent-status'),
        axios.get('/api/ai-agents/dashboard-metrics')
      ]);

      const status = statusResponse.data.data;
      const metrics = metricsResponse.data.data;

      // Process agent activities
      const activities: AgentActivity[] = [];
      for (const [agentId, agentState] of Object.entries(status.agentStates)) {
        const typedAgentState = agentState as any;
        if (typedAgentState.lastActivity) {
          activities.push({
            agentId,
            agentName: typedAgentState.name,
            taskId: `task_${Date.now()}`,
            status: typedAgentState.status === 'active' ? 'running' : 'completed',
            startTime: typedAgentState.lastActivity,
            progress: Math.random() * 100, // Mock progress
            duration: typedAgentState.averageResponseTime
          });
        }
      }
      setAgentActivities(activities);

      // Process system metrics
      const newMetric: SystemMetrics = {
        timestamp: new Date().toISOString(),
        activeAgents: status.activeAgents,
        processingTasks: status.processingTasks,
        completedTasks: Math.floor(Math.random() * 10), // Mock data
        failedTasks: Math.floor(Math.random() * 3),
        averageResponseTime: Object.values(status.agentStates).reduce((avg: number, agent: any) => 
          avg + (agent.averageResponseTime || 0), 0) / Object.keys(status.agentStates).length,
        systemLoad: (status.processingTasks / status.totalAgents) * 100
      };
      
      setSystemMetrics(prev => [...prev.slice(-20), newMetric]); // Keep last 20 data points

      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'pending': return <PauseIcon />;
      default: return <InfoIcon />;
    }
  };

  const chartData = systemMetrics.map(metric => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    activeAgents: metric.activeAgents,
    processingTasks: metric.processingTasks,
    completedTasks: metric.completedTasks,
    failedTasks: metric.failedTasks,
    averageResponseTime: metric.averageResponseTime,
    systemLoad: metric.systemLoad
  }));

  const agentTypeData = [
    { name: 'Carbon Analyzer', value: 25, color: '#8884d8' },
    { name: 'Recommendation Engine', value: 20, color: '#82ca9d' },
    { name: 'Data Processor', value: 15, color: '#ffc658' },
    { name: 'Anomaly Detector', value: 10, color: '#ff7300' },
    { name: 'Trend Analyzer', value: 10, color: '#00ff00' },
    { name: 'Compliance Monitor', value: 10, color: '#ff00ff' },
    { name: 'Optimization Advisor', value: 5, color: '#00ffff' },
    { name: 'Report Generator', value: 5, color: '#ffff00' }
  ];

  if (loading && systemMetrics.length === 0) {
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
          Multi-Agent Dashboard
        </Typography>
        <Box>
          <Tooltip title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}>
            <IconButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? "primary" : "default"}
            >
              {autoRefresh ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh now">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Real-time Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="activeAgents" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="processingTasks" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="systemLoad" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {agentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Task Completion Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Task Completion Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="completedTasks" fill="#82ca9d" />
                  <Bar dataKey="failedTasks" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="averageResponseTime" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Agent Activities
              </Typography>
              <List>
                {agentActivities.slice(0, 5).map((activity, index) => (
                  <React.Fragment key={activity.taskId}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(activity.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {activity.agentName}
                            </Typography>
                            <Chip
                              label={activity.status}
                              color={getStatusColor(activity.status) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Task: {activity.taskId}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={activity.progress}
                              sx={{ mt: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {activity.progress.toFixed(1)}% complete
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < agentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2">System Load</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {systemMetrics[systemMetrics.length - 1]?.systemLoad?.toFixed(1) || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemMetrics[systemMetrics.length - 1]?.systemLoad || 0}
                  sx={{ mb: 3 }}
                />

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2">Active Agents</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {systemMetrics[systemMetrics.length - 1]?.activeAgents || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(systemMetrics[systemMetrics.length - 1]?.activeAgents || 0) * 10}
                  sx={{ mb: 3 }}
                />

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2">Processing Tasks</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {systemMetrics[systemMetrics.length - 1]?.processingTasks || 0}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(systemMetrics[systemMetrics.length - 1]?.processingTasks || 0) * 20}
                  color="warning"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MultiAgentDashboard;
