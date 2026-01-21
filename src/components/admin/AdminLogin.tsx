import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    TextField,
    Button,
    Typography,
    Alert,
    Paper,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import ApiService from '../../services/api';

interface AdminLoginForm {
    email: string;
    password: string;
}

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLogging, setIsLogging] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AdminLoginForm>();

    const onSubmit = async (data: AdminLoginForm) => {
        setLoginError(null);
        setIsLogging(true);

        try {
            const response = await ApiService.login(data.email, data.password);

            if (!response?.success) {
                throw new Error(response?.message || 'Login failed');
            }

            const user = response?.data?.user;
            const token = response?.data?.token;

            // Verify user is admin
            if (user?.role !== 'admin') {
                // Clear any stored token for non-admin
                localStorage.removeItem('token');
                throw new Error('Access denied. Admin privileges required.');
            }

            // Store token and admin info
            if (typeof window !== 'undefined' && token) {
                localStorage.setItem('token', token);
                localStorage.setItem('adminUser', JSON.stringify(user));
            }

            // Redirect to admin dashboard
            navigate('/admin/dashboard');
        } catch (error) {
            setLoginError(
                error instanceof Error
                    ? error.message
                    : 'Login failed. Please check your credentials.'
            );
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: '#e4f3e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255, 255, 255, 0.95)',
                    }}
                >
                    {/* Header */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <AdminIcon
                            sx={{
                                fontSize: 64,
                                color: 'primary.main',
                                mb: 2,
                            }}
                        />
                        <Typography
                            variant="h4"
                            component="h1"
                            gutterBottom
                            sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                            Admin Portal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Carbon Intelligence MSME Management System
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
                        <TextField
                            fullWidth
                            label="Admin Email"
                            type="email"
                            margin="normal"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address',
                                },
                            })}
                            error={Boolean(errors.email)}
                            helperText={errors.email?.message}
                            autoFocus
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            margin="normal"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters',
                                },
                            })}
                            error={Boolean(errors.password)}
                            helperText={errors.password?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLogging}
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontWeight: 600,
                                fontSize: '1.1rem',
                            }}
                        >
                            {isLogging ? 'Signing In...' : 'Sign In as Admin'}
                        </Button>
                    </form>

                    {/* Footer */}
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Authorized personnel only. All access is logged.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLogin;
