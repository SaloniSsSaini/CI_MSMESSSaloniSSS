import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Chip,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material';
import { ArrowBack, CheckCircle, Warning, Block, Flag } from '@mui/icons-material';
import axios from 'axios';

interface MSMEDetail {
    _id: string;
    companyName: string;
    industry: string;
    status: string;
    contact: {
        email: string;
        phone: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            pincode?: string;
            country?: string;
        };
    };
    gstNumber: string;
    panNumber: string;
    establishmentYear: number;
    business?: {
        numberOfEmployees?: number;
        annualTurnover?: number;
    };
    createdAt: string;
    userId: {
        email: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
}

const formatAddress = (address?: MSMEDetail['contact']['address']) => {
    if (!address) return 'N/A';
    const parts = [
        address.street,
        address.city,
        address.state,
        address.pincode,
        address.country,
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(', ') : 'N/A';
};

const MSMEDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [msme, setMsme] = useState<MSMEDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMSMEDetails();
    }, [id]);

    const getToken = () => localStorage.getItem('token');

    const fetchMSMEDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/msme/${id}`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                }
            );
            setMsme(response.data.data.msme);
        } catch (error: any) {
            console.error('Error fetching MSME details:', error);
            setError('Failed to load MSME details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'verified':
                return 'success';
            case 'flagged':
                return 'warning';
            case 'suspended':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle />;
            case 'flagged':
                return <Warning />;
            case 'suspended':
                return <Block />;
            default:
                return <Flag />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !msme) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error || 'MSME not found'}</Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin/dashboard')}
                    sx={{ mt: 2 }}
                >
                    Back to Dashboard
                </Button>
            </Container>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
            <Container maxWidth="lg">
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin/dashboard')}
                    sx={{ mb: 3 }}
                >
                    Back to Dashboard
                </Button>

                <Paper sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                            {msme.companyName}
                        </Typography>
                        <Chip
                            icon={getStatusIcon(msme.status || 'pending')}
                            label={msme.status ? msme.status.charAt(0).toUpperCase() + msme.status.slice(1) : 'Pending'}
                            color={getStatusColor(msme.status || 'pending') as any}
                            size="medium"
                        />
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Company Information */}
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Company Information
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Industry</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.industry}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">GST Number</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.gstNumber || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">PAN Number</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.panNumber || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Year Established</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.establishmentYear || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Number of Employees</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.business?.numberOfEmployees ?? 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Annual Revenue</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {msme.business?.annualTurnover != null
                                    ? `₹${msme.business.annualTurnover.toLocaleString()}`
                                    : 'N/A'}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    {/* Contact Information */}
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Contact Information
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Email</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.contact?.email || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.contact?.phone || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Address</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatAddress(msme.contact?.address)}</Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    {/* User Information */}
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        User Account
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">User Name</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {msme.userId?.profile?.firstName} {msme.userId?.profile?.lastName}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">User Email</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{msme.userId?.email}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body2" color="text.secondary">Registration Date</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {new Date(msme.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};

export default MSMEDetailView;
