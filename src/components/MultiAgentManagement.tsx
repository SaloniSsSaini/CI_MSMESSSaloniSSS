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
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';

interface AIAgent {
  _id: string;
  name: string;
  type: string;
  status: string;
  isActive: boolean;
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    lastActivity: string;
  };
}

interface MultiAgentStatus {
  totalAgents: number;
  activeAgents: number;
  processingTasks: number;
  queuedTasks: number;
  parallelExecutions: number;
  agentStates: Record<string, any>;
  coordinationStatus: Record<string, any>;
}

interface CoordinationTask {
  agentIds: string[];
  taskType: string;
  coordinationMode: 'parallel' | 'sequential' | 'consensus';
  input: any;
}

const MultiAgentManagement: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [multiAgentStatus, setMultiAgentStatus] = useState<MultiAgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [coordinationDialogOpen, setCoordinationDialogOpen] = useState(false);
  const [coordinationTask, setCoordinationTask] = useState<CoordinationTask>({
    agentIds: [],
    taskType: '',
    coordinationMode: 'parallel',
    input: {}
  });
  const [coordinationResults, setCoordinationResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [agentsResponse, statusResponse] = await Promise.all([
        axios.get('/api/ai-agents'),
        axios.get('/api/ai-agents/multi-agent-status')
      ]);

      setAgents(agentsResponse.data.data);
      setMultiAgentStatus(statusResponse.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch multi-agent data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinationSubmit = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/ai-agents/coordinate-agents', coordinationTask);
      setCoordinationResults(response.data.data);
      setCoordinationDialogOpen(false);
      await fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to coordinate agents');
      console.error('Error coordinating agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceLoad = async () => {
    try {
      setLoading(true);
      await axios.post('/api/ai-agents/balance-load');
      await fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to balance agent load');
      console.error('Error balancing load:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'busy': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'inactive': return <ErrorIcon />;
      case 'busy': return <WarningIcon />;
      default: return <WarningIcon />;
    }
  };

  if (loading && !multiAgentStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Multi-Agent Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Overview */}
      {multiAgentStatus && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Agents
                    </Typography>
                    <Typography variant="h4">
                      {multiAgentStatus.totalAgents}
                    </Typography>
                  </Box>
                  <GroupIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Agents
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {multiAgentStatus.activeAgents}
                    </Typography>
                  </Box>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Processing Tasks
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {multiAgentStatus.processingTasks}
                    </Typography>
                  </Box>
                  <TimelineIcon color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Queued Tasks
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {multiAgentStatus.queuedTasks}
                    </Typography>
                  </Box>
                  <TimelineIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayIcon />}
          onClick={() => setCoordinationDialogOpen(true)}
        >
          Coordinate Agents
        </Button>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={handleBalanceLoad}
          disabled={loading}
        >
          Balance Load
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Agents Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Agents Status
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Tasks Completed</TableCell>
                  <TableCell>Success Rate</TableCell>
                  <TableCell>Avg Response Time</TableCell>
                  <TableCell>Last Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(agent.status)}
                        <Typography variant="body2" fontWeight="medium">
                          {agent.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agent.type}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={agent.status}
                        color={getStatusColor(agent.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {agent.performance?.successRate?.toFixed(1) || 0}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={agent.performance?.successRate || 0}
                          sx={{ width: 60, height: 6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{agent.performance?.tasksCompleted || 0}</TableCell>
                    <TableCell>{agent.performance?.successRate?.toFixed(1) || 0}%</TableCell>
                    <TableCell>
                      {agent.performance?.averageResponseTime?.toFixed(0) || 0}ms
                    </TableCell>
                    <TableCell>
                      {agent.performance?.lastActivity 
                        ? new Date(agent.performance.lastActivity).toLocaleString()
                        : 'Never'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Coordination Results */}
      {coordinationResults && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Coordination Results
            </Typography>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Mode: {coordinationResults.mode}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Successful: {coordinationResults.successful}/{coordinationResults.totalTasks}
              </Typography>
              {coordinationResults.consensus && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Consensus Results:</Typography>
                  <Typography variant="body2">
                    Confidence: {(coordinationResults.consensus.confidence * 100).toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Coordination Dialog */}
      <Dialog
        open={coordinationDialogOpen}
        onClose={() => setCoordinationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Coordinate AI Agents</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Agents</InputLabel>
              <Select
                multiple
                value={coordinationTask.agentIds}
                onChange={(e) => setCoordinationTask({
                  ...coordinationTask,
                  agentIds: e.target.value as string[]
                })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const agent = agents.find(a => a._id === value);
                      return (
                        <Chip key={value} label={agent?.name || value} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {agents.filter(agent => agent.isActive).map((agent) => (
                  <MenuItem key={agent._id} value={agent._id}>
                    {agent.name} ({agent.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={coordinationTask.taskType}
                onChange={(e) => setCoordinationTask({
                  ...coordinationTask,
                  taskType: e.target.value
                })}
              >
                <MenuItem value="carbon_analysis">Carbon Analysis</MenuItem>
                <MenuItem value="recommendation_generation">Recommendation Generation</MenuItem>
                <MenuItem value="data_processing">Data Processing</MenuItem>
                <MenuItem value="anomaly_detection">Anomaly Detection</MenuItem>
                <MenuItem value="trend_analysis">Trend Analysis</MenuItem>
                <MenuItem value="compliance_check">Compliance Check</MenuItem>
                <MenuItem value="optimization_advice">Optimization Advice</MenuItem>
                <MenuItem value="report_generation">Report Generation</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Coordination Mode</InputLabel>
              <Select
                value={coordinationTask.coordinationMode}
                onChange={(e) => setCoordinationTask({
                  ...coordinationTask,
                  coordinationMode: e.target.value as any
                })}
              >
                <MenuItem value="parallel">Parallel Execution</MenuItem>
                <MenuItem value="sequential">Sequential Execution</MenuItem>
                <MenuItem value="consensus">Consensus Building</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Input Data (JSON)"
              multiline
              rows={4}
              value={JSON.stringify(coordinationTask.input, null, 2)}
              onChange={(e) => {
                try {
                  const input = JSON.parse(e.target.value);
                  setCoordinationTask({ ...coordinationTask, input });
                } catch (err) {
                  // Invalid JSON, keep as is
                }
              }}
              helperText="Enter JSON data for the coordination task"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoordinationDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCoordinationSubmit}
            variant="contained"
            disabled={loading || coordinationTask.agentIds.length === 0 || !coordinationTask.taskType}
          >
            {loading ? <CircularProgress size={20} /> : 'Coordinate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiAgentManagement;
