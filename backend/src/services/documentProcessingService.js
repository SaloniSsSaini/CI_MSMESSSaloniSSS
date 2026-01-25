const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const duplicateDetectionService = require('./duplicateDetectionService');
const carbonCalculationService = require('./carbonCalculationService');

class DocumentProcessingService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.processedDir = path.join(__dirname, '../../processed');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.processedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  /**
   * Process uploaded PDF document
   * @param {Object} document - Document object
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Object} - Processing result
   */
  async processDocument(document, fileBuffer) {
    const startTime = Date.now();
    const processingResult = {
      success: false,
      extractedData: null,
      errors: [],
      warnings: [],
      processingTime: 0
    };

    try {
      // Update document status to processing
      document.status = 'processing';
      await document.save();

      // Extract text and data from PDF
      const extractedData = await this.extractDataFromPDF(fileBuffer);
      
      if (!extractedData) {
        throw new Error('Failed to extract data from PDF');
      }

      // Validate extracted data
      const validationResult = this.validateExtractedData(extractedData);
      processingResult.warnings = validationResult.warnings;

      // Check for duplicates
      const duplicateResult = await this.checkForDuplicates(document.msmeId, extractedData);
      
      if (duplicateResult.isDuplicate) {
        document.status = 'duplicate';
        document.duplicateDetection = duplicateResult;
        await document.save();
        
        processingResult.success = true;
        processingResult.duplicateDetected = true;
        processingResult.duplicateInfo = duplicateResult;
        return processingResult;
      }

      // Calculate carbon footprint
      const carbonFootprint = await this.calculateCarbonFootprint(extractedData);
      
      // Update document with extracted data
      document.extractedData = extractedData;
      document.status = 'processed';
      document.processingResults = {
        confidence: this.calculateConfidence(extractedData),
        processingTime: Date.now() - startTime,
        errors: processingResult.errors,
        warnings: processingResult.warnings
      };
      document.carbonFootprint = carbonFootprint;
      document.duplicateDetection = duplicateResult;

      await document.save();

      // Create transaction record if applicable
      if (extractedData.amount && extractedData.amount > 0) {
        await this.createTransactionFromDocument(document);
      }

      processingResult.success = true;
      processingResult.extractedData = extractedData;
      processingResult.carbonFootprint = carbonFootprint;

    } catch (error) {
      console.error('Document processing error:', error);
      processingResult.errors.push(error.message);
      
      document.status = 'failed';
      document.processingResults = {
        confidence: 0,
        processingTime: Date.now() - startTime,
        errors: processingResult.errors,
        warnings: processingResult.warnings
      };
      await document.save();
    }

    processingResult.processingTime = Date.now() - startTime;
    return processingResult;
  }

  /**
   * Extract data from PDF (simplified implementation)
   * @param {Buffer} fileBuffer - PDF file buffer
   * @returns {Object} - Extracted data
   */
  async extractDataFromPDF(fileBuffer) {
    // This is a simplified implementation
    // In a real application, you would use libraries like pdf-parse or pdf2pic
    // For now, we'll return mock data based on common patterns
    
    try {
      // Mock extraction - in reality, you'd use PDF parsing libraries
      const mockData = {
        vendor: {
          name: 'Sample Vendor',
          address: '123 Business Street, City, State',
          phone: '+91-9876543210',
          email: 'vendor@example.com'
        },
        amount: Math.floor(Math.random() * 10000) + 1000, // Random amount between 1000-11000
        currency: 'INR',
        date: new Date(),
        description: 'Business transaction',
        category: 'utilities',
        subcategory: 'electricity',
        items: [
          {
            name: 'Service Charge',
            quantity: 1,
            unit: 'month',
            price: Math.floor(Math.random() * 1000) + 500,
            total: Math.floor(Math.random() * 1000) + 500
          }
        ],
        tax: {
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0
        },
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'TXN' + Date.now()
      };

      return mockData;
    } catch (error) {
      console.error('PDF extraction error:', error);
      return null;
    }
  }

  /**
   * Validate extracted data
   * @param {Object} extractedData - Extracted data
   * @returns {Object} - Validation result
   */
  validateExtractedData(extractedData) {
    const warnings = [];

    if (!extractedData.amount || extractedData.amount <= 0) {
      warnings.push('Amount not found or invalid');
    }

    if (!extractedData.date) {
      warnings.push('Date not found');
    }

    if (!extractedData.vendor || !extractedData.vendor.name) {
      warnings.push('Vendor information not found');
    }

    if (!extractedData.description) {
      warnings.push('Description not found');
    }

    return { warnings };
  }

  /**
   * Check for duplicate documents
   * @param {string} msmeId - MSME ID
   * @param {Object} extractedData - Extracted data
   * @returns {Object} - Duplicate detection result
   */
  async checkForDuplicates(msmeId, extractedData) {
    const Document = require('../models/Document');
    
    try {
      // Find similar documents within the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentDocuments = await Document.find({
        msmeId,
        status: 'processed',
        createdAt: { $gte: thirtyDaysAgo },
        'extractedData.amount': { $exists: true }
      });

      let bestMatch = null;
      let highestSimilarity = 0;

      for (const doc of recentDocuments) {
        const similarity = this.calculateDocumentSimilarity(extractedData, doc.extractedData);
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = doc;
        }
      }

      const thresholds = {
        exact: 0.95,
        near: 0.80,
        fuzzy: 0.65
      };

      if (highestSimilarity >= thresholds.exact) {
        return {
          isDuplicate: true,
          duplicateType: 'exact',
          similarityScore: highestSimilarity,
          matchedDocumentId: bestMatch._id,
          duplicateReasons: ['Exact match found']
        };
      } else if (highestSimilarity >= thresholds.near) {
        return {
          isDuplicate: true,
          duplicateType: 'near',
          similarityScore: highestSimilarity,
          matchedDocumentId: bestMatch._id,
          duplicateReasons: ['Near match found']
        };
      } else if (highestSimilarity >= thresholds.fuzzy) {
        return {
          isDuplicate: true,
          duplicateType: 'fuzzy',
          similarityScore: highestSimilarity,
          matchedDocumentId: bestMatch._id,
          duplicateReasons: ['Fuzzy match found']
        };
      }

      return {
        isDuplicate: false,
        duplicateType: null,
        similarityScore: highestSimilarity,
        matchedDocumentId: null,
        duplicateReasons: []
      };

    } catch (error) {
      console.error('Duplicate detection error:', error);
      return {
        isDuplicate: false,
        duplicateType: null,
        similarityScore: 0,
        matchedDocumentId: null,
        duplicateReasons: ['Error in duplicate detection']
      };
    }
  }

  /**
   * Calculate similarity between two documents
   * @param {Object} doc1 - First document data
   * @param {Object} doc2 - Second document data
   * @returns {number} - Similarity score (0-1)
   */
  calculateDocumentSimilarity(doc1, doc2) {
    const weights = {
      amount: 0.3,
      vendor: 0.25,
      date: 0.2,
      description: 0.15,
      category: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Amount similarity
    if (doc1.amount && doc2.amount) {
      const amountSimilarity = this.calculateAmountSimilarity(doc1.amount, doc2.amount);
      totalScore += amountSimilarity * weights.amount;
      totalWeight += weights.amount;
    }

    // Vendor similarity
    if (doc1.vendor && doc2.vendor && doc1.vendor.name && doc2.vendor.name) {
      const vendorSimilarity = this.calculateTextSimilarity(doc1.vendor.name, doc2.vendor.name);
      totalScore += vendorSimilarity * weights.vendor;
      totalWeight += weights.vendor;
    }

    // Date similarity
    if (doc1.date && doc2.date) {
      const date1 = new Date(doc1.date);
      const date2 = new Date(doc2.date);
      const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
      const dateSimilarity = daysDiff <= 1 ? 1 : Math.max(0, 1 - daysDiff / 30);
      totalScore += dateSimilarity * weights.date;
      totalWeight += weights.date;
    }

    // Description similarity
    if (doc1.description && doc2.description) {
      const descriptionSimilarity = this.calculateTextSimilarity(doc1.description, doc2.description);
      totalScore += descriptionSimilarity * weights.description;
      totalWeight += weights.description;
    }

    // Category similarity
    if (doc1.category && doc2.category) {
      const categorySimilarity = doc1.category === doc2.category ? 1 : 0;
      totalScore += categorySimilarity * weights.category;
      totalWeight += weights.category;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate amount similarity
   * @param {number} amount1 - First amount
   * @param {number} amount2 - Second amount
   * @returns {number} - Similarity score (0-1)
   */
  calculateAmountSimilarity(amount1, amount2) {
    if (amount1 === amount2) return 1;
    
    const diff = Math.abs(amount1 - amount2);
    const avg = (amount1 + amount2) / 2;
    const relativeDiff = diff / avg;
    
    if (relativeDiff <= 0.01) return 0.95;
    if (relativeDiff <= 0.05) return 0.8;
    if (relativeDiff <= 0.20) return 0.6;
    
    return 0;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} - Similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;

    const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);

    const words1 = new Set(normalized1.split(/\s+/).filter(w => w.length > 0));
    const words2 = new Set(normalized2.split(/\s+/).filter(w => w.length > 0));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate carbon footprint for the document
   * @param {Object} extractedData - Extracted data
   * @returns {Object} - Carbon footprint data
   */
  async calculateCarbonFootprint(extractedData) {
    try {
      // Use existing carbon calculation service
      const carbonData = await carbonCalculationService.calculateTransactionCarbonFootprint({
        amount: extractedData.amount,
        category: extractedData.category,
        subcategory: extractedData.subcategory,
        description: extractedData.description,
        vendor: extractedData.vendor
      });

      return {
        co2Emissions: carbonData.co2Emissions || 0,
        emissionFactor: carbonData.emissionFactor || 0,
        calculationMethod: carbonData.calculationMethod || 'estimated',
        sustainabilityScore: carbonData.sustainabilityScore || 0
      };
    } catch (error) {
      console.error('Carbon footprint calculation error:', error);
      return {
        co2Emissions: 0,
        emissionFactor: 0,
        calculationMethod: 'error',
        sustainabilityScore: 0
      };
    }
  }

  /**
   * Calculate confidence score for extracted data
   * @param {Object} extractedData - Extracted data
   * @returns {number} - Confidence score (0-1)
   */
  calculateConfidence(extractedData) {
    let score = 0;
    let totalFields = 0;

    const fields = ['amount', 'date', 'vendor', 'description', 'category'];
    
    fields.forEach(field => {
      totalFields++;
      if (extractedData[field] && (typeof extractedData[field] !== 'object' || Object.keys(extractedData[field]).length > 0)) {
        score += 1;
      }
    });

    return totalFields > 0 ? score / totalFields : 0;
  }

  /**
   * Create transaction record from processed document
   * @param {Object} document - Processed document
   * @returns {Object} - Created transaction
   */
  async createTransactionFromDocument(document) {
    try {
      const Transaction = require('../models/Transaction');
      
      const transaction = new Transaction({
        msmeId: document.msmeId,
        source: 'manual',
        sourceId: document._id.toString(),
        transactionType: 'expense',
        amount: document.extractedData.amount,
        currency: document.extractedData.currency,
        description: document.extractedData.description,
        vendor: document.extractedData.vendor,
        category: document.extractedData.category,
        subcategory: document.extractedData.subcategory,
        date: document.extractedData.date,
        carbonFootprint: document.carbonFootprint,
        metadata: {
          originalText: `Document: ${document.originalName}`,
          extractedData: document.extractedData,
          confidence: document.processingResults.confidence
        },
        isProcessed: true,
        processedAt: new Date(),
        tags: ['document-upload']
      });

      await transaction.save();

      try {
        const orchestrationManagerEventService = require('./orchestrationManagerEventService');
        orchestrationManagerEventService.emitEvent('transactions.document_processed', {
          msmeId: document.msmeId,
          transaction: transaction.toObject(),
          source: 'document'
        }, 'document_processing');
      } catch (eventError) {
        console.warn('Failed to emit orchestration event for document transaction', {
          error: eventError.message,
          msmeId: document.msmeId
        });
      }
      return transaction;
    } catch (error) {
      console.error('Error creating transaction from document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics for an MSME
   * @param {string} msmeId - MSME ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} - Document statistics
   */
  async getDocumentStatistics(msmeId, startDate, endDate) {
    const Document = require('../models/Document');
    
    const query = { msmeId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const documents = await Document.find(query);
    
    const statistics = {
      totalDocuments: documents.length,
      documentsByType: {},
      documentsByStatus: {},
      totalAmount: 0,
      totalCarbonFootprint: 0,
      duplicateCount: 0,
      averageProcessingTime: 0,
      documentsByMonth: {}
    };

    let totalProcessingTime = 0;
    let processedCount = 0;

    documents.forEach(doc => {
      // By type
      statistics.documentsByType[doc.documentType] = (statistics.documentsByType[doc.documentType] || 0) + 1;
      
      // By status
      statistics.documentsByStatus[doc.status] = (statistics.documentsByStatus[doc.status] || 0) + 1;
      
      // Amount
      if (doc.extractedData && doc.extractedData.amount) {
        statistics.totalAmount += doc.extractedData.amount;
      }
      
      // Carbon footprint
      if (doc.carbonFootprint && doc.carbonFootprint.co2Emissions) {
        statistics.totalCarbonFootprint += doc.carbonFootprint.co2Emissions;
      }
      
      // Duplicates
      if (doc.duplicateDetection && doc.duplicateDetection.isDuplicate) {
        statistics.duplicateCount++;
      }
      
      // Processing time
      if (doc.processingResults && doc.processingResults.processingTime) {
        totalProcessingTime += doc.processingResults.processingTime;
        processedCount++;
      }
      
      // By month
      const month = doc.createdAt.toISOString().substring(0, 7);
      statistics.documentsByMonth[month] = (statistics.documentsByMonth[month] || 0) + 1;
    });

    statistics.averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

    return statistics;
  }
}

module.exports = new DocumentProcessingService();