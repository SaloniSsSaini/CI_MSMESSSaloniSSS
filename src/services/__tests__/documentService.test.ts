import DocumentService from '../documentService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.URL
const mockURL = {
  createObjectURL: jest.fn(),
  revokeObjectURL: jest.fn(),
};
Object.defineProperty(window, 'URL', {
  value: mockURL,
});

// Mock document methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockURL.createObjectURL.mockReturnValue('blob:url');
    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    });
  });

  describe('uploadDocument', () => {
    test('uploads document with correct data', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Document uploaded successfully',
          document: { id: 'doc-123', fileName: 'test.pdf' },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.uploadDocument(mockFile, 'bill', 'Test notes');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/documents/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      expect(result).toEqual(mockResponse.data);
    });

    test('uploads document with default parameters', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        data: {
          success: true,
          message: 'Document uploaded successfully',
          document: { id: 'doc-123', fileName: 'test.pdf' },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.uploadDocument(mockFile);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/documents/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      expect(result).toEqual(mockResponse.data);
    });

    test('handles upload error', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const error = new Error('Upload failed');

      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(DocumentService.uploadDocument(mockFile)).rejects.toThrow('Upload failed');
    });
  });

  describe('getDocuments', () => {
    test('fetches documents with default parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
          pagination: { current: 1, pages: 1, total: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.getDocuments();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents', {
        params: {},
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('fetches documents with query parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
          pagination: { current: 1, pages: 1, total: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const params = {
        page: 2,
        limit: 10,
        status: 'processed',
        documentType: 'bill',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      const result = await DocumentService.getDocuments(params);

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents', {
        params,
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('handles fetch error', async () => {
      const error = new Error('Fetch failed');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(DocumentService.getDocuments()).rejects.toThrow('Fetch failed');
    });
  });

  describe('getDocument', () => {
    test('fetches specific document by ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          document: { id: 'doc-123', fileName: 'test.pdf' },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.getDocument('doc-123');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents/doc-123');

      expect(result).toEqual(mockResponse.data);
    });

    test('handles fetch error', async () => {
      const error = new Error('Document not found');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(DocumentService.getDocument('doc-123')).rejects.toThrow('Document not found');
    });
  });

  describe('downloadDocument', () => {
    test('downloads document as blob', async () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      const mockResponse = {
        data: mockBlob,
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.downloadDocument('doc-123');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents/doc-123/download', {
        responseType: 'blob',
      });

      expect(result).toEqual(mockBlob);
    });

    test('handles download error', async () => {
      const error = new Error('Download failed');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(DocumentService.downloadDocument('doc-123')).rejects.toThrow('Download failed');
    });
  });

  describe('updateDocument', () => {
    test('updates document metadata', async () => {
      const mockResponse = {
        data: {
          success: true,
          document: { id: 'doc-123', fileName: 'test.pdf', notes: 'Updated notes' },
        },
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const updates = {
        notes: 'Updated notes',
        tags: ['important'],
        documentType: 'invoice',
      };

      const result = await DocumentService.updateDocument('doc-123', updates);

      expect(mockedAxios.put).toHaveBeenCalledWith('http://localhost:5000/api/documents/doc-123', updates);

      expect(result).toEqual(mockResponse.data);
    });

    test('handles update error', async () => {
      const error = new Error('Update failed');

      mockedAxios.put.mockRejectedValueOnce(error);

      await expect(DocumentService.updateDocument('doc-123', { notes: 'test' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteDocument', () => {
    test('deletes document', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Document deleted successfully',
        },
      };

      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.deleteDocument('doc-123');

      expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:5000/api/documents/doc-123');

      expect(result).toEqual(mockResponse.data);
    });

    test('handles delete error', async () => {
      const error = new Error('Delete failed');

      mockedAxios.delete.mockRejectedValueOnce(error);

      await expect(DocumentService.deleteDocument('doc-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('reprocessDocument', () => {
    test('reprocesses document', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Document reprocessed successfully',
          result: { extractedData: { amount: 1000 } },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.reprocessDocument('doc-123');

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/api/documents/doc-123/reprocess');

      expect(result).toEqual(mockResponse.data);
    });

    test('handles reprocess error', async () => {
      const error = new Error('Reprocess failed');

      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(DocumentService.reprocessDocument('doc-123')).rejects.toThrow('Reprocess failed');
    });
  });

  describe('getStatistics', () => {
    test('fetches document statistics', async () => {
      const mockResponse = {
        data: {
          success: true,
          statistics: {
            totalDocuments: 100,
            documentsByType: { bill: 50, invoice: 30, receipt: 20 },
            documentsByStatus: { processed: 80, failed: 10, processing: 10 },
            totalAmount: 100000,
            totalCarbonFootprint: 500,
            duplicateCount: 5,
            averageProcessingTime: 2.5,
            documentsByMonth: { '2023-01': 10, '2023-02': 15 },
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.getStatistics();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents/statistics/overview', {
        params: {},
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('fetches statistics with date range', async () => {
      const mockResponse = {
        data: {
          success: true,
          statistics: { totalDocuments: 50 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const params = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      const result = await DocumentService.getStatistics(params);

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents/statistics/overview', {
        params,
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('handles statistics error', async () => {
      const error = new Error('Statistics fetch failed');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(DocumentService.getStatistics()).rejects.toThrow('Statistics fetch failed');
    });
  });

  describe('getDuplicates', () => {
    test('fetches duplicate documents', async () => {
      const mockResponse = {
        data: {
          success: true,
          documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
          pagination: { current: 1, pages: 1, total: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await DocumentService.getDuplicates();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents/duplicates', {
        params: {},
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('fetches duplicates with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          documents: [{ id: 'doc-1', fileName: 'test.pdf' }],
          pagination: { current: 1, pages: 1, total: 1 },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const params = {
        page: 2,
        limit: 10,
      };

      const result = await DocumentService.getDuplicates(params);

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/documents/duplicates', {
        params,
      });

      expect(result).toEqual(mockResponse.data);
    });

    test('handles duplicates error', async () => {
      const error = new Error('Duplicates fetch failed');

      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(DocumentService.getDuplicates()).rejects.toThrow('Duplicates fetch failed');
    });
  });

  describe('createDownloadLink', () => {
    test('creates download link and triggers download', () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test.pdf';

      const result = DocumentService.createDownloadLink(mockBlob, filename);

      expect(mockURL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
      expect(result).toBe('blob:url');
    });
  });

  describe('formatFileSize', () => {
    test('formats file size correctly', () => {
      expect(DocumentService.formatFileSize(0)).toBe('0 Bytes');
      expect(DocumentService.formatFileSize(1024)).toBe('1 KB');
      expect(DocumentService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(DocumentService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(DocumentService.formatFileSize(1536)).toBe('1.5 KB');
      expect(DocumentService.formatFileSize(1536 * 1024)).toBe('1.5 MB');
    });

    test('handles very large file sizes', () => {
      expect(DocumentService.formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1024 GB');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const dateString = '2023-01-15T10:30:00Z';
      const result = DocumentService.formatDate(dateString);

      expect(result).toMatch(/Jan 15, 2023/);
      expect(result).toMatch(/10:30/);
    });

    test('handles different date formats', () => {
      const dateString = '2023-12-25T23:59:59Z';
      const result = DocumentService.formatDate(dateString);

      expect(result).toMatch(/Dec 25, 2023/);
      expect(result).toMatch(/11:59/);
    });
  });

  describe('getStatusColor', () => {
    test('returns correct color for each status', () => {
      expect(DocumentService.getStatusColor('processed')).toBe('success');
      expect(DocumentService.getStatusColor('failed')).toBe('error');
      expect(DocumentService.getStatusColor('duplicate')).toBe('warning');
      expect(DocumentService.getStatusColor('processing')).toBe('info');
      expect(DocumentService.getStatusColor('uploaded')).toBe('default');
      expect(DocumentService.getStatusColor('unknown')).toBe('default');
    });
  });

  describe('getDocumentTypeIcon', () => {
    test('returns correct icon for each document type', () => {
      expect(DocumentService.getDocumentTypeIcon('bill')).toBe('📄');
      expect(DocumentService.getDocumentTypeIcon('receipt')).toBe('🧾');
      expect(DocumentService.getDocumentTypeIcon('invoice')).toBe('📋');
      expect(DocumentService.getDocumentTypeIcon('statement')).toBe('📊');
      expect(DocumentService.getDocumentTypeIcon('unknown')).toBe('📄');
    });
  });

  describe('validateFile', () => {
    test('validates PDF file correctly', () => {
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = DocumentService.validateFile(validFile);

      expect(result).toEqual({ valid: true });
    });

    test('rejects non-PDF files', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = DocumentService.validateFile(invalidFile);

      expect(result).toEqual({ valid: false, error: 'Only PDF files are allowed' });
    });

    test('rejects files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
      const result = DocumentService.validateFile(largeFile);

      expect(result).toEqual({ valid: false, error: 'File size must be less than 10MB' });
    });

    test('accepts files at the size limit', () => {
      const maxSizeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
      const result = DocumentService.validateFile(maxSizeFile);

      expect(result).toEqual({ valid: true });
    });

    test('accepts files just under the size limit', () => {
      const underLimitFile = new File(['x'.repeat(9 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
      const result = DocumentService.validateFile(underLimitFile);

      expect(result).toEqual({ valid: true });
    });
  });
});
