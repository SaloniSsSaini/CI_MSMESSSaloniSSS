# Document Upload and Processing Feature

## Overview

This feature adds comprehensive PDF document upload, processing, and management capabilities to the Carbon Intelligence MSME platform. It includes automatic data extraction, duplicate detection, carbon footprint calculation, and document management tools.

## Features

### 1. PDF Upload
- **Drag & Drop Interface**: Easy file upload with visual feedback
- **File Validation**: Automatic validation of file type (PDF only) and size (10MB limit)
- **Batch Upload**: Support for uploading multiple documents at once
- **Progress Tracking**: Real-time upload progress indication

### 2. Document Processing
- **Automatic Data Extraction**: Extracts key information from PDFs including:
  - Vendor details (name, address, phone, email)
  - Transaction amount and currency
  - Date and description
  - Category and subcategory
  - Line items and tax information
  - Payment method and reference numbers
- **Carbon Footprint Calculation**: Automatically calculates CO₂ emissions based on extracted data
- **Confidence Scoring**: Provides confidence levels for extracted data accuracy

### 3. Duplicate Detection
- **Intelligent Matching**: Uses similarity algorithms to detect potential duplicates
- **Multiple Detection Types**:
  - Exact matches (95%+ similarity)
  - Near matches (80-95% similarity)
  - Fuzzy matches (65-80% similarity)
- **Similarity Factors**: Considers amount, vendor, date, description, and category
- **Duplicate Management**: Easy identification and management of duplicate documents

### 4. Document Management
- **Comprehensive Dashboard**: View all uploaded documents with filtering and search
- **Document Status Tracking**: Real-time status updates (uploaded, processing, processed, failed, duplicate)
- **Metadata Management**: Edit document notes, tags, and type
- **Document Actions**: View, download, edit, reprocess, and delete documents
- **Statistics and Analytics**: Detailed insights into document processing performance

## Technical Implementation

### Backend Components

#### 1. Document Model (`/backend/src/models/Document.js`)
```javascript
// Key fields include:
- Basic info: fileName, originalName, filePath, fileSize, mimeType
- Processing: status, extractedData, processingResults
- Duplicate detection: duplicateDetection object
- Carbon footprint: carbonFootprint calculations
- Metadata: notes, tags, upload source
```

#### 2. Document Processing Service (`/backend/src/services/documentProcessingService.js`)
- PDF text extraction and data parsing
- Duplicate detection algorithms
- Carbon footprint calculations
- Document validation and error handling

#### 3. API Routes (`/backend/src/routes/documents.js`)
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents` - List documents with pagination
- `GET /api/documents/:id` - Get specific document
- `GET /api/documents/:id/download` - Download document
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/reprocess` - Reprocess document
- `GET /api/documents/statistics/overview` - Get statistics
- `GET /api/documents/duplicates` - Get duplicate documents

### Frontend Components

#### 1. DocumentUpload Component (`/src/components/DocumentUpload.tsx`)
- Drag & drop upload interface
- File validation and progress tracking
- Document list with status indicators
- Basic document management actions

#### 2. DocumentManagement Component (`/src/components/DocumentManagement.tsx`)
- Comprehensive document dashboard
- Advanced filtering and search
- Detailed document statistics
- Duplicate management interface
- Processing status monitoring

#### 3. Document Service (`/src/services/documentService.ts`)
- Centralized API communication
- File validation utilities
- Data formatting helpers
- Error handling

## API Endpoints

### Upload Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data

FormData:
- document: File (PDF)
- documentType: string (bill|receipt|invoice|statement|other)
- notes: string (optional)
```

### Get Documents
```http
GET /api/documents?page=1&limit=10&status=processed&documentType=bill
```

### Get Document Statistics
```http
GET /api/documents/statistics/overview?startDate=2024-01-01&endDate=2024-12-31
```

### Download Document
```http
GET /api/documents/:id/download
```

## Usage

### 1. Uploading Documents
1. Navigate to "Upload Documents" from the dashboard
2. Drag and drop PDF files or click to select
3. Documents are automatically processed in the background
4. View processing status and results

### 2. Managing Documents
1. Go to "Document Management" for comprehensive view
2. Use filters to find specific documents
3. View detailed information and extracted data
4. Manage duplicates and reprocess if needed

### 3. Duplicate Detection
1. Duplicates are automatically detected during upload
2. View duplicate documents in the "Duplicates" tab
3. Review similarity scores and reasons
4. Delete or keep duplicate documents as needed

## Configuration

### Environment Variables
```env
# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/carbon-intelligence
UPLOAD_DIR=./uploads
PROCESSED_DIR=./processed

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

### File Upload Limits
- Maximum file size: 10MB
- Allowed file types: PDF only
- Storage location: `./uploads/` directory

## Dependencies

### Backend
- `multer`: File upload handling
- `pdf-parse`: PDF text extraction
- `mongoose`: Database operations
- `express`: API framework

### Frontend
- `react-dropzone`: Drag & drop file upload
- `@mui/material`: UI components
- `axios`: HTTP client

## Security Considerations

1. **File Validation**: Strict file type and size validation
2. **Path Security**: Secure file path handling to prevent directory traversal
3. **Authentication**: All endpoints require authentication
4. **File Storage**: Files stored outside web root directory
5. **Input Sanitization**: All user inputs are sanitized

## Performance Optimizations

1. **Asynchronous Processing**: Document processing happens in background
2. **Caching**: Recent transactions cached for duplicate detection
3. **Pagination**: Large document lists are paginated
4. **File Cleanup**: Automatic cleanup of old cache entries
5. **Database Indexing**: Optimized database queries with proper indexes

## Future Enhancements

1. **OCR Integration**: Better text extraction from scanned documents
2. **Machine Learning**: Improved duplicate detection algorithms
3. **Batch Processing**: Bulk document operations
4. **Cloud Storage**: Integration with cloud storage providers
5. **Advanced Analytics**: More detailed processing analytics
6. **Document Templates**: Support for different document formats
7. **API Integration**: Integration with external document processing services

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size and type restrictions
2. **Processing Stuck**: Check server logs for processing errors
3. **Duplicate Detection**: Adjust similarity thresholds if needed
4. **File Not Found**: Ensure files are properly stored and accessible

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in environment variables.

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.