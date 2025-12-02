import React, { useState } from "react";
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
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CheckCircleOutline as SuccessIcon } from "@mui/icons-material";
import ApiService from "../services/api";

// Define the form type
type RegistrationForm = {
  companyName: string;
  companyType: string;
  industry: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  annualTurnover: string;
  numberOfEmployees: string;
};

const steps = [
  "Basic Information",
  "Contact Details",
  "Business Information",
  "Review & Submit"
];

const SimpleRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Simple form state
  const [formData, setFormData] = useState<RegistrationForm>({
    companyName: "",
    companyType: "",
    industry: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    annualTurnover: "",
    numberOfEmployees: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Partial<RegistrationForm>>({});

  // Handle input changes
  const handleInputChange = (field: keyof RegistrationForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Simple validation
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<RegistrationForm> = {};

    switch (step) {
      case 0:
        if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
        if (!formData.companyType) newErrors.companyType = "Company type is required";
        if (!formData.industry) newErrors.industry = "Industry is required";
        break;
      
      case 1:
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Invalid phone number format";
        
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        break;
      
      case 2:
        if (!formData.annualTurnover.trim()) newErrors.annualTurnover = "Annual turnover is required";
        else if (isNaN(Number(formData.annualTurnover)) || Number(formData.annualTurnover) < 0) 
          newErrors.annualTurnover = "Turnover must be a positive number";
        
        if (!formData.numberOfEmployees.trim()) newErrors.numberOfEmployees = "Number of employees is required";
        else if (isNaN(Number(formData.numberOfEmployees)) || Number(formData.numberOfEmployees) < 1) 
          newErrors.numberOfEmployees = "Must have at least 1 employee";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      setSubmitError(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setSubmitError(null);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("Submitting registration data:", formData);
      
      // Prepare data for backend
      const submissionData = {
        companyName: formData.companyName,
        companyType: formData.companyType,
        industry: formData.industry,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        annualTurnover: Number(formData.annualTurnover),
        numberOfEmployees: Number(formData.numberOfEmployees),
      };

      console.log("Data ready for backend:", submissionData);
      
      // Simulate API call - replace with actual API call
    //   await new Promise(resolve => setTimeout(resolve, 2000));
      const registerResponse = await ApiService.register({
            companyName: formData.companyName,
            companyType: formData.companyType,
            industry: formData.industry,
            email: submissionData.email,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            // password: submissionData.password,
            // role: "msme",
            // profile: {
            //     companyName: data.companyName,
            //     businessDomain: data.businessDomain,
            //   },
            });
        console.log("MSMERegText.tsx 170")
      if (!registerResponse?.success) {
        throw new Error(
          registerResponse?.message || "Registration failed. Please try again.",
        );
      }

      const token = registerResponse?.data?.token;

      if (!token) {
        throw new Error(
          "Registration failed. Authentication token missing in response.",
        );
      }
      
      console.log("Registration successful!");
      setSubmitSuccess(true);
      
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format display values
  const formatDisplayValue = (value: string, fieldName: keyof RegistrationForm): string => {
    if (!value || value.trim() === "") {
      return "Not provided";
    }

    switch (fieldName) {
      case "companyType":
        const companyTypeMap: { [key: string]: string } = {
          micro: "Micro Enterprise",
          small: "Small Enterprise",
          medium: "Medium Enterprise",
          startup: "Startup"
        };
        return companyTypeMap[value] || value;
      
      case "industry":
        const industryMap: { [key: string]: string } = {
          manufacturing: "Manufacturing",
          technology: "Technology",
          retail: "Retail",
          services: "Services",
          healthcare: "Healthcare",
          education: "Education",
          other: "Other"
        };
        return industryMap[value] || value;
      
      case "annualTurnover":
        return `₹${Number(value).toLocaleString()}`;
      
      default:
        return value;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                error={!!errors.companyName}
                helperText={errors.companyName}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.companyType} required>
                <InputLabel>Company Type</InputLabel>
                <Select
                  value={formData.companyType}
                  label="Company Type"
                  onChange={(e) => handleInputChange("companyType", e.target.value)}
                >
                  <MenuItem value=""><em>Select Company Type</em></MenuItem>
                  <MenuItem value="micro">Micro Enterprise</MenuItem>
                  <MenuItem value="small">Small Enterprise</MenuItem>
                  <MenuItem value="medium">Medium Enterprise</MenuItem>
                  <MenuItem value="startup">Startup</MenuItem>
                </Select>
                {errors.companyType && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.companyType}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.industry} required>
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry}
                  label="Industry"
                  onChange={(e) => handleInputChange("industry", e.target.value)}
                >
                  <MenuItem value=""><em>Select Industry</em></MenuItem>
                  <MenuItem value="manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="services">Services</MenuItem>
                  <MenuItem value="healthcare">Healthcare</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.industry && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.industry}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone || "10-digit mobile number"}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                error={!!errors.city}
                helperText={errors.city}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                error={!!errors.state}
                helperText={errors.state}
                required
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Annual Turnover (₹)"
                value={formData.annualTurnover}
                onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
                error={!!errors.annualTurnover}
                helperText={errors.annualTurnover}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Employees"
                value={formData.numberOfEmployees}
                onChange={(e) => handleInputChange("numberOfEmployees", e.target.value)}
                error={!!errors.numberOfEmployees}
                helperText={errors.numberOfEmployees}
                required
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review all the information before submitting your registration.
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Company Name
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.companyName, "companyName")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Company Type
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.companyType, "companyType")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Industry
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.industry, "industry")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.email, "email")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.phone, "phone")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formData.city && formData.state 
                  ? `${formData.city}, ${formData.state}`
                  : "Not provided"}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Annual Turnover
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.annualTurnover, "annualTurnover")}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Employees
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDisplayValue(formData.numberOfEmployees, "numberOfEmployees")}
              </Typography>
            </Grid>
          </Grid>
        );

      default:
        return "Unknown step";
    }
  };

  const renderSuccessState = () => (
    <>
      <Alert
        icon={<SuccessIcon fontSize="inherit" />}
        severity="success"
        sx={{ mb: 3 }}
      >
        Registration completed successfully for <strong>{formData.companyName}</strong>!
      </Alert>

      <Box sx={{ textAlign: "center", mb: 4 }}>
        <SuccessIcon sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome Aboard!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: "auto" }}>
          Thank you for registering <strong>{formData.companyName}</strong>. 
          You're now ready to explore our platform and access all available features.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={() => navigate("/dashboard")}
          sx={{ minWidth: 160 }}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setSubmitSuccess(false);
            setActiveStep(0);
            setFormData({
              companyName: "",
              companyType: "",
              industry: "",
              email: "",
              phone: "",
              city: "",
              state: "",
              annualTurnover: "",
              numberOfEmployees: "",
            });
          }}
          sx={{ minWidth: 160 }}
        >
          Register Another
        </Button>
      </Box>
    </>
  );

  if (submitSuccess) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 6,
          borderRadius: 3,
          maxWidth: 800,
          mx: "auto",
          mt: 4,
        }}
      >
        {renderSuccessState()}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 6,
        borderRadius: 3,
        maxWidth: 800,
        mx: "auto",
        mt: 4,
      }}
    >
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Company Registration
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Complete your company registration in a few simple steps
        </Typography>
      </Box>

      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 4,
          "& .MuiStepLabel-root .MuiStepLabel-label": {
            fontWeight: 500,
            fontSize: "0.875rem",
          },
        }}
      >
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

      <Box sx={{ mb: 4 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pt: 3,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
          sx={{ minWidth: 120 }}
        >
          Back
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              disabled={isSubmitting}
              onClick={onSubmit}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 180 }}
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ minWidth: 120 }}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SimpleRegistration;