const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const router = express.Router();

const Document = require('../models/Document');
const documentProcessingService = require('../services/documentProcessingService');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/documents/upload
// @desc    Upload a PDF document
// @access  Private
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { documentType, notes } = req.body;
    const msmeId = req.user.id;

    // Create document record
    const document = new Document({
      msmeId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType: documentType || 'bill',
      metadata: {
        uploadSource: 'web',
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        processingVersion: '1.0.0'
      },
      notes: notes || ''
    });

    await document.save();

    // Process document asynchronously
    setImmediate(async () => {
      try {
        const fileBuffer = await fs.readFile(req.file.path);
        await documentProcessingService.processDocument(document, fileBuffer);
      } catch (error) {
        console.error('Error processing document:', error);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        fileName: document.fileName,
        originalName: document.originalName,
        documentType: document.documentType,
        status: document.status,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document',
      error: error.message
    });
  }
});

// @route   GET /api/documents
// @desc    Get all documents for an MSME
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, documentType, startDate, endDate } = req.query;
    const msmeId = req.user.id;

    const query = { msmeId };
    
    if (status) query.status = status;
    if (documentType) query.documentType = documentType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-filePath'); // Exclude file path for security

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents',
      error: error.message
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Get a specific document
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      msmeId: req.user.id
    }).select('-filePath');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document',
      error: error.message
    });
  }
});

// @route   GET /api/documents/:id/download
// @desc    Download a document
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      msmeId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(document.filePath, document.originalName);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { notes, tags, documentType } = req.body;
    
    const document = await Document.findOne({
      _id: req.params.id,
      msmeId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (notes !== undefined) document.notes = notes;
    if (tags !== undefined) document.tags = tags;
    if (documentType !== undefined) document.documentType = documentType;

    await document.save();

    res.json({
      success: true,
      message: 'Document updated successfully',
      document
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: error.message
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      msmeId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
});

// @route   POST /api/documents/:id/reprocess
// @desc    Reprocess a document
// @access  Private
router.post('/:id/reprocess', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      msmeId: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Read file and reprocess
    const fileBuffer = await fs.readFile(document.filePath);
    const result = await documentProcessingService.processDocument(document, fileBuffer);

    res.json({
      success: true,
      message: 'Document reprocessed successfully',
      result
    });

  } catch (error) {
    console.error('Reprocess error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reprocessing document',
      error: error.message
    });
  }
});

// @route   GET /api/documents/statistics/overview
// @desc    Get document statistics
// @access  Private
router.get('/statistics/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const msmeId = req.user.id;

    const statistics = await documentProcessingService.getDocumentStatistics(
      msmeId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// @route   GET /api/documents/duplicates
// @desc    Get duplicate documents
// @access  Private
router.get('/duplicates', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const msmeId = req.user.id;

    const documents = await Document.find({
      msmeId,
      'duplicateDetection.isDuplicate': true
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('duplicateDetection.matchedDocumentId', 'originalName createdAt extractedData.amount')
      .select('-filePath');

    const total = await Document.countDocuments({
      msmeId,
      'duplicateDetection.isDuplicate': true
    });

    res.json({
      success: true,
      documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get duplicates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching duplicates',
      error: error.message
    });
  }
});

module.exports = router;