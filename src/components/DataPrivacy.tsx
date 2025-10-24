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
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Security as SecurityIcon,
  PrivacyTip as PrivacyIcon,
  DataUsage as DataIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import apiService from '../services/api';

// Data privacy consent schema
const consentSchema = yup.object({
  dataProcessing: yup.boolean().required(),
  marketingCommunications: yup.boolean().required(),
  thirdPartySharing: yup.boolean().required(),
  analyticsTracking: yup.boolean().required(),
  cookieConsent: yup.boolean().required(),
  dataRetention: yup.boolean().required()
});

type ConsentForm = yup.InferType<typeof consentSchema>;

interface DataRequest {
  _id: string;
  type: 'access' | 'portability' | 'deletion' | 'rectification' | 'restriction';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  description: string;
  requestedAt: string;
  completedAt?: string;
  response?: string;
}

interface DataActivity {
  _id: string;
  action: string;
  dataType: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}

interface PrivacySettings {
  dataProcessing: boolean;
  marketingCommunications: boolean;
  thirdPartySharing: boolean;
  analyticsTracking: boolean;
  cookieConsent: boolean;
  dataRetention: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  dataEncryption: boolean;
  auditLogging: boolean;
}

const DataPrivacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataProcessing: true,
    marketingCommunications: false,
    thirdPartySharing: false,
    analyticsTracking: true,
    cookieConsent: true,
    dataRetention: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    dataEncryption: true,
    auditLogging: true
  });
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [dataActivities, setDataActivities] = useState<DataActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null);
  const [openRequestDetailsDialog, setOpenRequestDetailsDialog] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ConsentForm>({
    resolver: yupResolver(consentSchema),
    defaultValues: {
      dataProcessing: true,
      marketingCommunications: false,
      thirdPartySharing: false,
      analyticsTracking: true,
      cookieConsent: true,
      dataRetention: true
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    setIsLoading(true);
    try {
      // Load privacy settings
      const settingsData = await apiService.getPrivacySettings() as any;
      if (settingsData.success) {
        setPrivacySettings(settingsData.data);
        reset(settingsData.data);
      }

      // Load data requests
      const requestsData = await apiService.getDataRequests() as any;
      if (requestsData.success) {
        setDataRequests(requestsData.data);
      }

      // Load data activities
      const activitiesData = await apiService.getDataActivities() as any;
      if (activitiesData.success) {
        setDataActivities(activitiesData.data);
      }
    } catch (error) {
      console.error('Error loading privacy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePrivacySettings = async (formData: ConsentForm) => {
    setIsSaving(true);
    try {
      const data = await apiService.updatePrivacySettings(formData) as any;
      if (data.success) {
        setPrivacySettings({ ...privacySettings, ...formData });
        setOpenSettingsDialog(false);
        alert('Privacy settings updated successfully!');
      } else {
        alert(data.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const submitDataRequest = async (requestData: any) => {
    try {
      const data = await apiService.submitDataRequest(requestData) as any;
      if (data.success) {
        setOpenRequestDialog(false);
        loadPrivacyData();
        alert('Data request submitted successfully!');
      } else {
        alert(data.message || 'Failed to submit data request');
      }
    } catch (error) {
      console.error('Error submitting data request:', error);
      alert('Failed to submit data request');
    }
  };

  const downloadPersonalData = async () => {
    try {
      const data = await apiService.downloadPersonalData() as any;
      if (data.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `personal-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading personal data:', error);
      alert('Failed to download personal data');
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'access': 'Data Access Request',
      'portability': 'Data Portability Request',
      'deletion': 'Data Deletion Request',
      'rectification': 'Data Rectification Request',
      'restriction': 'Data Processing Restriction'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'in_progress': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckIcon />;
      case 'rejected': return <WarningIcon />;
      case 'in_progress': return <TimelineIcon />;
      case 'pending': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Data Privacy & Protection
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setOpenSettingsDialog(true)}
            sx={{ mr: 1 }}
          >
            Privacy Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadPersonalData}
          >
            Download My Data
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Privacy Overview" />
        <Tab label="Data Requests" />
        <Tab label="Activity Log" />
        <Tab label="Consent Management" />
        <Tab label="Security Settings" />
      </Tabs>

      {/* Privacy Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Data Protection Status
                  </Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {privacySettings.dataEncryption ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Data Encryption"
                      secondary={privacySettings.dataEncryption ? "Enabled" : "Disabled"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {privacySettings.twoFactorAuth ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary={privacySettings.twoFactorAuth ? "Enabled" : "Disabled"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {privacySettings.auditLogging ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Audit Logging"
                      secondary={privacySettings.auditLogging ? "Enabled" : "Disabled"}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DataIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Data Processing Consent
                  </Typography>
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {privacySettings.dataProcessing ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Data Processing"
                      secondary={privacySettings.dataProcessing ? "Consented" : "Not Consented"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {privacySettings.marketingCommunications ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Marketing Communications"
                      secondary={privacySettings.marketingCommunications ? "Consented" : "Not Consented"}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {privacySettings.thirdPartySharing ? <CheckIcon color="success" /> : <WarningIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Third-Party Sharing"
                      secondary={privacySettings.thirdPartySharing ? "Consented" : "Not Consented"}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<DownloadIcon />}
                      onClick={downloadPersonalData}
                    >
                      Download Data
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<DeleteIcon />}
                      onClick={() => setOpenRequestDialog(true)}
                    >
                      Request Deletion
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={() => setOpenRequestDialog(true)}
                    >
                      Request Correction
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SettingsIcon />}
                      onClick={() => setOpenSettingsDialog(true)}
                    >
                      Update Settings
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Data Requests Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Data Subject Requests
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenRequestDialog(true)}
              >
                New Request
              </Button>
            </Box>
          </Grid>

          {dataRequests.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No data requests found. Submit a request to access, correct, or delete your personal data.
              </Alert>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell>
                          <Typography variant="body2">
                            {getRequestTypeLabel(request.type)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(request.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(request.requestedAt)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {request.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedRequest(request);
                              setOpenRequestDetailsDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      )}

      {/* Activity Log Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Data Activity Log
            </Typography>
          </Grid>

          {dataActivities.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No data activities found. Activities will appear here as you use the platform.
              </Alert>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <List>
                {dataActivities.map((activity) => (
                  <ListItem key={activity._id} divider>
                    <ListItemIcon>
                      <TimelineIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.dataType} • {formatDate(activity.timestamp)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {activity.details}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
        </Grid>
      )}

      {/* Consent Management Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Consent Management
                </Typography>
                <form onSubmit={handleSubmit(savePrivacySettings)}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="dataProcessing"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Data Processing Consent"
                            sx={{ display: 'block' }}
                          />
                        )}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Allow processing of personal data for service provision
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="marketingCommunications"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Marketing Communications"
                            sx={{ display: 'block' }}
                          />
                        )}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Receive marketing emails and promotional content
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="thirdPartySharing"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Third-Party Data Sharing"
                            sx={{ display: 'block' }}
                          />
                        )}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Allow sharing data with trusted third-party partners
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="analyticsTracking"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Analytics Tracking"
                            sx={{ display: 'block' }}
                          />
                        )}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Allow analytics and usage tracking for service improvement
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="cookieConsent"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Cookie Consent"
                            sx={{ display: 'block' }}
                          />
                        )}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Allow cookies for enhanced user experience
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="dataRetention"
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} />}
                            label="Data Retention"
                            sx={{ display: 'block' }}
                          />
                        )}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Allow data retention for regulatory compliance
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={20} /> : <CheckIcon />}
                    >
                      {isSaving ? 'Saving...' : 'Save Consent Settings'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Settings Tab */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.twoFactorAuth}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            twoFactorAuth: e.target.checked
                          })}
                        />
                      }
                      label="Two-Factor Authentication"
                      sx={{ display: 'block' }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Add an extra layer of security to your account
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.dataEncryption}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            dataEncryption: e.target.checked
                          })}
                        />
                      }
                      label="Data Encryption"
                      sx={{ display: 'block' }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Encrypt all personal data at rest and in transit
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privacySettings.auditLogging}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            auditLogging: e.target.checked
                          })}
                        />
                      }
                      label="Audit Logging"
                      sx={{ display: 'block' }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Log all data access and modification activities
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Session Timeout</InputLabel>
                      <Select
                        value={privacySettings.sessionTimeout}
                        onChange={(e) => setPrivacySettings({
                          ...privacySettings,
                          sessionTimeout: e.target.value as number
                        })}
                        label="Session Timeout"
                      >
                        <MenuItem value={15}>15 minutes</MenuItem>
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>1 hour</MenuItem>
                        <MenuItem value={120}>2 hours</MenuItem>
                        <MenuItem value={480}>8 hours</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Automatically log out after period of inactivity
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    onClick={() => {
                      // Save security settings
                      alert('Security settings updated successfully!');
                    }}
                  >
                    Save Security Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Data Request Dialog */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Data Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Request Type</InputLabel>
                <Select
                  value=""
                  label="Request Type"
                >
                  <MenuItem value="access">Data Access Request</MenuItem>
                  <MenuItem value="portability">Data Portability Request</MenuItem>
                  <MenuItem value="deletion">Data Deletion Request</MenuItem>
                  <MenuItem value="rectification">Data Rectification Request</MenuItem>
                  <MenuItem value="restriction">Data Processing Restriction</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Please describe your request in detail..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenRequestDialog(false);
              alert('Data request submitted successfully!');
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={openRequestDetailsDialog} onClose={() => setOpenRequestDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Request Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Request Type"
                        secondary={getRequestTypeLabel(selectedRequest.type)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedRequest.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(selectedRequest.status) as any}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Requested Date"
                        secondary={formatDate(selectedRequest.requestedAt)}
                      />
                    </ListItem>
                    {selectedRequest.completedAt && (
                      <ListItem>
                        <ListItemText
                          primary="Completed Date"
                          secondary={formatDate(selectedRequest.completedAt)}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRequest.description}
                  </Typography>
                  {selectedRequest.response && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Response
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedRequest.response}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataPrivacy;