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
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockResetOutlined,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import ApiService from "../services/api";

// Validation schema for reset password
const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .required("Confirm password is required")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  // Check if token exists on mount
  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

const onSubmit = async (data: ResetPasswordFormData) => {
  if (!token) {
    setSubmitError("Invalid reset link. Please request a new password reset.");
    return;
  }

  setSubmitError(null);
  setSubmitSuccess(false);
  setIsSubmitting(true);

  try {
    // Call API to reset password
    const response = await ApiService.resetPassword({
      token: token,
      password: data.password
    });

    if (!response?.success) {
      throw new Error(
        response?.message || "Failed to reset password. Please try again."
      );
    }

    // Mark success
    setSubmitSuccess(true);

    // Redirect after 3 sec
    setTimeout(() => {
      navigate("/login");
    }, 3000);

  } catch (error) {
    setSubmitError(
      error instanceof Error
        ? error.message
        : "Failed to reset password. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};


  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleBackToForgotPassword = () => {
    navigate("/forgot-password");
  };

  // Token Error View
  if (tokenError) {
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
            border: "1px solid rgba(244, 67, 54, 0.1)",
          }}
        >
          {/* Error Icon */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                mb: 2,
                boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
              }}
            >
              <ErrorOutline sx={{ fontSize: 48, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: "error.main",
              }}
            >
              Invalid Reset Link
            </Typography>
          </Box>

          <Alert severity="error" sx={{ mb: 3 }}>
            This password reset link is invalid or has expired.
          </Alert>

          <Typography variant="body1" color="text.secondary" paragraph>
            The link you're trying to use is either invalid or has expired.
            Password reset links are only valid for 24 hours.
          </Typography>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleBackToForgotPassword}
              sx={{
                py: 1.5,
                background:
                  "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)",
                },
              }}
            >
              Request New Reset Link
            </Button>
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
              Back to Login
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Success View
  if (submitSuccess) {
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
          {/* Success Icon */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                mb: 2,
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 48, color: "white" }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Password Reset!
            </Typography>
          </Box>

          <Alert severity="success" sx={{ mb: 3 }}>
            Your password has been reset successfully!
          </Alert>

          <Typography variant="body1" color="text.secondary" paragraph>
            You can now log in with your new password.
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Redirecting to login page in a few seconds...
          </Typography>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate("/login")}
            sx={{
              py: 1.5,
              background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)",
              },
            }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  // Form View
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
            <LockResetOutlined sx={{ fontSize: 36, color: "white" }} />
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
            Reset Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your new password below
          </Typography>
        </Box>

        {/* Error Alert */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {/* New Password Field */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  autoFocus
                  error={!!errors.password}
                  helperText={
                    errors.password?.message || "Minimum 6 characters"
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockResetOutlined color="action" />
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

            {/* Confirm Password Field */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockResetOutlined color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                          aria-label="toggle confirm password visibility"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckCircleOutline />
                )
              }
              sx={{
                py: 1.5,
                background:
                  "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #43a047 0%, #1b5e20 100%)",
                },
                "&:disabled": {
                  background: "rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </Button>
          </Stack>
        </form>

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
            <strong>Password Requirements:</strong>
            <br />
            • At least 6 characters long
            <br />
            • Both passwords must match
            <br />• Use a strong, unique password
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
            to="/login"
            variant="caption"
            color="text.secondary"
            sx={{
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Back to Login
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
            Need Help?
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ResetPassword;