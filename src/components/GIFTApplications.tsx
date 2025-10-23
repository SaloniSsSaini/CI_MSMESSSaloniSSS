import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface GIFTApplication {
  _id: string;
  applicationNumber: string;
  msmeId: {
    _id: string;
    companyName: string;
    companyType: string;
    industry: string;
  };
  schemeId: {
    _id: string;
    schemeName: string;
    schemeCode: string;
    category: string;
    benefits: {
      incentiveType: string;
      incentiveAmount: number;
    };
  };
  projectDetails: {
    projectName: string;
    projectDescription: string;
    projectCategory: string;
    projectValue: number;
    expectedCarbonReduction: number;
    projectDuration: number;
    startDate: string;
    endDate: string;
  };
  financialDetails: {
    totalProjectCost: number;
    requestedIncentiveAmount: number;
    ownContribution: number;
    bankLoanAmount: number;
    otherSources: number;
  };
  status: string;
  reviewDetails?: {
    reviewedBy: {
      name: string;
      email: string;
    };
    reviewedAt: string;
    reviewComments: string;
    reviewScore: number;
    rejectionReason?: string;
  };
  disbursementDetails?: {
    approvedAmount: number;
    disbursedAmount: number;
    disbursementDate: string;
    disbursementMethod: string;
    disbursementReference: string;
  };
  createdAt: string;
  updatedAt: string;
}

const GIFTApplications: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<GIFTApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<GIFTApplication | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'default' },
    { value: 'submitted', label: 'Submitted', color: 'info' },
    { value: 'under_review', label: 'Under Review', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'disbursed', label: 'Disbursed', color: 'success' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' }
  ];

  useEffect(() => {
    fetchApplications();
  }, [searchTerm, statusFilter, pagination.current]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/gift-applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setApplications(data.data.applications);
        setPagination({
          current: data.data.pagination.current,
          pages: data.data.pagination.pages,
          total: data.data.pagination.total
        });
      } else {
        setError(data.message || 'Failed to fetch applications');
      }
    } catch (err) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.color : 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusObj = statusOptions.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/gift-applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setSelectedApplication(data.data);
        setDetailsDialogOpen(true);
      } else {
        setError(data.message || 'Failed to fetch application details');
      }
    } catch (err) {
      setError('Failed to fetch application details');
    }
  };

  const handleEditApplication = (applicationId: string) => {
    navigate(`/gift-applications/${applicationId}/edit`);
  };

  const handleNewApplication = () => {
    navigate('/gift-applications/new');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My GIFT Applications
        </Typography>
        <Button
          variant="contained"
          onClick={handleNewApplication}
          startIcon={<AssignmentIcon />}
        >
          New Application
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Track and manage your GIFT scheme applications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Chip
                        label={status.label}
                        color={status.color as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={fetchApplications}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Application #</TableCell>
                <TableCell>Scheme</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {application.applicationNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {application.schemeId.schemeName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {application.schemeId.schemeCode}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {application.projectDetails.projectName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {application.projectDetails.projectCategory}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrency(application.financialDetails.requestedIncentiveAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(application.status)}
                      color={getStatusColor(application.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(application.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(application._id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {application.status === 'draft' && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditApplication(application._id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.current}
            onChange={(event, page) => setPagination(prev => ({ ...prev, current: page }))}
            color="primary"
          />
        </Box>
      )}

      {/* Application Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Application Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Application Number:</strong> {selectedApplication.applicationNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Status:</strong> 
                        <Chip
                          label={getStatusLabel(selectedApplication.status)}
                          color={getStatusColor(selectedApplication.status) as any}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Applied Date:</strong> {formatDate(selectedApplication.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Last Updated:</strong> {formatDate(selectedApplication.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Scheme Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Scheme Name:</strong> {selectedApplication.schemeId.schemeName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Scheme Code:</strong> {selectedApplication.schemeId.schemeCode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Category:</strong> {selectedApplication.schemeId.category}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Incentive Type:</strong> {selectedApplication.schemeId.benefits.incentiveType}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Project Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Project Name:</strong> {selectedApplication.projectDetails.projectName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Description:</strong> {selectedApplication.projectDetails.projectDescription}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Project Value:</strong> {formatCurrency(selectedApplication.projectDetails.projectValue)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Expected Carbon Reduction:</strong> {selectedApplication.projectDetails.expectedCarbonReduction} tons CO2
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Start Date:</strong> {formatDate(selectedApplication.projectDetails.startDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>End Date:</strong> {formatDate(selectedApplication.projectDetails.endDate)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Financial Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Total Project Cost:</strong> {formatCurrency(selectedApplication.financialDetails.totalProjectCost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Requested Amount:</strong> {formatCurrency(selectedApplication.financialDetails.requestedIncentiveAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Own Contribution:</strong> {formatCurrency(selectedApplication.financialDetails.ownContribution)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Bank Loan:</strong> {formatCurrency(selectedApplication.financialDetails.bankLoanAmount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {selectedApplication.reviewDetails && (
                  <>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Review Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Reviewed By:</strong> {selectedApplication.reviewDetails.reviewedBy.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Reviewed At:</strong> {formatDate(selectedApplication.reviewDetails.reviewedAt)}
                          </Typography>
                        </Grid>
                        {selectedApplication.reviewDetails.reviewScore && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Review Score:</strong> {selectedApplication.reviewDetails.reviewScore}/100
                            </Typography>
                          </Grid>
                        )}
                        {selectedApplication.reviewDetails.reviewComments && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Comments:</strong> {selectedApplication.reviewDetails.reviewComments}
                            </Typography>
                          </Grid>
                        )}
                        {selectedApplication.reviewDetails.rejectionReason && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="error">
                              <strong>Rejection Reason:</strong> {selectedApplication.reviewDetails.rejectionReason}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  </>
                )}

                {selectedApplication.disbursementDetails && (
                  <>
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Disbursement Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Approved Amount:</strong> {formatCurrency(selectedApplication.disbursementDetails.approvedAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Disbursed Amount:</strong> {formatCurrency(selectedApplication.disbursementDetails.disbursedAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Disbursement Date:</strong> {formatDate(selectedApplication.disbursementDetails.disbursementDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Method:</strong> {selectedApplication.disbursementDetails.disbursementMethod}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Reference:</strong> {selectedApplication.disbursementDetails.disbursementReference}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedApplication?.status === 'draft' && (
            <Button 
              variant="contained" 
              onClick={() => {
                setDetailsDialogOpen(false);
                handleEditApplication(selectedApplication._id);
              }}
            >
              Edit Application
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GIFTApplications;
