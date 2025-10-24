import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Document {
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

export interface DocumentStatistics {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;
  totalAmount: number;
  totalCarbonFootprint: number;
  duplicateCount: number;
  averageProcessingTime: number;
  documentsByMonth: Record<string, number>;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  document: Document;
}

export interface DocumentsResponse {
  success: boolean;
  documents: Document[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface StatisticsResponse {
  success: boolean;
  statistics: DocumentStatistics;
}

class DocumentService {
  private baseURL = API_BASE_URL;

  /**
   * Upload a document
   */
  async uploadDocument(
    file: File, 
    documentType: string = 'bill', 
    notes?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    if (notes) {
      formData.append('notes', notes);
    }

    const response = await axios.post(`${this.baseURL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get all documents with pagination and filters
   */
  async getDocuments(params: {
    page?: number;
    limit?: number;
    status?: string;
    documentType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<DocumentsResponse> {
    const response = await axios.get(`${this.baseURL}/documents`, {
      params,
    });

    return response.data;
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(id: string): Promise<{ success: boolean; document: Document }> {
    const response = await axios.get(`${this.baseURL}/documents/${id}`);
    return response.data;
  }

  /**
   * Download a document
   */
  async downloadDocument(id: string): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/documents/${id}/download`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    id: string, 
    updates: {
      notes?: string;
      tags?: string[];
      documentType?: string;
    }
  ): Promise<{ success: boolean; document: Document }> {
    const response = await axios.put(`${this.baseURL}/documents/${id}`, updates);
    return response.data;
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${this.baseURL}/documents/${id}`);
    return response.data;
  }

  /**
   * Reprocess a document
   */
  async reprocessDocument(id: string): Promise<{ success: boolean; message: string; result?: any }> {
    const response = await axios.post(`${this.baseURL}/documents/${id}/reprocess`);
    return response.data;
  }

  /**
   * Get document statistics
   */
  async getStatistics(params: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<StatisticsResponse> {
    const response = await axios.get(`${this.baseURL}/documents/statistics/overview`, {
      params,
    });

    return response.data;
  }

  /**
   * Get duplicate documents
   */
  async getDuplicates(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<DocumentsResponse> {
    const response = await axios.get(`${this.baseURL}/documents/duplicates`, {
      params,
    });

    return response.data;
  }

  /**
   * Create a download link for a document
   */
  createDownloadLink(blob: Blob, filename: string): string {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return url;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
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
  }

  /**
   * Get document type icon
   */
  getDocumentTypeIcon(documentType: string): string {
    switch (documentType) {
      case 'bill':
        return '📄';
      case 'receipt':
        return '🧾';
      case 'invoice':
        return '📋';
      case 'statement':
        return '📊';
      default:
        return '📄';
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Only PDF files are allowed' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    return { valid: true };
  }
}

export default new DocumentService();