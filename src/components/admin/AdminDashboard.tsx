import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    TextField,
    Grid,
    Card,
    CardContent,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import {
    Visibility,
    Delete,
    Flag,
    CheckCircle,
    Warning,
    Block,
    Search,
    Logout,
} from '@mui/icons-material';
import axios from 'axios';

interface MSME {
    _id: string;
    companyName: string;
    industry: string;
    status: 'pending' | 'verified' | 'flagged' | 'suspended';
    contact: {
        email: string;
        phone: string;
    };
    gstNumber: string;
    createdAt: string;
    userId: {
        email: string;
        createdAt: string;
    };
}

interface Statistics {
    msme: {
        total: number;
        verified: number;
        flagged: number;
        pending: number;
        suspended: number;
    };
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [msmes, setMsmes] = useState<MSME[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; msmeId: string | null }>({
        open: false,
        msmeId: null,
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStatistics();
        fetchMSMEs();
    }, [page, rowsPerPage, statusFilter]);

    const getToken = () => localStorage.getItem('token');

    const fetchStatistics = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/msme/statistics`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                }
            );
            setStatistics(response.data.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const fetchMSMEs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/msme/list`,
                {
                    params: {
                        page: page + 1,
                        limit: rowsPerPage,
                        search: searchTerm || undefined,
                        status: statusFilter || undefined,
                    },
                    headers: { Authorization: `Bearer ${getToken()}` },
                }
            );

            setMsmes(response.data.data.msmes);
            setTotal(response.data.data.pagination.total);
        } catch (error: any) {
            console.error('Error fetching MSMEs:', error);
            if (error.response?.status === 403 || error.response?.status === 401) {
                navigate('/admin/login');
            } else {
                setError('Failed to load MSME data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        fetchMSMEs();
    };

    const handleDelete = async () => {
        if (!deleteDialog.msmeId) return;

        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/admin/msme/${deleteDialog.msmeId}?deleteUser=true`,
                {
                    headers: { Authorization: `Bearer ${getToken()}` },
                }
            );
            setDeleteDialog({ open: false, msmeId: null });
            fetchMSMEs();
            fetchStatistics();
        } catch (error) {
            console.error('Error deleting MSME:', error);
            setError('Failed to delete MSME');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
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

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                        Admin Dashboard
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Statistics Cards */}
                {statistics && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Card>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom variant="body2">
                                        Total MSMEs
                                    </Typography>
                                    <Typography variant="h4">{statistics.msme.total}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom variant="body2">
                                        Verified
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {statistics.msme.verified}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom variant="body2">
                                        Flagged
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {statistics.msme.flagged}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ borderLeft: 4, borderColor: 'info.main' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom variant="body2">
                                        Pending
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {statistics.msme.pending}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom variant="body2">
                                        Suspended
                                    </Typography>
                                    <Typography variant="h4" color="error.main">
                                        {statistics.msme.suspended}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Filters */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by company name, email, GST, PAN..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton onClick={handleSearch} size="small">
                                            <Search />
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(0);
                                    }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="verified">Verified</MenuItem>
                                    <MenuItem value="flagged">Flagged</MenuItem>
                                    <MenuItem value="suspended">Suspended</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* MSME Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Company Name</strong></TableCell>
                                <TableCell><strong>Industry</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Registered</strong></TableCell>
                                <TableCell align="center"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                                </TableRow>
                            ) : msmes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No MSMEs found</TableCell>
                                </TableRow>
                            ) : (
                                msmes.map((msme) => (
                                    <TableRow key={msme._id} hover>
                                        <TableCell>{msme.companyName}</TableCell>
                                        <TableCell>{msme.industry}</TableCell>
                                        <TableCell>{msme.contact.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getStatusIcon(msme.status || 'pending')}
                                                label={msme.status ? msme.status.charAt(0).toUpperCase() + msme.status.slice(1) : 'Pending'}
                                                color={getStatusColor(msme.status || 'pending') as any}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(msme.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => navigate(`/admin/msme/${msme._id}`)}
                                                title="View Details"
                                            >
                                                <Visibility />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteDialog({ open: true, msmeId: msme._id })}
                                                title="Delete MSME"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <TablePagination
                        rowsPerPageOptions={[10, 20, 50]}
                        component="div"
                        count={total}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </TableContainer>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, msmeId: null })}>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        Are you sure you want to delete this MSME? This will also delete the associated user account.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog({ open: false, msmeId: null })}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
};

export default AdminDashboard;
