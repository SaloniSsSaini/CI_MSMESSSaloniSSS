import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Validation schema for MSME registration
const msmeRegistrationSchema = yup.object({
  // Basic Company Information
  companyName: yup.string().required('Company name is required'),
  companyType: yup.string().required('Company type is required'),
  industry: yup.string().required('Industry is required'),
  businessDomain: yup.string().required('Business domain is required'),
  establishmentYear: yup.number()
    .required('Establishment year is required')
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  
  // MSME Registration Details
  udyogAadharNumber: yup.string()
    .required('Udyog Aadhar Number is required')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, 'Invalid Udyog Aadhar Number format'),
  gstNumber: yup.string()
    .required('GST Number is required')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST Number format'),
  panNumber: yup.string()
    .required('PAN Number is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Number format'),
  
  // Contact Information
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[6-9]\d{9}$/, 'Invalid phone number format'),
  
  // Address Information
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pincode: yup.string()
    .required('Pincode is required')
    .matches(/^[1-9][0-9]{5}$/, 'Invalid pincode format'),
  country: yup.string().required('Country is required'),
  
  // Business Details
  annualTurnover: yup.number()
    .required('Annual turnover is required')
    .min(0, 'Turnover cannot be negative'),
  numberOfEmployees: yup.number()
    .required('Number of employees is required')
    .min(1, 'Must have at least 1 employee'),
  
  // Manufacturing Details
  manufacturingUnits: yup.number()
    .required('Number of manufacturing units is required')
    .min(1, 'Must have at least 1 unit'),
  primaryProducts: yup.string().required('Primary products/services is required'),
  
  // Environmental Compliance
  hasEnvironmentalClearance: yup.boolean(),
  hasPollutionControlBoard: yup.boolean(),
  hasWasteManagement: yup.boolean(),
  
  // Terms and Conditions
  agreeToTerms: yup.boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
  agreeToDataProcessing: yup.boolean()
    .oneOf([true], 'You must agree to data processing terms')
});

type MSMERegistrationForm = yup.InferType<typeof msmeRegistrationSchema>;

const steps = [
  'Company Information',
  'MSME Registration Details',
  'Contact & Address',
  'Business Details',
  'Environmental Compliance',
  'Review & Submit'
];

const MSMERegistration: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger
  } = useForm<MSMERegistrationForm>({
    resolver: yupResolver(msmeRegistrationSchema),
    defaultValues: {
      companyName: '',
      companyType: '',
      industry: '',
      businessDomain: '',
      establishmentYear: undefined,
      udyogAadharNumber: '',
      gstNumber: '',
      panNumber: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      annualTurnover: undefined,
      numberOfEmployees: undefined,
      manufacturingUnits: undefined,
      primaryProducts: '',
      hasEnvironmentalClearance: false,
      hasPollutionControlBoard: false,
      hasWasteManagement: false,
      agreeToTerms: false,
      agreeToDataProcessing: false
    }
  });

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getFieldsForStep = (step: number): (keyof MSMERegistrationForm)[] => {
    switch (step) {
      case 0:
        return ['companyName', 'companyType', 'industry', 'businessDomain', 'establishmentYear'];
      case 1:
        return ['udyogAadharNumber', 'gstNumber', 'panNumber'];
      case 2:
        return ['email', 'phone', 'address', 'city', 'state', 'pincode', 'country'];
      case 3:
        return ['annualTurnover', 'numberOfEmployees', 'manufacturingUnits', 'primaryProducts'];
      case 4:
        return ['hasEnvironmentalClearance', 'hasPollutionControlBoard', 'hasWasteManagement'];
      case 5:
        return ['agreeToTerms', 'agreeToDataProcessing'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: MSMERegistrationForm) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store registration data in localStorage for demo purposes
      localStorage.setItem('msmeRegistration', JSON.stringify(data));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      setSubmitError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Company Name"
                    error={!!errors.companyName}
                    helperText={errors.companyName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="companyType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.companyType}>
                    <InputLabel>Company Type</InputLabel>
                    <Select {...field} label="Company Type">
                      <MenuItem value="micro">Micro Enterprise</MenuItem>
                      <MenuItem value="small">Small Enterprise</MenuItem>
                      <MenuItem value="medium">Medium Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="industry"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.industry}>
                    <InputLabel>Industry</InputLabel>
                    <Select {...field} label="Industry">
                      <MenuItem value="manufacturing">Manufacturing</MenuItem>
                      <MenuItem value="textiles">Textiles</MenuItem>
                      <MenuItem value="food">Food Processing</MenuItem>
                      <MenuItem value="chemicals">Chemicals</MenuItem>
                      <MenuItem value="electronics">Electronics</MenuItem>
                      <MenuItem value="automotive">Automotive</MenuItem>
                      <MenuItem value="pharmaceuticals">Pharmaceuticals</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="businessDomain"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.businessDomain}>
                    <InputLabel>Business Domain</InputLabel>
                    <Select {...field} label="Business Domain">
                      <MenuItem value="manufacturing">Manufacturing</MenuItem>
                      <MenuItem value="trading">Trading</MenuItem>
                      <MenuItem value="services">Services</MenuItem>
                      <MenuItem value="export_import">Export/Import</MenuItem>
                      <MenuItem value="retail">Retail</MenuItem>
                      <MenuItem value="wholesale">Wholesale</MenuItem>
                      <MenuItem value="e_commerce">E-Commerce</MenuItem>
                      <MenuItem value="consulting">Consulting</MenuItem>
                      <MenuItem value="logistics">Logistics & Transportation</MenuItem>
                      <MenuItem value="agriculture">Agriculture & Allied</MenuItem>
                      <MenuItem value="handicrafts">Handicrafts & Artisans</MenuItem>
                      <MenuItem value="food_processing">Food Processing</MenuItem>
                      <MenuItem value="textiles">Textiles & Garments</MenuItem>
                      <MenuItem value="electronics">Electronics & IT</MenuItem>
                      <MenuItem value="automotive">Automotive & Engineering</MenuItem>
                      <MenuItem value="construction">Construction & Real Estate</MenuItem>
                      <MenuItem value="healthcare">Healthcare & Pharmaceuticals</MenuItem>
                      <MenuItem value="education">Education & Training</MenuItem>
                      <MenuItem value="tourism">Tourism & Hospitality</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="establishmentYear"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Establishment Year"
                    error={!!errors.establishmentYear}
                    helperText={errors.establishmentYear?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                MSME Registration Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="udyogAadharNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Udyog Aadhar Number"
                    placeholder="XX00XX0000"
                    error={!!errors.udyogAadharNumber}
                    helperText={errors.udyogAadharNumber?.message || "Format: XX00XX0000"}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="gstNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="GST Number"
                    placeholder="00XXXXX0000X0X"
                    error={!!errors.gstNumber}
                    helperText={errors.gstNumber?.message || "Format: 00XXXXX0000X0X"}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="panNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="PAN Number"
                    placeholder="XXXXX0000X"
                    error={!!errors.panNumber}
                    helperText={errors.panNumber?.message || "Format: XXXXX0000X"}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact & Address Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="email"
                    label="Email Address"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    placeholder="9876543210"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Address"
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="City"
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="State"
                    error={!!errors.state}
                    helperText={errors.state?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="pincode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Pincode"
                    error={!!errors.pincode}
                    helperText={errors.pincode?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Country"
                    error={!!errors.country}
                    helperText={errors.country?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Business Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="annualTurnover"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Annual Turnover (₹)"
                    error={!!errors.annualTurnover}
                    helperText={errors.annualTurnover?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="numberOfEmployees"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Number of Employees"
                    error={!!errors.numberOfEmployees}
                    helperText={errors.numberOfEmployees?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="manufacturingUnits"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Number of Manufacturing Units"
                    error={!!errors.manufacturingUnits}
                    helperText={errors.manufacturingUnits?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="primaryProducts"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Primary Products/Services"
                    error={!!errors.primaryProducts}
                    helperText={errors.primaryProducts?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Environmental Compliance
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="hasEnvironmentalClearance"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Environmental Clearance Certificate"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="hasPollutionControlBoard"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Registered with State Pollution Control Board"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="hasWasteManagement"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Waste Management System"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review & Submit
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review your information and agree to the terms and conditions.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="agreeToTerms"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="I agree to the Terms and Conditions"
                  />
                )}
              />
              {errors.agreeToTerms && (
                <Typography color="error" variant="caption">
                  {errors.agreeToTerms.message}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="agreeToDataProcessing"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="I agree to the data processing and privacy policy"
                  />
                )}
              />
              {errors.agreeToDataProcessing && (
                <Typography color="error" variant="caption">
                  {errors.agreeToDataProcessing.message}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper elevation={2} sx={{ 
      p: 6, 
      borderRadius: 3,
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid rgba(76, 175, 80, 0.1)'
    }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}>
          MSME Registration
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ 
          maxWidth: 600, 
          mx: 'auto',
          lineHeight: 1.6
        }}>
          Register your MSME company to measure carbon footprint and get sustainable manufacturing recommendations
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ 
        mb: 4,
        '& .MuiStepLabel-root': {
          '& .MuiStepLabel-label': {
            fontWeight: 500,
            fontSize: '0.875rem'
          }
        },
        '& .MuiStepIcon-root': {
          '&.Mui-completed': {
            color: 'success.main'
          },
          '&.Mui-active': {
            color: 'primary.main'
          }
        }
      }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          pt: 3,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            sx={{ 
              mr: 1,
              minWidth: 120,
              py: 1.5
            }}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                sx={{
                  minWidth: 180,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  minWidth: 120,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
                  }
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default MSMERegistration;