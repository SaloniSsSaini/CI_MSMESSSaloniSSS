import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  PersonAddOutlined,
  LockOutlined,
  EmailOutlined,
  PersonOutline,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import ApiService from "../services/api";
import { useRegistration } from "../context/RegistrationContext";

// Match your User model fields
type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  // role: string;
  firstName: string;
  lastName: string;
  phone: string;
  agreeToTerms: boolean;
};

// Define error type
type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  // role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  agreeToTerms?: string;
};

const UserRegister: React.FC = () => {
  const navigate = useNavigate();
  const { isRegistered } = useRegistration();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state - match your User model
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    // role: "msme", // Default as per your schema
    firstName: "",
    lastName: "",
    phone: "",
    agreeToTerms: false,
  });

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect if already logged in
  useEffect(() => {
    if (isRegistered) {
      navigate("/dashboard");
    }
  }, [isRegistered, navigate]);

  // Handle input changes
  const handleInputChange = (field: keyof RegisterFormData, value: any) => {
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

  // Validation function - match your User model requirements
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation - minlength: 6 as per schema
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords must match";
    }

    // Role validation - enum: ['admin', 'msme', 'analyst']
    // if (!formData.role) {
    //   newErrors.role = "Role is required";
    // } else if (!["admin", "msme", "analyst"].includes(formData.role)) {
    //   newErrors.role = "Invalid role";
    // }

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Phone validation (optional in schema, but you can make it required in form)
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);

    try {
      // Prepare data according to your User model
      const userData = {
        email: formData.email,
        password: formData.password,
        // role: formData.role,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          // avatar is optional in your schema
        },
      };

      const response = await ApiService.register(userData);

      if (!response?.success) {
        throw new Error(
          response?.message || "Registration failed. Please try again.",
        );
      }

      setRegisterSuccess(
        "Registration successful! You can now log in with your credentials.",
      );
      
      // Reset form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        // role: "msme",
        firstName: "",
        lastName: "",
        phone: "",
        agreeToTerms: false,
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
        py: 4,
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          width: "100%",
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid rgba(76, 175, 80, 0.1)",
        }}
      >
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
              mb: 2,
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
            }}
          >
            <PersonAddOutlined sx={{ fontSize: 36, color: "white" }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Join Carbon Intelligence Platform
          </Typography>
        </Box>

        {/* Success Alert */}
        {registerSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {registerSuccess}
          </Alert>
        )}

        {/* Error Alert */}
        {registerError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {registerError}
          </Alert>
        )}

        {/* Registration Form */}
        <form onSubmit={onSubmit}>
          <Stack spacing={3}>
            {/* First Name Field */}
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              autoComplete="given-name"
              error={!!errors.firstName}
              helperText={errors.firstName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Last Name Field */}
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              autoComplete="family-name"
              error={!!errors.lastName}
              helperText={errors.lastName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Phone Field */}
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              autoComplete="tel"
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Role Field */}
            {/* <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formData.role}
                label="Account Type"
                onChange={(e) => handleInputChange("role", e.target.value)}
              >
                <MenuItem value="msme">MSME Company</MenuItem>
                <MenuItem value="analyst">Analyst</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.role}
                </Typography>
              )}
            </FormControl> */}

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password || "Minimum 6 characters"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                      aria-label="toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Terms and Conditions */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{" "}
                    <Link
                      component={RouterLink}
                      to="/terms-of-service"
                      sx={{ color: "primary.main" }}
                    >
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      component={RouterLink}
                      to="/privacy-policy"
                      sx={{ color: "primary.main" }}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
              {errors.agreeToTerms && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  {errors.agreeToTerms}
                </Typography>
              )}
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isRegistering}
              startIcon={
                isRegistering ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PersonAddOutlined />
                )
              }
              sx={{
                py: 1.5,
                background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)",
                },
                "&:disabled": {
                  background: "rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              {isRegistering ? "Creating Account..." : "Create Account"}
            </Button>
          </Stack>
        </form>

        {/* Divider */}
        <Divider sx={{ my: 4 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Login Link */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Already have an account?
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            size="large"
            sx={{
              py: 1.5,
              borderColor: "success.main",
              color: "success.main",
              "&:hover": {
                borderColor: "success.dark",
                backgroundColor: "rgba(76, 175, 80, 0.04)",
              },
            }}
          >
            Sign In
          </Button>
        </Box>

        {/* Footer Links */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mt: 3 }}
        >
          <Link
            component={RouterLink}
            to="/privacy-policy"
            variant="caption"
            color="text.secondary"
            sx={{
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Privacy Policy
          </Link>
          <Typography variant="caption" color="text.secondary">
            •
          </Typography>
          <Link
            component={RouterLink}
            to="/terms-of-service"
            variant="caption"
            color="text.secondary"
            sx={{
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Terms of Service
          </Link>
          <Typography variant="caption" color="text.secondary">
            •
          </Typography>
          <Link
            component={RouterLink}
            to="/help"
            variant="caption"
            color="text.secondary"
            sx={{
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Help
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
};

export default UserRegister;