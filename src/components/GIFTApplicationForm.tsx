import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Validation schema for GIFT application
const giftApplicationSchema = yup.object({
  schemeId: yup.string().required('Scheme selection is required'),
  projectDetails: yup.object({
    projectName: yup.string().required('Project name is required'),
    projectDescription: yup.string().required('Project description is required'),
    projectCategory: yup.string().required('Project category is required'),
    projectValue: yup.number().required('Project value is required').min(0, 'Project value must be positive'),
    expectedCarbonReduction: yup.number().required('Expected carbon reduction is required').min(0, 'Carbon reduction must be positive'),
    projectDuration: yup.number().required('Project duration is required').min(1, 'Duration must be at least 1 month'),
    startDate: yup.date().required('Start date is required'),
    endDate: yup.date().required('End date is required')
  }),
  financialDetails: yup.object({
    totalProjectCost: yup.number().required('Total project cost is required').min(0, 'Cost must be positive'),
    requestedIncentiveAmount: yup.number().required('Requested incentive amount is required').min(0, 'Amount must be positive'),
    ownContribution: yup.number().required('Own contribution is required').min(0, 'Contribution must be positive'),
    bankLoanAmount: yup.number().min(0, 'Loan amount must be positive'),
    otherSources: yup.number().min(0, 'Other sources must be positive')
  })
});

type GIFTApplicationForm = yup.InferType<typeof giftApplicationSchema>;

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
}

const steps = [
  'Select Scheme',
  'Project Details',
  'Financial Details',
  'Documents',
  'Review & Submit'
];

const GIFTApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const { schemeId } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<GIFTScheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<GIFTScheme | null>(null);
  const [documents, setDocuments] = useState<Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
  }>>([]);
  const [milestones, setMilestones] = useState<Array<{
    milestoneName: string;
    description: string;
    targetDate: string;
  }>>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue
  } = useForm<GIFTApplicationForm>({
    resolver: yupResolver(giftApplicationSchema),
    defaultValues: {
      schemeId: schemeId || '',
      projectDetails: {
        projectName: '',
        projectDescription: '',
        projectCategory: '',
        projectValue: 0,
        expectedCarbonReduction: 0,
        projectDuration: 1,
        startDate: '',
        endDate: ''
      },
      financialDetails: {
        totalProjectCost: 0,
        requestedIncentiveAmount: 0,
        ownContribution: 0,
        bankLoanAmount: 0,
        otherSources: 0
      }
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchSchemes();
    if (schemeId) {
      fetchSchemeDetails(schemeId);
    }
  }, [schemeId]);

  const fetchSchemes = async () => {
    try {
      const response = await fetch('/api/gift-schemes?status=active');
      const data = await response.json();
      if (data.success) {
        setSchemes(data.data.schemes);
      }
    } catch (error) {
      console.error('Failed to fetch schemes:', error);
    }
  };

  const fetchSchemeDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/gift-schemes/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedScheme(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch scheme details:', error);
    }
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

  const getFieldsForStep = (step: number): (keyof GIFTApplicationForm)[] => {
    switch (step) {
      case 0:
        return ['schemeId'];
      case 1:
        return ['projectDetails'];
      case 2:
        return ['financialDetails'];
      case 3:
        return [];
      case 4:
        return [];
      default:
        return [];
    }
  };

  const addDocument = () => {
    setDocuments([...documents, {
      documentType: '',
      documentName: '',
      documentUrl: ''
    }]);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: string, value: string) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    setDocuments(updated);
  };

  const addMilestone = () => {
    setMilestones([...milestones, {
      milestoneName: '',
      description: '',
      targetDate: ''
    }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const onSubmit = async (data: GIFTApplicationForm) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const applicationData = {
        ...data,
        documents,
        milestones
      };

      const response = await fetch('/api/gift-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(applicationData)
      });

      const result = await response.json();

      if (result.success) {
        navigate('/gift-applications');
      } else {
        setSubmitError(result.message || 'Application submission failed');
      }
    } catch (error) {
      setSubmitError('Application submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select GIFT Scheme
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="schemeId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.schemeId}>
                    <InputLabel>GIFT Scheme</InputLabel>
                    <Select {...field} label="GIFT Scheme">
                      {schemes.map((scheme) => (
                        <MenuItem key={scheme._id} value={scheme._id}>
                          <Box>
                            <Typography variant="subtitle1">{scheme.schemeName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {scheme.description}
                            </Typography>
                            <Typography variant="body2" color="primary">
                              {formatCurrency(scheme.benefits.incentiveAmount)} {scheme.benefits.incentiveType}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              {errors.schemeId && (
                <Typography color="error" variant="caption">
                  {errors.schemeId.message}
                </Typography>
              )}
            </Grid>
            
            {selectedScheme && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Scheme Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Scheme Code:</strong> {selectedScheme.schemeCode}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Category:</strong> {selectedScheme.category}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Benefits:</strong> {selectedScheme.benefits.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Required Documents:</strong>
                        </Typography>
                        <List dense>
                          {selectedScheme.applicationProcess.requiredDocuments.map((doc, index) => (
                            <ListItem key={index} sx={{ py: 0 }}>
                              <ListItemIcon>
                                <AttachFileIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={doc} />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Project Details
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="projectDetails.projectName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Project Name"
                    error={!!errors.projectDetails?.projectName}
                    helperText={errors.projectDetails?.projectName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="projectDetails.projectDescription"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Project Description"
                    error={!!errors.projectDetails?.projectDescription}
                    helperText={errors.projectDetails?.projectDescription?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectDetails.projectCategory"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.projectDetails?.projectCategory}>
                    <InputLabel>Project Category</InputLabel>
                    <Select {...field} label="Project Category">
                      <MenuItem value="technology">Technology</MenuItem>
                      <MenuItem value="energy">Energy</MenuItem>
                      <MenuItem value="environment">Environment</MenuItem>
                      <MenuItem value="manufacturing">Manufacturing</MenuItem>
                      <MenuItem value="innovation">Innovation</MenuItem>
                      <MenuItem value="digital">Digital</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectDetails.projectValue"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Project Value (₹)"
                    error={!!errors.projectDetails?.projectValue}
                    helperText={errors.projectDetails?.projectValue?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectDetails.expectedCarbonReduction"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Expected Carbon Reduction (tons CO2)"
                    error={!!errors.projectDetails?.expectedCarbonReduction}
                    helperText={errors.projectDetails?.expectedCarbonReduction?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectDetails.projectDuration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Project Duration (months)"
                    error={!!errors.projectDetails?.projectDuration}
                    helperText={errors.projectDetails?.projectDuration?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectDetails.startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Start Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.projectDetails?.startDate}
                    helperText={errors.projectDetails?.startDate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectDetails.endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="End Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.projectDetails?.endDate}
                    helperText={errors.projectDetails?.endDate?.message}
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
                Financial Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="financialDetails.totalProjectCost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Total Project Cost (₹)"
                    error={!!errors.financialDetails?.totalProjectCost}
                    helperText={errors.financialDetails?.totalProjectCost?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="financialDetails.requestedIncentiveAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Requested Incentive Amount (₹)"
                    error={!!errors.financialDetails?.requestedIncentiveAmount}
                    helperText={errors.financialDetails?.requestedIncentiveAmount?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="financialDetails.ownContribution"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Own Contribution (₹)"
                    error={!!errors.financialDetails?.ownContribution}
                    helperText={errors.financialDetails?.ownContribution?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="financialDetails.bankLoanAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Bank Loan Amount (₹)"
                    error={!!errors.financialDetails?.bankLoanAmount}
                    helperText={errors.financialDetails?.bankLoanAmount?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="financialDetails.otherSources"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Other Sources (₹)"
                    error={!!errors.financialDetails?.otherSources}
                    helperText={errors.financialDetails?.otherSources?.message}
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
                Required Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload the required documents for your GIFT scheme application.
              </Typography>
            </Grid>
            
            {selectedScheme && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Required Documents:
                  </Typography>
                  <List dense>
                    {selectedScheme.applicationProcess.requiredDocuments.map((doc, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AttachFileIcon />
                        </ListItemIcon>
                        <ListItemText primary={doc} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Uploaded Documents
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addDocument}
                >
                  Add Document
                </Button>
              </Box>
              
              {documents.map((doc, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Document Type"
                          value={doc.documentType}
                          onChange={(e) => updateDocument(index, 'documentType', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Document Name"
                          value={doc.documentName}
                          onChange={(e) => updateDocument(index, 'documentName', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="File URL"
                          value={doc.documentUrl}
                          onChange={(e) => updateDocument(index, 'documentUrl', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeDocument(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Project Milestones
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Define key milestones for your project implementation.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Project Milestones
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addMilestone}
                >
                  Add Milestone
                </Button>
              </Box>
              
              {milestones.map((milestone, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Milestone Name"
                          value={milestone.milestoneName}
                          onChange={(e) => updateMilestone(index, 'milestoneName', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Target Date"
                          value={milestone.targetDate}
                          onChange={(e) => updateMilestone(index, 'targetDate', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeMilestone(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review & Submit
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review your application details before submitting.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Application Summary
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Scheme:</strong> {selectedScheme?.schemeName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Project Name:</strong> {watchedValues.projectDetails?.projectName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Project Value:</strong> {formatCurrency(watchedValues.projectDetails?.projectValue || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Requested Amount:</strong> {formatCurrency(watchedValues.financialDetails?.requestedIncentiveAmount || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Own Contribution:</strong> {formatCurrency(watchedValues.financialDetails?.ownContribution || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Documents Uploaded:</strong> {documents.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Milestones Defined:</strong> {milestones.length}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  By submitting this application, you agree to the terms and conditions of the GIFT scheme.
                  Please ensure all information is accurate and complete.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        GIFT Scheme Application
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Apply for Government Incentive for Technology schemes to support your sustainable technology projects
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GIFTApplicationForm;
