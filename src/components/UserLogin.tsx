import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  LockOutlined,
  EmailOutlined,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useRegistration } from "../context/RegistrationContext";

// Validation schema for login
const loginSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

type LoginFormData = {
  email: string;
  password: string;
};

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isRegistered } = useRegistration();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isRegistered) {
      navigate("/dashboard");
    }
  }, [isRegistered, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await login(data.email, data.password);
      // Navigate to dashboard on successful login
      navigate("/dashboard");
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
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
          maxWidth: 480,
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
            <LockOutlined sx={{ fontSize: 36, color: "white" }} />
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
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your Carbon Intelligence account
          </Typography>
        </Box>

        {/* Error Alert */}
        {loginError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loginError}
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
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
              )}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: "right" }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoggingIn}
              startIcon={
                isLoggingIn ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LoginIcon />
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
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </form>

        {/* Divider */}
        <Divider sx={{ my: 4 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Registration Link */}
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Don't have an account?
          </Typography>
          <Button
            component={RouterLink}
            to="/register"
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
            Register
          </Button>
        </Box>

        {/* Additional Info */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(76, 175, 80, 0.06) 0%, rgba(46, 125, 50, 0.08) 100%)",
            border: "1px solid rgba(76, 175, 80, 0.12)",
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            <strong>New to Carbon Intelligence?</strong>
            <br />
            Register your MSME to access AI-powered carbon footprint tracking,
            predictive analytics, and personalized sustainability
            recommendations.
          </Typography>
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

export default UserLogin;