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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CheckCircleOutline as SuccessIcon } from "@mui/icons-material";
import ApiService from "../services/api";

// Define the form type based on Mongoose schema
type MSMERegistrationForm = {
  // Basic Company Information
  companyName: string;
  companyType: string;
  industry: string;
  businessDomain: string;
  establishmentYear: string;
  
  // MSME Registration Details
  udyamRegistrationNumber: string;
  gstNumber: string;
  panNumber: string;
  
  // Contact Information
  email: string;
  phone: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Business Details
  annualTurnover: string;
  numberOfEmployees: string;
  manufacturingUnits: string;
  primaryProducts: string;
  
  // Environmental Compliance
  hasEnvironmentalClearance: boolean;
  hasPollutionControlBoard: boolean;
  hasWasteManagement: boolean;
};

const steps = [
  "Company Information",
  "MSME Registration Details",
  "Contact & Address",
  "Business Details",
  "Environmental Compliance",
  "Review & Submit"
];

const MSMERegistration: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<MSMERegistrationForm>({
    // Basic Company Information
    companyName: "",
    companyType: "",
    industry: "",
    businessDomain: "",
    establishmentYear: "",
    
    // MSME Registration Details
    udyamRegistrationNumber: "",
    gstNumber: "",
    panNumber: "",
    
    // Contact Information
    email: "",
    phone: "",
    
    // Address Information
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    
    // Business Details
    annualTurnover: "",
    numberOfEmployees: "",
    manufacturingUnits: "",
    primaryProducts: "",
    
    // Environmental Compliance
    hasEnvironmentalClearance: false,
    hasPollutionControlBoard: false,
    hasWasteManagement: false,
  });

  // Validation state
  const [errors, setErrors] = useState<Partial<MSMERegistrationForm>>({});

  // Handle input changes
  const handleInputChange = (field: keyof MSMERegistrationForm, value: any) => {
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

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<MSMERegistrationForm> = {};

    switch (step) {
      case 0:
        if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
        if (!formData.companyType) newErrors.companyType = "Company type is required";
        if (!formData.industry) newErrors.industry = "Industry is required";
        if (!formData.businessDomain) newErrors.businessDomain = "Business domain is required";
        if (!formData.establishmentYear.trim()) newErrors.establishmentYear = "Establishment year is required";
        else if (isNaN(Number(formData.establishmentYear)) || Number(formData.establishmentYear) < 1900 || Number(formData.establishmentYear) > new Date().getFullYear())
          newErrors.establishmentYear = "Invalid establishment year";
        break;
      
      case 1:
        if (!formData.udyamRegistrationNumber.trim()) newErrors.udyamRegistrationNumber = "UDYAM Registration Number is required";
        else if (!/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(formData.udyamRegistrationNumber))
          newErrors.udyamRegistrationNumber = "Invalid UDYAM format: UDYAM-XX-00-0000000";
        
        if (!formData.gstNumber.trim()) newErrors.gstNumber = "GST Number is required";
        else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber))
          newErrors.gstNumber = "Invalid GST Number format";
        
        if (!formData.panNumber.trim()) newErrors.panNumber = "PAN Number is required";
        else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber))
          newErrors.panNumber = "Invalid PAN Number format";
        break;
      
      case 2:
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Invalid phone number format";
        
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
        else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) newErrors.pincode = "Invalid pincode format";
        break;
      
      case 3:
        if (!formData.annualTurnover.trim()) newErrors.annualTurnover = "Annual turnover is required";
        else if (isNaN(Number(formData.annualTurnover)) || Number(formData.annualTurnover) < 0) 
          newErrors.annualTurnover = "Turnover cannot be negative";
        
        if (!formData.numberOfEmployees.trim()) newErrors.numberOfEmployees = "Number of employees is required";
        else if (isNaN(Number(formData.numberOfEmployees)) || Number(formData.numberOfEmployees) < 1) 
          newErrors.numberOfEmployees = "Must have at least 1 employee";
        
        if (!formData.manufacturingUnits.trim()) newErrors.manufacturingUnits = "Number of manufacturing units is required";
        else if (isNaN(Number(formData.manufacturingUnits)) || Number(formData.manufacturingUnits) < 1) 
          newErrors.manufacturingUnits = "Must have at least 1 unit";
        
        if (!formData.primaryProducts.trim()) newErrors.primaryProducts = "Primary products/services is required";
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

  // const onSubmit = async () => {
  //   setIsSubmitting(true);
  //   setSubmitError(null);

  //   try {
  //     // Prepare data for backend according to Mongoose schema
  //     const submissionData = {
  //       companyName: formData.companyName,
  //       companyType: formData.companyType,
  //       industry: formData.industry,
  //       businessDomain: formData.businessDomain,
  //       establishmentYear: Number(formData.establishmentYear),
  //       udyamRegistrationNumber: formData.udyamRegistrationNumber,
  //       gstNumber: formData.gstNumber,
  //       panNumber: formData.panNumber,
  //       contact: {
  //         email: formData.email,
  //         phone: formData.phone,
  //         address: {
  //           street: formData.address,
  //           city: formData.city,
  //           state: formData.state,
  //           pincode: formData.pincode,
  //           country: formData.country,
  //         },
  //       },
  //       business: {
  //         annualTurnover: Number(formData.annualTurnover),
  //         numberOfEmployees: Number(formData.numberOfEmployees),
  //         manufacturingUnits: Number(formData.manufacturingUnits),
  //         primaryProducts: formData.primaryProducts,
  //       },
  //       environmentalCompliance: {
  //         hasEnvironmentalClearance: formData.hasEnvironmentalClearance,
  //         hasPollutionControlBoard: formData.hasPollutionControlBoard,
  //         hasWasteManagement: formData.hasWasteManagement,
  //       },
  //     };

  //     console.log("Submitting MSME registration data:", submissionData);
      
  //     // Simulate API call - replace with actual API call
  //     await new Promise(resolve => setTimeout(resolve, 2000));
      
  //     console.log("MSME Registration successful!");
  //     setSubmitSuccess(true);
      
  //   } catch (error) {
  //     console.error("Registration error:", error);
  //     setSubmitError(
  //       error instanceof Error
  //         ? error.message
  //         : "Registration failed. Please try again."
  //     );
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };


  const onSubmit = async () => {
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    // Prepare data for backend according to Mongoose schema
    const submissionData = {
      companyName: formData.companyName,
      companyType: formData.companyType,
      industry: formData.industry,
      businessDomain: formData.businessDomain,
      establishmentYear: Number(formData.establishmentYear),
      udyamRegistrationNumber: formData.udyamRegistrationNumber,
      gstNumber: formData.gstNumber,
      panNumber: formData.panNumber,
      contact: {
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
        },
      },
      business: {
        annualTurnover: Number(formData.annualTurnover),
        numberOfEmployees: Number(formData.numberOfEmployees),
        manufacturingUnits: Number(formData.manufacturingUnits),
        primaryProducts: formData.primaryProducts,
      },
      environmentalCompliance: {
        hasEnvironmentalClearance: formData.hasEnvironmentalClearance,
        hasPollutionControlBoard: formData.hasPollutionControlBoard,
        hasWasteManagement: formData.hasWasteManagement,
      },
    };

    console.log("Submitting MSME registration data:", submissionData);
    
    // Use your ApiService to register MSME
    const response = await ApiService.registerMSME(submissionData);
    
    if (response.success) {
      console.log("MSME Registration successful!");
      setSubmitSuccess(true);
    } else {
      throw new Error(response.message || "Registration failed");
    }
    
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
  const formatDisplayValue = (value: any, fieldName: keyof MSMERegistrationForm): string => {
    if (!value || value.toString().trim() === "") {
      return "Not provided";
    }

    switch (fieldName) {
      case "companyType":
        const companyTypeMap: { [key: string]: string } = {
          micro: "Micro Enterprise",
          small: "Small Enterprise",
          medium: "Medium Enterprise",
        };
        return companyTypeMap[value] || value;
      
      case "businessDomain":
        const businessDomainMap: { [key: string]: string } = {
          manufacturing: "Manufacturing",
          trading: "Trading",
          services: "Services",
          export_import: "Export/Import",
          retail: "Retail",
          wholesale: "Wholesale",
          e_commerce: "E-Commerce",
          consulting: "Consulting",
          logistics: "Logistics & Transportation",
          agriculture: "Agriculture & Allied",
          handicrafts: "Handicrafts & Artisans",
          food_processing: "Food Processing",
          textiles: "Textiles & Garments",
          electronics: "Electronics & IT",
          automotive: "Automotive & Engineering",
          construction: "Construction & Real Estate",
          healthcare: "Healthcare & Pharmaceuticals",
          education: "Education & Training",
          tourism: "Tourism & Hospitality",
          other: "Other",
        };
        return businessDomainMap[value] || value;
      
      case "annualTurnover":
        return `₹${Number(value).toLocaleString()}`;
      
      case "establishmentYear":
      case "numberOfEmployees":
      case "manufacturingUnits":
        return value.toString();
      
      case "hasEnvironmentalClearance":
      case "hasPollutionControlBoard":
      case "hasWasteManagement":
        return value ? "Yes" : "No";
      
      default:
        return value.toString();
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
                  <MenuItem value="textiles">Textiles</MenuItem>
                  <MenuItem value="food">Food Processing</MenuItem>
                  <MenuItem value="chemicals">Chemicals</MenuItem>
                  <MenuItem value="electronics">Electronics</MenuItem>
                  <MenuItem value="automotive">Automotive</MenuItem>
                  <MenuItem value="pharmaceuticals">Pharmaceuticals</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.industry && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.industry}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.businessDomain} required>
                <InputLabel>Business Domain</InputLabel>
                <Select
                  value={formData.businessDomain}
                  label="Business Domain"
                  onChange={(e) => handleInputChange("businessDomain", e.target.value)}
                >
                  <MenuItem value=""><em>Select Business Domain</em></MenuItem>
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
                {errors.businessDomain && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.businessDomain}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Establishment Year"
                value={formData.establishmentYear}
                onChange={(e) => handleInputChange("establishmentYear", e.target.value)}
                error={!!errors.establishmentYear}
                helperText={errors.establishmentYear}
                required
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
              <TextField
                fullWidth
                label="UDYAM Registration Number"
                placeholder="UDYAM-XX-00-0000000"
                value={formData.udyamRegistrationNumber}
                onChange={(e) => handleInputChange("udyamRegistrationNumber", e.target.value)}
                error={!!errors.udyamRegistrationNumber}
                helperText={errors.udyamRegistrationNumber || "Format: UDYAM-XX-00-0000000"}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST Number"
                placeholder="00XXXXX0000X0X"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                error={!!errors.gstNumber}
                helperText={errors.gstNumber || "Format: 00XXXXX0000X0X"}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PAN Number"
                placeholder="XXXXX0000X"
                value={formData.panNumber}
                onChange={(e) => handleInputChange("panNumber", e.target.value)}
                error={!!errors.panNumber}
                helperText={errors.panNumber || "Format: XXXXX0000X"}
                required
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
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                error={!!errors.pincode}
                helperText={errors.pincode}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
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
                Business Details
              </Typography>
            </Grid>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Number of Manufacturing Units"
                value={formData.manufacturingUnits}
                onChange={(e) => handleInputChange("manufacturingUnits", e.target.value)}
                error={!!errors.manufacturingUnits}
                helperText={errors.manufacturingUnits}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Products/Services"
                value={formData.primaryProducts}
                onChange={(e) => handleInputChange("primaryProducts", e.target.value)}
                error={!!errors.primaryProducts}
                helperText={errors.primaryProducts}
                required
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
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasEnvironmentalClearance}
                    onChange={(e) => handleInputChange("hasEnvironmentalClearance", e.target.checked)}
                  />
                }
                label="Has Environmental Clearance Certificate"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasPollutionControlBoard}
                    onChange={(e) => handleInputChange("hasPollutionControlBoard", e.target.checked)}
                  />
                }
                label="Registered with State Pollution Control Board"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasWasteManagement}
                    onChange={(e) => handleInputChange("hasWasteManagement", e.target.checked)}
                  />
                }
                label="Has Waste Management System"
              />
            </Grid>
          </Grid>
        );

      case 5:
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
            
            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Company Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.companyName, "companyName")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Company Type</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.companyType, "companyType")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Industry</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.industry, "industry")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Business Domain</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.businessDomain, "businessDomain")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Establishment Year</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.establishmentYear, "establishmentYear")}</Typography>
            </Grid>

            {/* MSME Registration */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                MSME Registration
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">UDYAM Number</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.udyamRegistrationNumber, "udyamRegistrationNumber")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">GST Number</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.gstNumber, "gstNumber")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">PAN Number</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.panNumber, "panNumber")}</Typography>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.email, "email")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.phone, "phone")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Address</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.address, "address")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Location</Typography>
              <Typography variant="body1">
                {formData.city && formData.state ? `${formData.city}, ${formData.state}, ${formData.pincode}` : "Not provided"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Country</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.country, "country")}</Typography>
            </Grid>

            {/* Business Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Business Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Annual Turnover</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.annualTurnover, "annualTurnover")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Number of Employees</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.numberOfEmployees, "numberOfEmployees")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Manufacturing Units</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.manufacturingUnits, "manufacturingUnits")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Primary Products</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.primaryProducts, "primaryProducts")}</Typography>
            </Grid>

            {/* Environmental Compliance */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Environmental Compliance
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Environmental Clearance</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.hasEnvironmentalClearance, "hasEnvironmentalClearance")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Pollution Control Board</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.hasPollutionControlBoard, "hasPollutionControlBoard")}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Waste Management</Typography>
              <Typography variant="body1">{formatDisplayValue(formData.hasWasteManagement, "hasWasteManagement")}</Typography>
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
          Your MSME profile has been created successfully.
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
              businessDomain: "",
              establishmentYear: "",
              udyamRegistrationNumber: "",
              gstNumber: "",
              panNumber: "",
              email: "",
              phone: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
              country: "India",
              annualTurnover: "",
              numberOfEmployees: "",
              manufacturingUnits: "",
              primaryProducts: "",
              hasEnvironmentalClearance: false,
              hasPollutionControlBoard: false,
              hasWasteManagement: false,
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
          maxWidth: 1000,
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
        maxWidth: 1000,
        mx: "auto",
        mt: 4,
      }}
    >
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          MSME Registration
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Complete your MSME registration with all required details
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

export default MSMERegistration;