import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Description as DocumentIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Eco as EcoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import documentService from '../services/documentService';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  documentType: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'duplicate';
  createdAt: string;
  extractedData?: {
    amount: number;
    vendor: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    };
    date: string;
    description: string;
    category: string;
    subcategory?: string;
    items?: Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
      total: number;
    }>;
    tax?: {
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    };
    paymentMethod?: string;
    referenceNumber?: string;
  };
  duplicateDetection?: {
    isDuplicate: boolean;
    duplicateType: string;
    similarityScore: number;
    matchedDocumentId: string;
    duplicateReasons: string[];
  };
  processingResults?: {
    confidence: number;
    processingTime: number;
    errors: string[];
    warnings: string[];
  };
  carbonFootprint?: {
    co2Emissions: number;
    emissionFactor: number;
    calculationMethod: string;
    sustainabilityScore: number;
  };
  notes?: string;
  tags?: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState({
    notes: '',
    tags: '',
    documentType: 'bill'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState({
    status: '',
    documentType: '',
    search: ''
  });
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchDocuments();
    fetchStatistics();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocuments({
        page: page + 1,
        limit: rowsPerPage,
        ...filter
      });
      if (response.success) {
        setDocuments(response.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await documentService.getStatistics();
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDocument = async (document: Document) => {
    try {
      const response = await documentService.getDocument(document.id);
      if (response.success) {
        setSelectedDocument(response.document);
        setViewDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching document details:', error);
      setError('Failed to fetch document details');
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      documentService.createDownloadLink(blob, document.originalName);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setError(null);
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const handleReprocessDocument = async (documentId: string) => {
    try {
      await documentService.reprocessDocument(documentId);
      fetchDocuments();
      setError(null);
    } catch (error) {
      console.error('Error reprocessing document:', error);
      setError('Failed to reprocess document');
    }
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setEditForm({
      notes: document.notes || '',
      tags: document.tags?.join(', ') || '',
      documentType: document.documentType
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDocument) return;

    try {
      const response = await documentService.updateDocument(editingDocument.id, {
        notes: editForm.notes,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        documentType: editForm.documentType
      });

      if (response.success) {
        setDocuments(prev => prev.map(doc => 
          doc.id === editingDocument.id ? response.document : doc
        ));
        setEditDialogOpen(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      setError('Failed to update document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'duplicate':
        return <WarningIcon color="warning" />;
      case 'processing':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'success';
      case 'failed':
        return 'error';
      case 'duplicate':
        return 'warning';
      case 'processing':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter.status && doc.status !== filter.status) return false;
    if (filter.documentType && doc.documentType !== filter.documentType) return false;
    if (filter.search && !doc.originalName.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Document Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your uploaded bills, receipts, and invoices with automatic processing and duplicate detection.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Overview */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DocumentIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{statistics.totalDocuments}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Documents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">₹{statistics.totalAmount?.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EcoIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{statistics.totalCarbonFootprint?.toFixed(2)} kg</Typography>
                    <Typography variant="body2" color="text.secondary">
                      CO₂ Emissions
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{statistics.duplicateCount}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duplicates Found
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Documents" />
          <Tab label="Duplicates" />
          <Tab label="Processing" />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {/* All Documents Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="uploaded">Uploaded</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="duplicate">Duplicate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filter.documentType}
                  onChange={(e) => setFilter({ ...filter, documentType: e.target.value })}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="bill">Bill</MenuItem>
                  <MenuItem value="receipt">Receipt</MenuItem>
                  <MenuItem value="invoice">Invoice</MenuItem>
                  <MenuItem value="statement">Statement</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={fetchDocuments}
                fullWidth
              >
                Filter
              </Button>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" noWrap>
                          {document.originalName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={document.documentType} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(document.status)}
                        <Chip
                          label={document.status}
                          color={getStatusColor(document.status) as any}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {document.extractedData?.amount ? 
                        `₹${document.extractedData.amount.toLocaleString()}` : 
                        'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(document.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(document)}
                        title="View Details"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadDocument(document)}
                        title="Download"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditDocument(document)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleReprocessDocument(document.id)}
                        title="Reprocess"
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDocument(document.id)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredDocuments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}
      </TabPanel>

      {/* Duplicates Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Duplicate Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Documents that have been identified as potential duplicates based on similarity analysis.
        </Typography>
        
        {documents.filter(doc => doc.duplicateDetection?.isDuplicate).map((document) => (
          <Card key={document.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">{document.originalName}</Typography>
                <Chip
                  label={`${(document.duplicateDetection?.similarityScore || 0) * 100}% similar`}
                  color="warning"
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Type: {document.documentType} | 
                Amount: {document.extractedData?.amount ? `₹${document.extractedData.amount.toLocaleString()}` : 'N/A'} |
                Date: {document.extractedData?.date ? new Date(document.extractedData.date).toLocaleDateString() : 'N/A'}
              </Typography>
              
              {document.duplicateDetection?.duplicateReasons && (
                <Typography variant="body2" color="text.secondary">
                  Reasons: {document.duplicateDetection.duplicateReasons.join(', ')}
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => handleViewDocument(document)}>
                View Details
              </Button>
              <Button size="small" color="error" onClick={() => handleDeleteDocument(document.id)}>
                Delete
              </Button>
            </CardActions>
          </Card>
        ))}
        
        {documents.filter(doc => doc.duplicateDetection?.isDuplicate).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No duplicate documents found
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Processing Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Processing Status
        </Typography>
        
        {documents.filter(doc => doc.status === 'processing' || doc.status === 'uploaded').map((document) => (
          <Card key={document.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">{document.originalName}</Typography>
                <Chip
                  label={document.status}
                  color="info"
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              
              {document.status === 'processing' && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Processing document...
                  </Typography>
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Uploaded: {new Date(document.createdAt).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
        
        {documents.filter(doc => doc.status === 'processing' || doc.status === 'uploaded').length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No documents currently processing
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Statistics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          Document Statistics
        </Typography>
        
        {statistics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Documents by Type
                  </Typography>
                  {Object.entries(statistics.documentsByType || {}).map(([type, count]) => (
                    <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{type}</Typography>
                      <Typography variant="body2" fontWeight="bold">{count as number}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Documents by Status
                  </Typography>
                  {Object.entries(statistics.documentsByStatus || {}).map(([status, count]) => (
                    <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{status}</Typography>
                      <Typography variant="body2" fontWeight="bold">{count as number}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Processing Performance
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Average Processing Time</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {statistics.averageProcessingTime ? `${statistics.averageProcessingTime.toFixed(0)}ms` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Duplicates Found</Typography>
                    <Typography variant="body2" fontWeight="bold">{statistics.duplicateCount}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedDocument.originalName}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip label={selectedDocument.documentType} />
                <Chip 
                  label={selectedDocument.status} 
                  color={getStatusColor(selectedDocument.status) as any}
                />
                {selectedDocument.duplicateDetection?.isDuplicate && (
                  <Chip label="Duplicate" color="warning" />
                )}
              </Box>

              {selectedDocument.extractedData && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Extracted Data</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight="bold">Amount:</Typography>
                        <Typography variant="body2">₹{selectedDocument.extractedData.amount?.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight="bold">Date:</Typography>
                        <Typography variant="body2">
                          {selectedDocument.extractedData.date ? 
                            new Date(selectedDocument.extractedData.date).toLocaleDateString() : 
                            'N/A'
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" fontWeight="bold">Vendor:</Typography>
                        <Typography variant="body2">{selectedDocument.extractedData.vendor?.name || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" fontWeight="bold">Description:</Typography>
                        <Typography variant="body2">{selectedDocument.extractedData.description || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedDocument.carbonFootprint && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Carbon Footprint</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight="bold">CO₂ Emissions:</Typography>
                        <Typography variant="body2">{selectedDocument.carbonFootprint.co2Emissions?.toFixed(2)} kg</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight="bold">Sustainability Score:</Typography>
                        <Typography variant="body2">{selectedDocument.carbonFootprint.sustainabilityScore}/100</Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {selectedDocument.processingResults && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Processing Results</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight="bold">Confidence:</Typography>
                        <Typography variant="body2">{(selectedDocument.processingResults.confidence * 100).toFixed(1)}%</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" fontWeight="bold">Processing Time:</Typography>
                        <Typography variant="body2">{selectedDocument.processingResults.processingTime}ms</Typography>
                      </Grid>
                      {selectedDocument.processingResults.errors.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" fontWeight="bold" color="error">Errors:</Typography>
                          <List dense>
                            {selectedDocument.processingResults.errors.map((error, index) => (
                              <ListItem key={index}>
                                <ListItemIcon><ErrorIcon color="error" /></ListItemIcon>
                                <ListItemText primary={error} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}
                      {selectedDocument.processingResults.warnings.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" fontWeight="bold" color="warning">Warnings:</Typography>
                          <List dense>
                            {selectedDocument.processingResults.warnings.map((warning, index) => (
                              <ListItem key={index}>
                                <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                                <ListItemText primary={warning} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedDocument && (
            <>
              <Button onClick={() => handleDownloadDocument(selectedDocument)}>
                Download
              </Button>
              <Button onClick={() => handleEditDocument(selectedDocument)}>
                Edit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editForm.tags}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={editForm.documentType}
              onChange={(e) => setEditForm({ ...editForm, documentType: e.target.value })}
            >
              <MenuItem value="bill">Bill</MenuItem>
              <MenuItem value="receipt">Receipt</MenuItem>
              <MenuItem value="invoice">Invoice</MenuItem>
              <MenuItem value="statement">Statement</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;