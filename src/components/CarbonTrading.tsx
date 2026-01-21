import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    Tab,
    Tabs,
    InputAdornment,
} from '@mui/material';
import {
    TrendingUp,
    ShoppingCart,
    AccountBalance,
    History,
    Add,
    Remove,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import api from '../services/api';

interface CarbonCredit {
    _id: string;
    msme: string;
    totalCredits: number;
    availableCredits: number;
    retiredCredits: number;
    pricePerCredit: number;
    status: string;
}

interface Trade {
    _id: string;
    type: 'buy' | 'sell';
    credits: number;
    pricePerCredit: number;
    totalAmount: number;
    status: string;
    createdAt: string;
}

interface MarketListing {
    _id: string;
    seller: string;
    credits: number;
    pricePerCredit: number;
    totalValue: number;
    status: string;
}

const CarbonTrading: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // State for carbon credits
    const [carbonCredits, setCarbonCredits] = useState<CarbonCredit | null>(null);
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
    const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);

    // Dialog states
    const [buyDialogOpen, setBuyDialogOpen] = useState(false);
    const [sellDialogOpen, setSellDialogOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);

    // Form states
    const [buyAmount, setBuyAmount] = useState('');
    const [sellAmount, setSellAmount] = useState('');
    const [sellPrice, setSellPrice] = useState('');

    useEffect(() => {
        fetchCarbonCredits();
        fetchTradeHistory();
        fetchMarketListings();
        fetchPriceHistory();
    }, []);

    const fetchCarbonCredits = async () => {
        try {
            setLoading(true);
            // Placeholder - replace with actual API call when backend is ready
            setCarbonCredits(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch carbon credits');
        } finally {
            setLoading(false);
        }
    };

    const fetchTradeHistory = async () => {
        try {
            // Placeholder - replace with actual API call when backend is ready
            setTradeHistory([]);
        } catch (err: any) {
            console.error('Failed to fetch trade history:', err);
        }
    };

    const fetchMarketListings = async () => {
        try {
            // Placeholder - replace with actual API call when backend is ready
            setMarketListings([]);
        } catch (err: any) {
            console.error('Failed to fetch market listings:', err);
        }
    };

    const fetchPriceHistory = async () => {
        try {
            // Placeholder - replace with actual API call when backend is ready
            setPriceHistory([]);
        } catch (err: any) {
            console.error('Failed to fetch price history:', err);
        }
    };

    const handleBuyCredits = async () => {
        if (!selectedListing || !buyAmount) return;

        try {
            setLoading(true);
            setError(null);
            // Placeholder - replace with actual API call when backend is ready
            setSuccess('Successfully purchased carbon credits!');
            setBuyDialogOpen(false);
            setBuyAmount('');
            setSelectedListing(null);
            fetchCarbonCredits();
            fetchTradeHistory();
            fetchMarketListings();
        } catch (err: any) {
            setError(err.message || 'Failed to buy credits');
        } finally {
            setLoading(false);
        }
    };

    const handleSellCredits = async () => {
        if (!sellAmount || !sellPrice) return;

        try {
            setLoading(true);
            setError(null);
            // Placeholder - replace with actual API call when backend is ready
            setSuccess('Successfully listed carbon credits for sale!');
            setSellDialogOpen(false);
            setSellAmount('');
            setSellPrice('');
            fetchCarbonCredits();
            fetchMarketListings();
        } catch (err: any) {
            setError(err.message || 'Failed to sell credits');
        } finally {
            setLoading(false);
        }
    };

    const openBuyDialog = (listing: MarketListing) => {
        setSelectedListing(listing);
        setBuyDialogOpen(true);
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Carbon Credit Trading
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Buy and sell carbon credits in the marketplace
                    </Typography>
                </Box>

                {/* Alerts */}
                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {/* Overview Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <AccountBalance color="primary" sx={{ mr: 1 }} />
                                    <Typography variant="h6">Total Credits</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold">
                                    {carbonCredits?.totalCredits?.toFixed(2) || '0.00'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Carbon credits owned
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <ShoppingCart color="success" sx={{ mr: 1 }} />
                                    <Typography variant="h6">Available</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="success.main">
                                    {carbonCredits?.availableCredits?.toFixed(2) || '0.00'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Available for trading
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Remove color="error" sx={{ mr: 1 }} />
                                    <Typography variant="h6">Retired</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="error.main">
                                    {carbonCredits?.retiredCredits?.toFixed(2) || '0.00'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Retired credits
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <TrendingUp color="info" sx={{ mr: 1 }} />
                                    <Typography variant="h6">Market Price</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight="bold" color="info.main">
                                    ${carbonCredits?.pricePerCredit?.toFixed(2) || '0.00'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Per credit
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Actions */}
                <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => setBuyDialogOpen(true)}
                        disabled={loading}
                    >
                        Buy Credits
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Remove />}
                        onClick={() => setSellDialogOpen(true)}
                        disabled={loading || !carbonCredits?.availableCredits}
                    >
                        Sell Credits
                    </Button>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                        <Tab label="Market" icon={<ShoppingCart />} iconPosition="start" />
                        <Tab label="Price History" icon={<TrendingUp />} iconPosition="start" />
                        <Tab label="Trade History" icon={<History />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                {tabValue === 0 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Market Listings
                            </Typography>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Seller</TableCell>
                                                <TableCell align="right">Credits</TableCell>
                                                <TableCell align="right">Price/Credit</TableCell>
                                                <TableCell align="right">Total Value</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {marketListings.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center">
                                                        No market listings available
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                marketListings.map((listing) => (
                                                    <TableRow key={listing._id}>
                                                        <TableCell>{listing.seller}</TableCell>
                                                        <TableCell align="right">{listing.credits.toFixed(2)}</TableCell>
                                                        <TableCell align="right">${listing.pricePerCredit.toFixed(2)}</TableCell>
                                                        <TableCell align="right">${listing.totalValue.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={listing.status}
                                                                color={listing.status === 'active' ? 'success' : 'default'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => openBuyDialog(listing)}
                                                                disabled={listing.status !== 'active'}
                                                            >
                                                                Buy
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                )}

                {tabValue === 1 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Price History
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={priceHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="price" stroke="#1976d2" name="Price ($)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {tabValue === 2 && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Trade History
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell align="right">Credits</TableCell>
                                            <TableCell align="right">Price/Credit</TableCell>
                                            <TableCell align="right">Total Amount</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tradeHistory.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    No trade history available
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            tradeHistory.map((trade) => (
                                                <TableRow key={trade._id}>
                                                    <TableCell>
                                                        {new Date(trade.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.type.toUpperCase()}
                                                            color={trade.type === 'buy' ? 'primary' : 'secondary'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">{trade.credits.toFixed(2)}</TableCell>
                                                    <TableCell align="right">${trade.pricePerCredit.toFixed(2)}</TableCell>
                                                    <TableCell align="right">${trade.totalAmount.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={trade.status}
                                                            color={trade.status === 'completed' ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Buy Dialog */}
            <Dialog open={buyDialogOpen} onClose={() => setBuyDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Buy Carbon Credits</DialogTitle>
                <DialogContent>
                    {selectedListing && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body2" gutterBottom>
                                Available Credits: <strong>{selectedListing.credits.toFixed(2)}</strong>
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                Price per Credit: <strong>${selectedListing.pricePerCredit.toFixed(2)}</strong>
                            </Typography>
                            <TextField
                                fullWidth
                                label="Number of Credits"
                                type="number"
                                value={buyAmount}
                                onChange={(e) => setBuyAmount(e.target.value)}
                                margin="normal"
                                inputProps={{ min: 0, max: selectedListing.credits, step: 0.01 }}
                            />
                            {buyAmount && (
                                <Typography variant="h6" sx={{ mt: 2 }}>
                                    Total: ${(parseFloat(buyAmount) * selectedListing.pricePerCredit).toFixed(2)}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBuyDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleBuyCredits}
                        variant="contained"
                        disabled={!buyAmount || loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Buy'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Sell Dialog */}
            <Dialog open={sellDialogOpen} onClose={() => setSellDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Sell Carbon Credits</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Available Credits: <strong>{carbonCredits?.availableCredits?.toFixed(2) || '0.00'}</strong>
                        </Typography>
                        <TextField
                            fullWidth
                            label="Number of Credits"
                            type="number"
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                            margin="normal"
                            inputProps={{ min: 0, max: carbonCredits?.availableCredits, step: 0.01 }}
                        />
                        <TextField
                            fullWidth
                            label="Price per Credit"
                            type="number"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            margin="normal"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                        />
                        {sellAmount && sellPrice && (
                            <Typography variant="h6" sx={{ mt: 2 }}>
                                Total Value: ${(parseFloat(sellAmount) * parseFloat(sellPrice)).toFixed(2)}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSellDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSellCredits}
                        variant="contained"
                        disabled={!sellAmount || !sellPrice || loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'List for Sale'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CarbonTrading;
