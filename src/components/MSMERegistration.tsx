import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  CircularProgress,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CheckCircleOutline as SuccessIcon } from '@mui/icons-material';
import ApiService from '../services/api';
import { MSMERegistrationData, useRegistration } from '../context/RegistrationContext';

// Validation schema for MSME registration
const createRegistrationSchema = () =>
  yup.object({
    // Basic Company Information
    companyName: yup.string().required('Company name is required'),
    companyType: yup.string().required('Company type is required'),
    industry: yup.string().required('Industry is required'),
    businessDomain: yup.string().required('Business domain is required'),
    establishmentYear: yup
      .number()
      .typeError('Establishment year is required')
      .required('Establishment year is required')
      .min(1900, 'Invalid year')
      .max(new Date().getFullYear(), 'Year cannot be in the future'),

    // MSME Registration Details
    udyamRegistrationNumber: yup
      .string()
      .required('UDYAM Registration Number is required')
      .matches(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/, 'Invalid UDYAM Registration Number format'),
    gstNumber: yup
      .string()
      .required('GST Number is required')
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST Number format'),
    panNumber: yup
      .string()
      .required('PAN Number is required')
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Number format'),

    // Contact Information
    email: yup.string().email('Invalid email format').required('Email is required'),
    phone: yup
      .string()
      .required('Phone number is required')
      .matches(/^[6-9]\d{9}$/, 'Invalid phone number format'),

    // Address Information
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    pincode: yup
      .string()
      .required('Pincode is required')
      .matches(/^[1-9][0-9]{5}$/, 'Invalid pincode format'),
    country: yup.string().required('Country is required'),

    // Business Details
    annualTurnover: yup
      .number()
      .typeError('Annual turnover is required')
      .required('Annual turnover is required')
      .min(0, 'Turnover cannot be negative'),
    numberOfEmployees: yup
      .number()
      .typeError('Number of employees is required')
      .required('Number of employees is required')
      .min(1, 'Must have at least 1 employee'),

    // Manufacturing Details
    manufacturingUnits: yup
      .number()
      .typeError('Number of manufacturing units is required')
      .required('Number of manufacturing units is required')
      .min(1, 'Must have at least 1 unit'),
    primaryProducts: yup.string().required('Primary products/services is required'),

    // Environmental Compliance
    hasEnvironmentalClearance: yup.boolean().required(),
    hasPollutionControlBoard: yup.boolean().required(),
    hasWasteManagement: yup.boolean().required(),

    // Terms and Conditions
    agreeToTerms: yup.boolean().oneOf([true], 'You must agree to the terms and conditions').required(),
    agreeToDataProcessing: yup
      .boolean()
      .oneOf([true], 'You must agree to data processing terms')
      .required(),

    // Account Credentials
    password: yup
      .string()
      .trim()
      .when('$isEditing', {
        is: true,
        then: (schema) =>
          schema
            .transform((value) => (value === '' ? undefined : value))
            .notRequired()
            .min(6, 'Password must be at least 6 characters'),
        otherwise: (schema) =>
          schema.min(6, 'Password must be at least 6 characters').required('Password is required'),
      }),
    confirmPassword: yup
      .string()
      .trim()
      .transform((value) => (value === '' ? undefined : value))
      .when('$isEditing', {
        is: true,
        then: (schema) =>
          schema.when('password', {
            is: (password: string | undefined) => !password,
            then: (confirmSchema) => confirmSchema.notRequired(),
            otherwise: (confirmSchema) =>
              confirmSchema
                .oneOf([yup.ref('password')], 'Passwords must match')
                .required('Confirm password is required when updating password'),
          }),
        otherwise: (schema) =>
          schema
            .required('Confirm password is required')
            .oneOf([yup.ref('password')], 'Passwords must match'),
      }),
  });

type MSMERegistrationForm = MSMERegistrationData & {
  password?: string;
  confirmPassword?: string;
};

const steps = [
  'Company Information',
  'MSME Registration Details',
  'Contact & Address',
  'Business Details',
  'Environmental Compliance',
  'Account Setup & Review'
];

const MSMERegistration: React.FC = () => {
  const navigate = useNavigate();
  const {
    isRegistered,
    hasCompletedRegistration,
    registrationData,
    completeRegistration,
    login,
    logout,
    resetRegistration,
  } = useRegistration();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const defaultValues = useMemo<Partial<MSMERegistrationForm>>(() => ({
    companyName: '',
    companyType: '',
    industry: '',
    businessDomain: '',
    establishmentYear: undefined,
    udyamRegistrationNumber: '',
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
    agreeToDataProcessing: false,
    password: '',
    confirmPassword: ''
  }), []);

  const isEditingRef = useRef(isEditing);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const resolver = useCallback(
    (data: MSMERegistrationForm, context: any, options: any) =>
      yupResolver<MSMERegistrationForm>(createRegistrationSchema(), {
        context: { isEditing: isEditingRef.current },
      })(data, context, options),
    []
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    reset
  } = useForm<MSMERegistrationForm>({
    resolver,
    defaultValues
  });

  const scrollToTop = () => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (registrationData?.email) {
      setLoginEmail(registrationData.email);
    }
  }, [registrationData]);

  useEffect(() => {
    if (!isRegistered && !isEditing) {
      setActiveStep(0);
      reset(defaultValues);
    }

    if (isRegistered && !isEditing) {
      setActiveStep(steps.length);
    }
  }, [isRegistered, isEditing, reset, defaultValues]);

  const registrationSuccess = isRegistered && Boolean(registrationData);
  const shouldShowSuccess = registrationSuccess && !isEditing;
  const showLoginForm = hasCompletedRegistration && !isRegistered;

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setIsLoggingIn(true);

    try {
      await login(loginEmail, loginPassword);
      setLoginPassword('');
      scrollToTop();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetStoredRegistration = () => {
    setSubmitError(null);
    resetRegistration();
    setLoginEmail('');
    setLoginPassword('');
    setLoginError(null);
    setIsEditing(false);
    setActiveStep(0);
    reset(defaultValues);
    scrollToTop();
  };

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
        return ['udyamRegistrationNumber', 'gstNumber', 'panNumber'];
      case 2:
        return ['email', 'phone', 'address', 'city', 'state', 'pincode', 'country'];
      case 3:
        return ['annualTurnover', 'numberOfEmployees', 'manufacturingUnits', 'primaryProducts'];
      case 4:
        return ['hasEnvironmentalClearance', 'hasPollutionControlBoard', 'hasWasteManagement'];
      case 5:
      {
        const fields: (keyof MSMERegistrationForm)[] = ['agreeToTerms', 'agreeToDataProcessing'];

        if (!isEditing) {
          fields.unshift('confirmPassword');
          fields.unshift('password');
        }

        return fields;
      }
      default:
        return [];
    }
  };

  const sanitizeRegistrationData = (data: MSMERegistrationForm): MSMERegistrationData => {
    const {
      password,
      confirmPassword,
      ...rest
    } = data;

    return {
      ...rest,
    };
  };

  const buildMsmeProfilePayload = (data: MSMERegistrationData) => ({
    companyName: data.companyName,
    companyType: data.companyType,
    industry: data.industry,
    businessDomain: data.businessDomain,
    establishmentYear: data.establishmentYear,
    udyamRegistrationNumber: data.udyamRegistrationNumber,
    gstNumber: data.gstNumber,
    panNumber: data.panNumber,
    contact: {
      email: data.email,
      phone: data.phone,
      address: {
        street: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
      },
    },
    business: {
      annualTurnover: data.annualTurnover,
      numberOfEmployees: data.numberOfEmployees,
      manufacturingUnits: data.manufacturingUnits,
      primaryProducts: data.primaryProducts,
    },
    environmentalCompliance: {
      hasEnvironmentalClearance: data.hasEnvironmentalClearance,
      hasPollutionControlBoard: data.hasPollutionControlBoard,
      hasWasteManagement: data.hasWasteManagement,
    },
  });

  const onSubmit = async (data: MSMERegistrationForm) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const sanitizedData = sanitizeRegistrationData(data);

    try {
      if (isEditing) {
        const profileResponse = await ApiService.updateMSMEProfile(
          buildMsmeProfilePayload(sanitizedData)
        );

        if (!profileResponse?.success) {
          throw new Error(profileResponse?.message || 'Unable to update MSME profile.');
        }

        completeRegistration(sanitizedData);
        setIsEditing(false);
        setActiveStep(steps.length);
        reset({ ...sanitizedData, password: '', confirmPassword: '' });
        scrollToTop();
        return;
      }

      const registerResponse = await ApiService.register({
        email: data.email,
        password: data.password,
        role: 'msme',
        profile: {
          companyName: data.companyName,
          businessDomain: data.businessDomain,
        },
      });

      if (!registerResponse?.success) {
        throw new Error(registerResponse?.message || 'Registration failed. Please try again.');
      }

      const token = registerResponse?.data?.token;

      if (!token) {
        throw new Error('Registration failed. Authentication token missing in response.');
      }

      try {
        localStorage.setItem('token', token);
      } catch (storageError) {
        console.warn('Unable to persist authentication token after registration.', storageError);
      }

      const profileResponse = await ApiService.updateMSMEProfile(
        buildMsmeProfilePayload(sanitizedData)
      );

      if (!profileResponse?.success) {
        throw new Error(profileResponse?.message || 'Unable to complete MSME profile setup.');
      }

      completeRegistration(sanitizedData, token);
      setIsEditing(false);
      setActiveStep(steps.length);
      reset({ ...sanitizedData, password: '', confirmPassword: '' });
      scrollToTop();
    } catch (error) {
      if (!isEditing && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('token');
        } catch (cleanupError) {
          console.warn('Unable to clear authentication token after failed registration.', cleanupError);
        }
      }

      setSubmitError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRegistration = () => {
    setSubmitError(null);
    setIsEditing(true);
    setActiveStep(0);
    const currentData = registrationData
      ? { ...registrationData, password: '', confirmPassword: '' }
      : defaultValues;

    reset(currentData);

    scrollToTop();
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
                name="udyamRegistrationNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="UDYAM Registration Number"
                    placeholder="UDYAM-XX-00-0000000"
                    error={!!errors.udyamRegistrationNumber}
                    helperText={errors.udyamRegistrationNumber?.message || "Format: UDYAM-XX-00-0000000"}
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
                    helperText={
                      errors.email?.message || (isEditing ? 'Account email cannot be updated here.' : undefined)
                    }
                    disabled={isEditing}
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
                    label="Annual Turnover (?)"
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
                {isEditing ? 'Review & Submit Updates' : 'Account Setup & Review'}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {isEditing
                  ? 'Review your registration details and submit any updates to keep your profile current.'
                  : 'Create your account password and review your information before submitting.'}
              </Typography>
            </Grid>
            {!isEditing && (
              <>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="password"
                        label="Account Password"
                        autoComplete="new-password"
                        error={!!errors.password}
                        helperText={errors.password?.message || 'Minimum 6 characters'}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="password"
                        label="Confirm Password"
                        autoComplete="new-password"
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
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

  const renderSuccessState = () => {
    if (!registrationData) {
      return null;
    }

    const summaryItems = [
      {
        label: 'Company Name',
        value: registrationData.companyName || 'Not provided',
      },
      {
        label: 'Industry',
        value: registrationData.industry || 'Not provided',
      },
      {
        label: 'Company Type',
        value: registrationData.companyType ? registrationData.companyType.toUpperCase() : 'Not provided',
      },
      {
        label: 'GST Number',
        value: registrationData.gstNumber || 'Not provided',
      },
      {
        label: 'UDYAM Registration',
        value: registrationData.udyamRegistrationNumber || 'Not provided',
      },
      {
        label: 'Primary Products/Services',
        value: registrationData.primaryProducts || 'Not provided',
      },
    ];

    return (
      <>
        <Alert
          icon={<SuccessIcon fontSize="inherit" />}
          severity="success"
          sx={{ mb: 3 }}
        >
          Registration completed successfully for <strong>{registrationData.companyName}</strong>. Your sustainability toolkit is now unlocked.
        </Alert>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <SuccessIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
            You're all set!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto' }}>
            Explore your dashboard, run a carbon assessment, and discover recommendations tailored to <strong>{registrationData.companyName}</strong>.
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {summaryItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.label}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.04) 0%, rgba(46, 125, 50, 0.05) 100%)',
                  border: '1px solid rgba(76, 175, 80, 0.08)',
                  textAlign: 'left',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {item.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {item.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ mb: 2 }}
        >
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              minWidth: 200,
              py: 1.5,
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
              },
            }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/carbon-footprint')}
            sx={{ minWidth: 200, py: 1.5 }}
          >
            Start Carbon Assessment
          </Button>
          <Button
            variant="text"
            onClick={handleEditRegistration}
            sx={{ minWidth: 200, py: 1.5 }}
          >
            Update Registration Details
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              logout();
              setLoginPassword('');
              setLoginError(null);
              navigate('/');
            }}
            sx={{ minWidth: 200, py: 1.5 }}
          >
            Logout
          </Button>
        </Stack>
      </>
    );
  };

  if (showLoginForm) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 6,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid rgba(76, 175, 80, 0.1)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Welcome Back
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto' }}>
            Sign in to continue exploring your Carbon Intelligence dashboard.
          </Typography>
        </Box>

        {registrationData && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your account is registered for <strong>{registrationData.companyName}</strong>. Use <strong>{registrationData.email}</strong> to log in.
          </Alert>
        )}

        <Box
          component="form"
          noValidate
          onSubmit={handleLoginSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            fullWidth
            autoComplete="email"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            fullWidth
            autoComplete="current-password"
            required
          />

          {loginError && (
            <Alert severity="error">
              {loginError}
            </Alert>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="flex-start"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mt: 1 }}
          >
            <Button
              type="submit"
              variant="contained"
              disabled={isLoggingIn}
              startIcon={isLoggingIn ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ minWidth: 160, py: 1.5 }}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </Button>
            <Button
              variant="text"
              onClick={handleResetStoredRegistration}
              sx={{ minWidth: 160, py: 1.5 }}
            >
              Start New Registration
            </Button>
          </Stack>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 6,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(76, 175, 80, 0.1)'
      }}
    >
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

      <Stepper activeStep={shouldShowSuccess ? steps.length : activeStep} sx={{ 
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

      {submitError && !shouldShowSuccess && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      {shouldShowSuccess ? (
        renderSuccessState()
      ) : (
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
      )}
    </Paper>
  );
};

export default MSMERegistration;