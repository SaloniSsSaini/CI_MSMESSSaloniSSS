import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import documentService from '../services/documentService';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  documentType: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed' | 'duplicate';
  createdAt: string;
  notes?: string;
  tags?: string[];
  extractedData?: {
    amount: number;
    vendor: {
      name: string;
    };
    date: string;
    description: string;
    category: string;
  };
  duplicateDetection?: {
    isDuplicate: boolean;
    duplicateType: string;
    similarityScore: number;
    matchedDocumentId: string;
  };
  processingResults?: {
    confidence: number;
    processingTime: number;
    errors: string[];
    warnings: string[];
  };
  carbonFootprint?: {
    co2Emissions: number;
    sustainabilityScore: number;
  };
}

interface DocumentUploadProps {
  onDocumentUploaded?: (document: Document) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentUploaded }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState({
    notes: '',
    tags: '',
    documentType: 'bill'
  });

  // Fetch documents on component mount
  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentService.getDocuments();
      if (response.success) {
        setDocuments(response.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      for (const file of acceptedFiles) {
        // Validate file before upload
        const validation = documentService.validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        const response = await documentService.uploadDocument(file, 'bill');
        if (response.success) {
          const newDocument = response.document;
          setDocuments(prev => [newDocument, ...prev]);
          onDocumentUploaded?.(newDocument);
        }
      }
      setSuccess(`Successfully uploaded ${acceptedFiles.length} document(s)`);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onDocumentUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: uploading
  });

  const handleViewDocument = async (document: Document) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      setError('Failed to view document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSuccess('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const handleReprocessDocument = async (documentId: string) => {
    try {
      await documentService.reprocessDocument(documentId);
      setSuccess('Document reprocessing started');
      // Refresh documents after a delay
      setTimeout(() => {
        fetchDocuments();
      }, 2000);
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
        setSuccess('Document updated successfully');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      setError('Failed to update document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <SuccessIcon color="success" />;
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Document Upload
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload bills, receipts, and invoices for automatic processing and carbon footprint calculation.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          mb: 3
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop PDF files here' : 'Drag & drop PDF files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Only PDF files are supported (max 10MB each)
        </Typography>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Documents List */}
      <Typography variant="h6" gutterBottom>
        Uploaded Documents ({documents.length})
      </Typography>

      <Grid container spacing={2}>
        {documents.map((document) => (
          <Grid item xs={12} md={6} lg={4} key={document.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" noWrap>
                    {document.originalName}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getStatusIcon(document.status)}
                  <Chip
                    label={document.status}
                    color={getStatusColor(document.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Type: {document.documentType}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Uploaded: {new Date(document.createdAt).toLocaleDateString()}
                </Typography>

                {document.extractedData && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Extracted Data:
                    </Typography>
                    <Typography variant="body2">
                      Amount: ₹{document.extractedData.amount?.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Vendor: {document.extractedData.vendor?.name}
                    </Typography>
                    <Typography variant="body2">
                      Date: {document.extractedData.date ? new Date(document.extractedData.date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                )}

                {document.duplicateDetection?.isDuplicate && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Duplicate detected ({document.duplicateDetection.duplicateType})
                  </Alert>
                )}

                {document.carbonFootprint && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Carbon Footprint:
                    </Typography>
                    <Typography variant="body2">
                      CO₂: {document.carbonFootprint.co2Emissions?.toFixed(2)} kg
                    </Typography>
                    <Typography variant="body2">
                      Sustainability Score: {document.carbonFootprint.sustainabilityScore}/100
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleViewDocument(document)}
                  title="View Document"
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleEditDocument(document)}
                  title="Edit Document"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleReprocessDocument(document.id)}
                  title="Reprocess Document"
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteDocument(document.id)}
                  title="Delete Document"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {documents.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No documents uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first bill or receipt to get started
          </Typography>
        </Box>
      )}

      {/* Edit Dialog */}
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

export default DocumentUpload;