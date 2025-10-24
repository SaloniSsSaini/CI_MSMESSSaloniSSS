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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Park as EcoIcon,
  Engineering as EngineeringIcon,
  Computer as ComputerIcon,
  Lightbulb as LightbulbIcon,
  Factory as FactoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface GIFTScheme {
  _id: string;
  schemeName: string;
  schemeCode: string;
  description: string;
  category: string;
  eligibilityCriteria: {
    minCarbonScore: number;
    minAnnualTurnover: number;
    maxAnnualTurnover: number;
    companyTypes: string[];
    industries: string[];
    requiredCertifications: string[];
    minEmployees: number;
    maxEmployees: number;
  };
  benefits: {
    incentiveType: string;
    incentiveAmount: number;
    incentivePercentage?: number;
    maxIncentiveAmount?: number;
    description: string;
  };
  applicationProcess: {
    requiredDocuments: string[];
    applicationFee: number;
    processingTime: number;
    validityPeriod: number;
  };
  status: string;
  startDate: string;
  endDate: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const GIFTSchemes: React.FC = () => {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<GIFTScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<GIFTScheme | null>(null);
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const categories = [
    { value: 'technology', label: 'Technology', icon: <ComputerIcon /> },
    { value: 'energy', label: 'Energy', icon: <EcoIcon /> },
    { value: 'environment', label: 'Environment', icon: <EcoIcon /> },
    { value: 'manufacturing', label: 'Manufacturing', icon: <FactoryIcon /> },
    { value: 'innovation', label: 'Innovation', icon: <LightbulbIcon /> },
    { value: 'digital', label: 'Digital', icon: <EngineeringIcon /> }
  ];

  useEffect(() => {
    fetchSchemes();
  }, [searchTerm, categoryFilter, pagination.current]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '9'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/gift-schemes?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchemes(data.data.schemes);
        setPagination({
          current: data.data.pagination.current,
          pages: data.data.pagination.pages,
          total: data.data.pagination.total
        });
      } else {
        setError(data.message || 'Failed to fetch GIFT schemes');
      }
    } catch (err) {
      setError('Failed to fetch GIFT schemes');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (schemeId: string) => {
    try {
      const response = await fetch(`/api/gift-schemes/${schemeId}/eligibility`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setEligibilityData(data.data);
        setEligibilityDialogOpen(true);
      } else {
        setError(data.message || 'Failed to check eligibility');
      }
    } catch (err) {
      setError('Failed to check eligibility');
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryObj = categories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.icon : <InfoIcon />;
  };

  const getIncentiveTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'subsidy': 'Subsidy',
      'grant': 'Grant',
      'tax_benefit': 'Tax Benefit',
      'loan_subsidy': 'Loan Subsidy',
      'equipment_subsidy': 'Equipment Subsidy'
    };
    return labels[type] || type;
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

  const isSchemeActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
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
      <Typography variant="h4" gutterBottom>
        GIFT Schemes
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Government Incentive for Technology schemes to support MSMEs in adopting sustainable technologies
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
                placeholder="Search schemes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {category.icon}
                        <Typography sx={{ ml: 1 }}>{category.label}</Typography>
                      </Box>
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
                onClick={fetchSchemes}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Schemes Grid */}
      <Grid container spacing={3}>
        {schemes.map((scheme) => (
          <Grid item xs={12} md={6} lg={4} key={scheme._id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getCategoryIcon(scheme.category)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {scheme.schemeName}
                    </Typography>
                  </Box>
                  <Chip
                    label={scheme.status}
                    color={scheme.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {scheme.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Benefits:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {getIncentiveTypeLabel(scheme.benefits.incentiveType)}: {formatCurrency(scheme.benefits.incentiveAmount)}
                    </Typography>
                  </Box>
                  {scheme.benefits.incentivePercentage && (
                    <Typography variant="body2" color="text.secondary">
                      Up to {scheme.benefits.incentivePercentage}% of project cost
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Eligibility:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Min Carbon Score: {scheme.eligibilityCriteria.minCarbonScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Turnover: {formatCurrency(scheme.eligibilityCriteria.minAnnualTurnover)} - {formatCurrency(scheme.eligibilityCriteria.maxAnnualTurnover)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Validity:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(scheme.startDate)} - {formatDate(scheme.endDate)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {isSchemeActive(scheme.startDate, scheme.endDate) ? (
                      <CheckCircleIcon sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                    ) : (
                      <CancelIcon sx={{ mr: 1, color: 'error.main', fontSize: 16 }} />
                    )}
                    <Typography variant="body2" color={isSchemeActive(scheme.startDate, scheme.endDate) ? 'success.main' : 'error.main'}>
                      {isSchemeActive(scheme.startDate, scheme.endDate) ? 'Currently Active' : 'Inactive'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 1 }}
                  onClick={() => checkEligibility(scheme._id)}
                >
                  Check Eligibility
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(`/gift-schemes/${scheme._id}`)}
                  disabled={!isSchemeActive(scheme.startDate, scheme.endDate)}
                >
                  View Details
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

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

      {/* Eligibility Dialog */}
      <Dialog
        open={eligibilityDialogOpen}
        onClose={() => setEligibilityDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Eligibility Check Results</DialogTitle>
        <DialogContent>
          {eligibilityData && (
            <Box>
              <Alert 
                severity={eligibilityData.isEligible ? 'success' : 'warning'} 
                sx={{ mb: 2 }}
              >
                {eligibilityData.isEligible 
                  ? 'Congratulations! You are eligible for this GIFT scheme.' 
                  : 'You are not eligible for this GIFT scheme. Please check the criteria below.'
                }
              </Alert>

              <Typography variant="h6" gutterBottom>
                Eligibility Criteria:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Carbon Score"
                    secondary={`Required: ${eligibilityData.criteria.carbonScore.required}, Current: ${eligibilityData.criteria.carbonScore.current}`}
                  />
                  {eligibilityData.criteria.carbonScore.passed ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Annual Turnover"
                    secondary={`Required: ${formatCurrency(eligibilityData.criteria.annualTurnover.required.min)} - ${formatCurrency(eligibilityData.criteria.annualTurnover.required.max)}, Current: ${formatCurrency(eligibilityData.criteria.annualTurnover.current)}`}
                  />
                  {eligibilityData.criteria.annualTurnover.passed ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Company Type"
                    secondary={`Required: ${eligibilityData.criteria.companyType.required.join(', ')}, Current: ${eligibilityData.criteria.companyType.current}`}
                  />
                  {eligibilityData.criteria.companyType.passed ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Number of Employees"
                    secondary={`Required: ${eligibilityData.criteria.employees.required.min} - ${eligibilityData.criteria.employees.required.max}, Current: ${eligibilityData.criteria.employees.current}`}
                  />
                  {eligibilityData.criteria.employees.passed ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEligibilityDialogOpen(false)}>
            Close
          </Button>
          {eligibilityData?.isEligible && (
            <Button 
              variant="contained" 
              onClick={() => {
                setEligibilityDialogOpen(false);
                // Navigate to application form
                navigate('/gift-applications/new');
              }}
            >
              Apply Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GIFTSchemes;
