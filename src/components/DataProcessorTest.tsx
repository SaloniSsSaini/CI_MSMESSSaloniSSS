import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    Divider,
    LinearProgress,
    IconButton,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Description as FileIcon,
    CheckCircle as ValidIcon,
    Error as ErrorIcon,
    Category as CategoryIcon,
    Analytics as AnalyticsIcon,
    ExpandMore as ExpandIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const categoryIcons: { [key: string]: string } = {
    energy: '⚡',
    water: '💧',
    transportation: '🚛',
    raw_materials: '🏭',
    equipment: '⚙️',
    maintenance: '🔧',
    waste_management: '🗑️',
    other: '📦',
    unknown: '❓'
};

const categoryColors: { [key: string]: string } = {
    energy: '#FFA726',
    water: '#42A5F5',
    transportation: '#66BB6A',
    raw_materials: '#AB47BC',
    equipment: '#78909C',
    maintenance: '#5C6BC0',
    waste_management: '#8D6E63',
    other: '#BDBDBD',
    unknown: '#E0E0E0'
};

const DataProcessorTest: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [tabValue, setTabValue] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/data-processor/test`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to process file');
        } finally {
            setLoading(false);
        }
    };

    const handleTestSample = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Fetch sample data first
            const sampleResponse = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/data-processor/sample-data`
            );

            // Then process it
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/data-processor/test-json`,
                { transactions: sampleResponse.data.sampleData }
            );
            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to process sample data');
        } finally {
            setLoading(false);
        }
    };

    const handleTestSMSSample = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Fetch SMS sample data
            const sampleResponse = await axios.get(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/data-processor/sample-data`
            );

            // Process SMS data through the test endpoint
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/data-processor/test-json`,
                { transactions: sampleResponse.data.smsSampleData }
            );
            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to process SMS sample data');
        } finally {
            setLoading(false);
        }
    };

    const downloadSampleCSV = () => {
        const csvContent = `description,amount,date,vendor
Electricity Bill - March 2024,15000,2024-03-15,MSEDCL
Diesel Fuel for Generator,8000,2024-03-10,BPCL
Steel rods purchase - 500 kg,75000,2024-03-05,Tata Steel
Freight charges - 200 km transport,25000,2024-03-08,Blue Dart
Water bill - monthly,3500,2024-03-01,Municipal Corp
Waste disposal - monthly,5500,2024-03-30,Clean City
Solar panel maintenance,8000,2024-03-15,Green Energy Corp
Office supplies - general,3500,2024-03-10,Amazon Business`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadSMSSampleCSV = () => {
        const csvContent = `text,updateAt,senderAddress
"Received Rs.600.00 in your a/c 91XXX1635 from One97 Communications Limited on 6-5-2022. Ref no: 5C05RA03uMMS. -PPBL",2022-05-06T19:48:00,AX-PAYTMB
"Your electricity bill of Rs.2,500 for meter 12345678 has been generated. Due date 15-May-2022. Pay via UPI.",2022-05-07T10:30:00,MSEDCL
"Thank you for fueling at BPCL. Diesel purchase Rs.3,500 Liters: 35.5 Vehicle: MH12AB1234. Visit bfrpoints.com",2022-05-08T14:25:00,BPCL
"Water bill Rs.750 for connection 987654 generated. Pay before 20-May to avoid disconnection. -Municipal Corp",2022-05-09T09:00:00,Municipal
"Your shipment AWB123456789 has been delivered. Freight charges Rs.1,200 paid via COD. -BlueDart",2022-05-10T16:45:00,BlueDart
"Order confirmed: Steel rods 100kg Rs.15,000 Order#78901. Delivery in 3 days. -TataSteel Dealers",2022-05-11T11:20:00,TataSteel`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_sms_transactions.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setTabValue(0);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AnalyticsIcon fontSize="large" />
                    Data Processor Agent Test
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                    Upload a CSV or Excel file to test the Data Processor Agent's cleaning, classification, and enrichment capabilities.
                </Typography>
            </Paper>

            <Grid container spacing={3}>
                {/* Upload Section */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UploadIcon /> Upload Transaction Data
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            {/* Drag & Drop Zone */}
                            <Box
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                sx={{
                                    border: `2px dashed ${dragActive ? '#667eea' : '#ccc'}`,
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: 'center',
                                    backgroundColor: dragActive ? 'rgba(102,126,234,0.1)' : '#fafafa',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderColor: '#667eea',
                                        backgroundColor: 'rgba(102,126,234,0.05)'
                                    }
                                }}
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <UploadIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">
                                    Drag & Drop or Click to Upload
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Supports CSV and Excel files
                                </Typography>
                            </Box>

                            {file && (
                                <Alert severity="info" sx={{ mt: 2 }} icon={<FileIcon />}>
                                    <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </Alert>
                            )}

                            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        flex: 1
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Process File'}
                                </Button>
                                <Tooltip title="Reset">
                                    <IconButton onClick={reset} color="primary">
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider sx={{ my: 3 }}>OR</Divider>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleTestSample}
                                    disabled={loading}
                                    startIcon={<AnalyticsIcon />}
                                    sx={{ flex: 1 }}
                                >
                                    Test Structured Data
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleTestSMSSample}
                                    disabled={loading}
                                    startIcon={<AnalyticsIcon />}
                                    color="secondary"
                                    sx={{ flex: 1 }}
                                >
                                    📱 Test SMS Data
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={downloadSampleCSV}
                                    startIcon={<DownloadIcon />}
                                >
                                    Download Structured CSV
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={downloadSMSSampleCSV}
                                    startIcon={<DownloadIcon />}
                                    color="secondary"
                                >
                                    Download SMS CSV
                                </Button>
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Results Section */}
                <Grid item xs={12} md={7}>
                    {result ? (
                        <Card>
                            <CardContent>
                                {/* Summary Stats */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        📊 Processing Results
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                                                <Typography variant="h4" color="primary">{result.summary.totalInput}</Typography>
                                                <Typography variant="caption">Total Input</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                                                <Typography variant="h4" color="success.main">{result.summary.successfullyClassified}</Typography>
                                                <Typography variant="caption">Classified</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                                                <Typography variant="h4" color="warning.main">{result.summary.validTransactions}</Typography>
                                                <Typography variant="caption">Valid</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fce4ec' }}>
                                                <Typography variant="h4" color="error.main">{result.summary.invalidTransactions}</Typography>
                                                <Typography variant="caption">Errors</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            Classification Rate: <strong>{result.summary.classificationRate}</strong>
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={parseFloat(result.summary.classificationRate)}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                </Box>

                                {/* Category Breakdown */}
                                <Accordion defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandIcon />}>
                                        <Typography variant="subtitle1">
                                            <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Category Breakdown
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {Object.entries(result.categoryBreakdown).map(([category, data]: [string, any]) => (
                                                <Chip
                                                    key={category}
                                                    label={`${categoryIcons[category] || '📦'} ${category}: ${data.count}`}
                                                    sx={{
                                                        bgcolor: categoryColors[category] || '#E0E0E0',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Tabs for detailed results */}
                                <Box sx={{ mt: 3 }}>
                                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                                        <Tab label="Classified" />
                                        <Tab label="Enriched" />
                                        <Tab label="Errors" />
                                    </Tabs>

                                    <TabPanel value={tabValue} index={0}>
                                        <TableContainer sx={{ maxHeight: 400 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Description</TableCell>
                                                        <TableCell>Amount</TableCell>
                                                        <TableCell>Category</TableCell>
                                                        <TableCell>Subcategory</TableCell>
                                                        <TableCell>Confidence</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {result.results.classified.map((tx: any, idx: number) => (
                                                        <TableRow key={idx} hover>
                                                            <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {tx.description || '-'}
                                                            </TableCell>
                                                            <TableCell>₹{tx.amount?.toLocaleString() || 0}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    size="small"
                                                                    label={`${categoryIcons[tx.category] || ''} ${tx.category || 'unknown'}`}
                                                                    sx={{ bgcolor: categoryColors[tx.category] || '#E0E0E0', color: 'white' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{tx.subcategory || '-'}</TableCell>
                                                            <TableCell>
                                                                {tx.confidence ? `${(tx.confidence * 100).toFixed(0)}%` : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={1}>
                                        {result.results.enriched.length > 0 ? (
                                            <TableContainer sx={{ maxHeight: 400 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Description</TableCell>
                                                            <TableCell>Sustainability</TableCell>
                                                            <TableCell>Energy Source</TableCell>
                                                            <TableCell>Material Type</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {result.results.enriched.map((tx: any, idx: number) => (
                                                            <TableRow key={idx} hover>
                                                                <TableCell>{tx.description || '-'}</TableCell>
                                                                <TableCell>
                                                                    {tx.sustainability ? (
                                                                        <Chip
                                                                            size="small"
                                                                            icon={tx.sustainability.isGreen ? <ValidIcon /> : undefined}
                                                                            label={`Score: ${tx.sustainability.greenScore}`}
                                                                            color={tx.sustainability.isGreen ? 'success' : 'default'}
                                                                        />
                                                                    ) : '-'}
                                                                </TableCell>
                                                                <TableCell>{tx.energySource || '-'}</TableCell>
                                                                <TableCell>{tx.materialType || '-'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Alert severity="info">No enrichment data available</Alert>
                                        )}
                                    </TabPanel>

                                    <TabPanel value={tabValue} index={2}>
                                        {result.results.validationErrors.length > 0 ? (
                                            <TableContainer sx={{ maxHeight: 400 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Description</TableCell>
                                                            <TableCell>Amount</TableCell>
                                                            <TableCell>Errors</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {result.results.validationErrors.map((tx: any, idx: number) => (
                                                            <TableRow key={idx} hover>
                                                                <TableCell>{tx.description || '(empty)'}</TableCell>
                                                                <TableCell>₹{tx.amount?.toLocaleString() || 0}</TableCell>
                                                                <TableCell>
                                                                    {tx.validationErrors?.map((err: string, i: number) => (
                                                                        <Chip
                                                                            key={i}
                                                                            size="small"
                                                                            label={err}
                                                                            color="error"
                                                                            icon={<ErrorIcon />}
                                                                            sx={{ m: 0.5 }}
                                                                        />
                                                                    ))}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Alert severity="success" icon={<ValidIcon />}>
                                                All transactions passed validation!
                                            </Alert>
                                        )}
                                    </TabPanel>
                                </Box>

                                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        Processing Time: <strong>{result.processingTime}</strong> |
                                        Enrichment Rate: <strong>{result.summary.enrichmentRate}</strong>
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CardContent sx={{ textAlign: 'center', py: 8 }}>
                                <AnalyticsIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">
                                    Upload a file or test with sample data
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Results will appear here after processing
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Instructions */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>📋 Instructions</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>📋 Structured CSV/Excel:</Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                            <li><strong>description</strong> - Transaction description</li>
                            <li><strong>amount</strong> - Transaction amount</li>
                            <li><strong>date</strong> - Transaction date</li>
                            <li><strong>vendor</strong> - Vendor name (optional)</li>
                        </ul>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>📱 SMS Format (Mobile):</Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                            <li><strong>text</strong> - Raw SMS message text</li>
                            <li><strong>updateAt</strong> - Timestamp</li>
                            <li><strong>senderAddress</strong> - SMS sender</li>
                            <li>Amounts extracted automatically from Rs.XXX</li>
                        </ul>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>🔄 The Agent Will:</Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                            <li>🧹 <strong>Clean</strong> - Normalize text & amounts</li>
                            <li>🏷️ <strong>Classify</strong> - Detect categories</li>
                            <li>🔍 <strong>Enrich</strong> - Add sustainability data</li>
                            <li>✅ <strong>Validate</strong> - Check for errors</li>
                        </ul>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default DataProcessorTest;
