import React, { useState } from "react";
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
} from "@mui/material";
import {
  EmailOutlined,
  LockResetOutlined,
  ArrowBack,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import ApiService from "../services/api";

// Validation schema for forgot password
const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

type ForgotPasswordFormData = {
  email: string;
};

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    console.log(data)
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      // Call your API service to send password reset email
      const response = await ApiService.forgotPassword(data);

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to send reset email. Please try again.",
        );
      }

      // Set success state
      setSubmitSuccess(true);
      setSubmittedEmail(data.email);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to send reset email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

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
            maxWidth: 520,
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
              Check Your Email
            </Typography>
          </Box>

          {/* Success Message */}
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset link sent successfully!
          </Alert>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              We've sent a password reset link to:
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "primary.main",
                textAlign: "center",
                py: 2,
                px: 3,
                borderRadius: 2,
                background: "rgba(76, 175, 80, 0.08)",
                mb: 3,
              }}
            >
              {submittedEmail}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click the link in the email to reset your password. The link will
              expire in <strong>24 hours</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If you don't see the email, check your spam folder or request a
              new reset link.
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={handleBackToLogin}
              startIcon={<ArrowBack />}
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
              Back to Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                setSubmitSuccess(false);
                setSubmittedEmail("");
              }}
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
              Send Another Link
            </Button>
          </Stack>

          {/* Help Section */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(33, 150, 243, 0.06) 0%, rgba(25, 118, 210, 0.08) 100%)",
              border: "1px solid rgba(33, 150, 243, 0.12)",
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>Need Help?</strong>
              <br />
              If you're having trouble resetting your password, please{" "}
              <Link
                component={RouterLink}
                to="/help"
                sx={{ color: "primary.main" }}
              >
                contact support
              </Link>
              .
            </Typography>
          </Box>
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
            Forgot Password?
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email address and we'll send you a link to reset your
            password
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
                  autoFocus
                  error={!!errors.email}
                  helperText={
                    errors.email?.message ||
                    "Enter the email associated with your account"
                  }
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
                  <EmailOutlined />
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
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>

            {/* Back to Login Button */}
            <Button
              variant="text"
              size="large"
              onClick={handleBackToLogin}
              startIcon={<ArrowBack />}
              sx={{
                py: 1.5,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              Back to Login
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
            <strong>Remember your password?</strong>
            <br />
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Sign in to your account
            </Link>
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
            Contact Support
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;