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
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Assessment as AssessmentIcon,
  Nature as EcoIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import apiService from '../services/api';

// Loan application schema
const loanApplicationSchema = yup.object({
  bankId: yup.string().required('Bank selection is required'),
  loanAmount: yup.number().required('Loan amount is required').min(100000, 'Minimum loan amount is ₹1,00,000'),
  purpose: yup.string().required('Loan purpose is required'),
  description: yup.string().required('Description is required').max(1000, 'Description must be less than 1000 characters'),
  expectedCarbonReduction: yup.number().required('Expected carbon reduction is required').min(0),
  expectedPaybackPeriod: yup.number().required('Expected payback period is required').min(6, 'Minimum payback period is 6 months')
});

type LoanApplicationForm = yup.InferType<typeof loanApplicationSchema>;

interface Bank {
  _id: string;
  bankName: string;
  bankCode: string;
  contact: {
    email: string;
    phone: string;
  };
  greenLoanPolicy: {
    minCarbonScore: number;
    maxLoanAmount: number;
    minLoanAmount: number;
    interestRateRange: {
      min: number;
      max: number;
    };
    tenureRange: {
      min: number;
      max: number;
    };
    carbonScoreDiscounts: Array<{
      scoreRange: {
        min: number;
        max: number;
      };
      discountPercentage: number;
    }>;
  };
}

interface GreenLoan {
  _id: string;
  bankId: Bank;
  loanApplication: {
    loanAmount: number;
    purpose: string;
    description: string;
    expectedCarbonReduction: number;
    expectedPaybackPeriod: number;
  };
  carbonAssessment: {
    currentCarbonScore: number;
    currentCO2Emissions: number;
    carbonSavings: {
      totalSavings: number;
      periodSavings: number;
      savingsPercentage: number;
    };
  };
  loanTerms: {
    approvedAmount: number;
    interestRate: number;
    tenure: number;
    emiAmount: number;
    carbonScoreDiscount: number;
    finalInterestRate: number;
  };
  status: string;
  reviewDetails: {
    reviewedBy: string;
    reviewedAt: string;
    reviewComments: string;
    rejectionReason: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EligibilityResult {
  isEligible: boolean;
  reasons: string[];
  score: number;
  maxLoanAmount: number;
  suggestedInterestRate: number;
  carbonScoreDiscount: number;
}

const GreenLoans: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loans, setLoans] = useState<GreenLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [openApplicationDialog, setOpenApplicationDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<GreenLoan | null>(null);
  const [openLoanDetailsDialog, setOpenLoanDetailsDialog] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<LoanApplicationForm>({
    resolver: yupResolver(loanApplicationSchema),
    defaultValues: {
      loanAmount: 500000,
      purpose: 'solar_installation',
      description: '',
      expectedCarbonReduction: 0,
      expectedPaybackPeriod: 36
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    loadBanks();
    loadLoans();
  }, []);

  const loadBanks = async () => {
    try {
      const data = await apiService.getBanks() as any;
      if (data.success) {
        setBanks(data.data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  const loadLoans = async () => {
    setIsLoadingLoans(true);
    try {
      const data = await apiService.getMyLoans() as any;
      if (data.success) {
        setLoans(data.data.loans);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setIsLoadingLoans(false);
      setIsLoading(false);
    }
  };

  const checkEligibility = async (formData: LoanApplicationForm) => {
    setIsCheckingEligibility(true);
    try {
      const data = await apiService.checkLoanEligibility(formData) as any;
      if (data.success) {
        setEligibilityResult(data.data);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const submitLoanApplication = async (formData: LoanApplicationForm) => {
    setIsApplying(true);
    try {
      const data = await apiService.applyForLoan(formData) as any;
      if (data.success) {
        setOpenApplicationDialog(false);
        reset();
        setEligibilityResult(null);
        loadLoans();
        alert('Loan application submitted successfully!');
      } else {
        alert(data.message || 'Failed to submit loan application');
      }
    } catch (error) {
      console.error('Error submitting loan application:', error);
      alert('Failed to submit loan application');
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'under_review': return 'warning';
      case 'disbursed': return 'info';
      case 'active': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckIcon />;
      case 'rejected': return <CancelIcon />;
      case 'under_review': return <PendingIcon />;
      case 'disbursed': return <MoneyIcon />;
      case 'active': return <TrendingUpIcon />;
      default: return <PendingIcon />;
    }
  };

  const getPurposeLabel = (purpose: string) => {
    const purposes: { [key: string]: string } = {
      'solar_installation': 'Solar Installation',
      'energy_efficiency_upgrade': 'Energy Efficiency Upgrade',
      'waste_management_system': 'Waste Management System',
      'water_treatment_facility': 'Water Treatment Facility',
      'green_equipment_purchase': 'Green Equipment Purchase',
      'carbon_offset_projects': 'Carbon Offset Projects',
      'sustainable_manufacturing': 'Sustainable Manufacturing',
      'other_green_initiatives': 'Other Green Initiatives'
    };
    return purposes[purpose] || purpose;
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
          Green Loans
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenApplicationDialog(true)}
            sx={{ mr: 1 }}
          >
            Apply for Loan
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadLoans}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="My Loans" />
        <Tab label="Available Banks" />
        <Tab label="Loan Calculator" />
      </Tabs>

      {/* My Loans Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {isLoadingLoans ? (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : loans.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No loan applications found. Apply for a green loan to get started!
              </Alert>
            </Grid>
          ) : (
            loans.map((loan) => (
              <Grid item xs={12} md={6} key={loan._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {loan.bankId.bankName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getPurposeLabel(loan.loanApplication.purpose)}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getStatusIcon(loan.status)}
                        label={loan.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(loan.status) as any}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Loan Amount
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(loan.loanApplication.loanAmount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Carbon Score
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {loan.carbonAssessment.currentCarbonScore}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Interest Rate
                        </Typography>
                        <Typography variant="h6">
                          {loan.loanTerms.finalInterestRate}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Tenure
                        </Typography>
                        <Typography variant="h6">
                          {loan.loanTerms.tenure} months
                        </Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Applied on: {formatDate(loan.createdAt)}
                    </Typography>

                    {loan.reviewDetails.reviewComments && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Review Comments:</strong> {loan.reviewDetails.reviewComments}
                        </Typography>
                      </Alert>
                    )}

                    {loan.reviewDetails.rejectionReason && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Rejection Reason:</strong> {loan.reviewDetails.rejectionReason}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        setSelectedLoan(loan);
                        setOpenLoanDetailsDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Available Banks Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {banks.map((bank) => (
            <Grid item xs={12} md={6} key={bank._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BankIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {bank.bankName}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Bank Code: {bank.bankCode}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Green Loan Policy
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Min Carbon Score
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {bank.greenLoanPolicy.minCarbonScore}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Max Loan Amount
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(bank.greenLoanPolicy.maxLoanAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Interest Rate
                      </Typography>
                      <Typography variant="h6">
                        {bank.greenLoanPolicy.interestRateRange.min}% - {bank.greenLoanPolicy.interestRateRange.max}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tenure Range
                      </Typography>
                      <Typography variant="h6">
                        {bank.greenLoanPolicy.tenureRange.min} - {bank.greenLoanPolicy.tenureRange.max} months
                      </Typography>
                    </Grid>
                  </Grid>

                  {bank.greenLoanPolicy.carbonScoreDiscounts.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Carbon Score Discounts
                      </Typography>
                      {bank.greenLoanPolicy.carbonScoreDiscounts.map((discount, index) => (
                        <Chip
                          key={index}
                          label={`Score ${discount.scoreRange.min}-${discount.scoreRange.max}: ${discount.discountPercentage}% off`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Contact: {bank.contact.email} | {bank.contact.phone}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setActiveTab(2);
                      // Pre-fill bank selection in calculator
                    }}
                  >
                    Calculate Loan
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Loan Calculator Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Loan Calculator
                </Typography>
                <form onSubmit={handleSubmit(checkEligibility)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Controller
                        name="bankId"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.bankId}>
                            <InputLabel>Select Bank</InputLabel>
                            <Select {...field} label="Select Bank">
                              {banks.map((bank) => (
                                <MenuItem key={bank._id} value={bank._id}>
                                  {bank.bankName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller
                        name="loanAmount"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Loan Amount (₹)"
                            error={!!errors.loanAmount}
                            helperText={errors.loanAmount?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller
                        name="purpose"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.purpose}>
                            <InputLabel>Loan Purpose</InputLabel>
                            <Select {...field} label="Loan Purpose">
                              <MenuItem value="solar_installation">Solar Installation</MenuItem>
                              <MenuItem value="energy_efficiency_upgrade">Energy Efficiency Upgrade</MenuItem>
                              <MenuItem value="waste_management_system">Waste Management System</MenuItem>
                              <MenuItem value="water_treatment_facility">Water Treatment Facility</MenuItem>
                              <MenuItem value="green_equipment_purchase">Green Equipment Purchase</MenuItem>
                              <MenuItem value="carbon_offset_projects">Carbon Offset Projects</MenuItem>
                              <MenuItem value="sustainable_manufacturing">Sustainable Manufacturing</MenuItem>
                              <MenuItem value="other_green_initiatives">Other Green Initiatives</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller
                        name="expectedCarbonReduction"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Expected Carbon Reduction (kg CO₂)"
                            error={!!errors.expectedCarbonReduction}
                            helperText={errors.expectedCarbonReduction?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller
                        name="expectedPaybackPeriod"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Expected Payback Period (months)"
                            error={!!errors.expectedPaybackPeriod}
                            helperText={errors.expectedPaybackPeriod?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={isCheckingEligibility}
                      startIcon={isCheckingEligibility ? <CircularProgress size={20} /> : <AssessmentIcon />}
                    >
                      {isCheckingEligibility ? 'Checking Eligibility...' : 'Check Eligibility'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {eligibilityResult && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Eligibility Results
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Eligibility Score
                      </Typography>
                      <Box sx={{ flexGrow: 1, mx: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={eligibilityResult.score} 
                          color={eligibilityResult.isEligible ? 'success' : 'error'}
                        />
                      </Box>
                      <Typography variant="h6">
                        {eligibilityResult.score}/100
                      </Typography>
                    </Box>
                    <Chip
                      label={eligibilityResult.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                      color={eligibilityResult.isEligible ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>

                  {eligibilityResult.isEligible ? (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Loan Terms
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Max Loan Amount
                          </Typography>
                          <Typography variant="h6">
                            {formatCurrency(eligibilityResult.maxLoanAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Suggested Interest Rate
                          </Typography>
                          <Typography variant="h6">
                            {eligibilityResult.suggestedInterestRate.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Carbon Score Discount
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {eligibilityResult.carbonScoreDiscount}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="error">
                        Reasons for Ineligibility
                      </Typography>
                      <List dense>
                        {eligibilityResult.reasons.map((reason, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CancelIcon color="error" />
                            </ListItemIcon>
                            <ListItemText primary={reason} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
                {eligibilityResult.isEligible && (
                  <CardActions>
                    <Button
                      variant="contained"
                      onClick={() => setOpenApplicationDialog(true)}
                    >
                      Apply for Loan
                    </Button>
                  </CardActions>
                )}
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Loan Application Dialog */}
      <Dialog open={openApplicationDialog} onClose={() => setOpenApplicationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Apply for Green Loan</DialogTitle>
        <form onSubmit={handleSubmit(submitLoanApplication)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="bankId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.bankId}>
                      <InputLabel>Select Bank</InputLabel>
                      <Select {...field} label="Select Bank">
                        {banks.map((bank) => (
                          <MenuItem key={bank._id} value={bank._id}>
                            {bank.bankName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="loanAmount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Loan Amount (₹)"
                      error={!!errors.loanAmount}
                      helperText={errors.loanAmount?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="purpose"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.purpose}>
                      <InputLabel>Loan Purpose</InputLabel>
                      <Select {...field} label="Loan Purpose">
                        <MenuItem value="solar_installation">Solar Installation</MenuItem>
                        <MenuItem value="energy_efficiency_upgrade">Energy Efficiency Upgrade</MenuItem>
                        <MenuItem value="waste_management_system">Waste Management System</MenuItem>
                        <MenuItem value="water_treatment_facility">Water Treatment Facility</MenuItem>
                        <MenuItem value="green_equipment_purchase">Green Equipment Purchase</MenuItem>
                        <MenuItem value="carbon_offset_projects">Carbon Offset Projects</MenuItem>
                        <MenuItem value="sustainable_manufacturing">Sustainable Manufacturing</MenuItem>
                        <MenuItem value="other_green_initiatives">Other Green Initiatives</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Project Description"
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="expectedCarbonReduction"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Expected Carbon Reduction (kg CO₂)"
                      error={!!errors.expectedCarbonReduction}
                      helperText={errors.expectedCarbonReduction?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="expectedPaybackPeriod"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Expected Payback Period (months)"
                      error={!!errors.expectedPaybackPeriod}
                      helperText={errors.expectedPaybackPeriod?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenApplicationDialog(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isApplying}
              startIcon={isApplying ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isApplying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Loan Details Dialog */}
      <Dialog open={openLoanDetailsDialog} onClose={() => setOpenLoanDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Loan Details</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Loan Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Bank"
                        secondary={selectedLoan.bankId.bankName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Purpose"
                        secondary={getPurposeLabel(selectedLoan.loanApplication.purpose)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Loan Amount"
                        secondary={formatCurrency(selectedLoan.loanApplication.loanAmount)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={selectedLoan.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(selectedLoan.status) as any}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Loan Terms
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Approved Amount"
                        secondary={formatCurrency(selectedLoan.loanTerms.approvedAmount)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Interest Rate"
                        secondary={`${selectedLoan.loanTerms.finalInterestRate}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Tenure"
                        secondary={`${selectedLoan.loanTerms.tenure} months`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="EMI Amount"
                        secondary={formatCurrency(selectedLoan.loanTerms.emiAmount)}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Carbon Assessment
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {selectedLoan.carbonAssessment.currentCarbonScore}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Carbon Score
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {selectedLoan.carbonAssessment.carbonSavings.savingsPercentage.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Carbon Reduction
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {selectedLoan.carbonAssessment.currentCO2Emissions.toFixed(0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          CO₂ Emissions (kg)
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Project Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLoan.loanApplication.description}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoanDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GreenLoans;