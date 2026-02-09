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

      const itemFootprints = this.calculateItemCarbonFootprints(extractedData);
      if (itemFootprints.length > 0) {
        extractedData.items = itemFootprints;
      }

      // Calculate carbon footprint
      const carbonFootprint = await this.calculateCarbonFootprint(extractedData, itemFootprints);
      const carbonAnalysis = await this.calculateDocumentCarbonAnalysis(
        document,
        extractedData,
        itemFootprints
      );
      
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
      if (carbonAnalysis) {
        document.carbonAnalysis = carbonAnalysis;
        if (document.carbonFootprint) {
          document.carbonFootprint.sustainabilityScore = carbonAnalysis.carbonScore || 0;
        }
      } else if (Array.isArray(processingResult.warnings)) {
        processingResult.warnings.push('Carbon analysis unavailable for this document');
      }
      document.duplicateDetection = duplicateResult;

      await document.save();

      // Create transaction record if applicable
      if ((Array.isArray(itemFootprints) && itemFootprints.length > 0) ||
          (extractedData.amount && extractedData.amount > 0)) {
        await this.createTransactionsFromDocument(document, itemFootprints);
        await this.updateMsmeCarbonAssessment(document.msmeId, extractedData.date || new Date());
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

  calculateItemCarbonFootprints(extractedData = {}) {
    const items = Array.isArray(extractedData.items) ? extractedData.items : [];
    if (items.length === 0) {
      return [];
    }

    return items.map(item => {
      const amount = this.resolveItemAmount(item);
      const category = this.resolveItemCategory(item, extractedData);
      const subcategory = this.resolveItemSubcategory(item, category, extractedData);
      const description = item.name || extractedData.description || 'Document item';

      const carbonFootprint = carbonCalculationService.calculateTransactionCarbonFootprint({
        amount,
        category,
        subcategory,
        description,
        vendor: extractedData.vendor
      });

      return {
        ...item,
        total: amount || item.total,
        category,
        subcategory,
        carbonFootprint: {
          co2Emissions: carbonFootprint.co2Emissions || 0,
          emissionFactor: carbonFootprint.emissionFactor || 0,
          calculationMethod: carbonFootprint.calculationMethod || 'document_item'
        }
      };
    });
  }

  resolveItemAmount(item) {
    const quantity = Number(item?.quantity) || 0;
    const price = Number(item?.price) || 0;
    const total = Number(item?.total) || 0;
    if (total > 0) {
      return total;
    }
    if (quantity > 0 && price > 0) {
      return quantity * price;
    }
    return 0;
  }

  resolveItemCategory(item, extractedData = {}) {
    const text = `${item?.name || ''} ${extractedData.description || ''}`.toLowerCase();
    const categoryKeywords = {
      energy: ['electricity', 'power', 'energy', 'fuel', 'diesel', 'petrol', 'gas', 'solar', 'wind', 'renewable'],
      water: ['water', 'sewage', 'drainage', 'irrigation', 'treatment', 'supply'],
      waste_management: ['waste', 'garbage', 'recycling', 'disposal', 'landfill', 'compost'],
      transportation: ['transport', 'shipping', 'delivery', 'logistics', 'freight', 'vehicle', 'truck'],
      raw_materials: ['material', 'steel', 'aluminum', 'plastic', 'wood', 'concrete', 'fabric', 'chemical'],
      equipment: ['equipment', 'machine', 'tool', 'device', 'apparatus', 'instrument'],
      maintenance: ['maintenance', 'repair', 'service', 'overhaul', 'upgrade', 'fix'],
      utilities: ['utility', 'internet', 'phone', 'telecom', 'broadband', 'subscription']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return extractedData.category || 'other';
  }

  resolveItemSubcategory(item, category, extractedData = {}) {
    const text = `${item?.name || ''} ${extractedData.description || ''}`.toLowerCase();
    if (extractedData.subcategory) {
      return extractedData.subcategory;
    }

    if (category === 'energy') {
      if (text.includes('solar') || text.includes('wind') || text.includes('renewable')) return 'renewable';
      if (text.includes('diesel') || text.includes('petrol') || text.includes('fuel')) return 'fuel';
      return 'grid';
    }

    if (category === 'transportation') {
      if (text.includes('diesel')) return 'diesel';
      if (text.includes('petrol')) return 'petrol';
      return 'general';
    }

    if (category === 'raw_materials') {
      if (text.includes('steel')) return 'steel';
      if (text.includes('aluminum')) return 'aluminum';
      if (text.includes('plastic')) return 'plastic';
      return 'general';
    }

    if (category === 'waste_management') {
      if (text.includes('hazardous') || text.includes('toxic')) return 'hazardous';
      if (text.includes('recycle')) return 'recycling';
      return 'solid';
    }

    return extractedData.subcategory || 'general';
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
  async calculateCarbonFootprint(extractedData, itemFootprints = []) {
    try {
      const resolvedFootprints = itemFootprints.length > 0
        ? itemFootprints
        : (Array.isArray(extractedData.items)
          ? extractedData.items.filter(item => item?.carbonFootprint)
          : []);

      if (resolvedFootprints.length > 0) {
        const totals = resolvedFootprints.reduce((acc, item) => {
          const amount = Number(item.total) || 0;
          const co2 = Number(item.carbonFootprint?.co2Emissions) || 0;
          const factor = Number(item.carbonFootprint?.emissionFactor) || 0;
          acc.totalAmount += amount;
          acc.co2Emissions += co2;
          acc.weightedFactor += amount > 0 ? factor * amount : 0;
          return acc;
        }, { totalAmount: 0, co2Emissions: 0, weightedFactor: 0 });

        const emissionFactor = totals.totalAmount > 0
          ? totals.weightedFactor / totals.totalAmount
          : 0;

        return {
          co2Emissions: totals.co2Emissions,
          emissionFactor,
          calculationMethod: 'document_itemized',
          sustainabilityScore: 0
        };
      }

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
        calculationMethod: carbonData.calculationMethod || 'document_summary',
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

  buildDocumentTransactions(document, extractedData = {}, itemFootprints = [], msmeProfile = {}) {
    const baseTransaction = {
      msmeId: document.msmeId,
      source: 'manual',
      transactionType: this.mapDocumentToTransactionType(document.documentType),
      currency: extractedData.currency || 'INR',
      vendor: extractedData.vendor,
      date: extractedData.date || new Date(),
      description: extractedData.description || document.originalName || 'Document transaction',
      industry: msmeProfile?.industry,
      businessDomain: msmeProfile?.businessDomain,
      region: carbonCalculationService.resolveRegion(msmeProfile?.contact?.address?.state),
      location: {
        state: msmeProfile?.contact?.address?.state || 'unknown',
        country: msmeProfile?.contact?.address?.country || 'India'
      },
      sustainability: {
        isGreen: false,
        greenScore: 0
      }
    };

    const itemTransactions = Array.isArray(itemFootprints) ? itemFootprints : [];
    if (itemTransactions.length > 0) {
      return itemTransactions
        .map(item => {
          const amount = Number(item.total) || this.resolveItemAmount(item);
          const category = item.category || this.resolveItemCategory(item, extractedData);
          const subcategory = item.subcategory || this.resolveItemSubcategory(item, category, extractedData);
          if (!amount && !item.name) {
            return null;
          }
          return {
            ...baseTransaction,
            sourceId: `${document._id?.toString() || document.fileName}_${item.name || 'item'}`,
            amount,
            category,
            subcategory,
            description: item.name
              ? `${baseTransaction.description} - ${item.name}`
              : baseTransaction.description,
            carbonFootprint: item.carbonFootprint
          };
        })
        .filter(Boolean);
    }

    if (extractedData.amount && extractedData.amount > 0) {
      return [{
        ...baseTransaction,
        sourceId: document._id?.toString() || document.fileName,
        amount: extractedData.amount,
        category: extractedData.category || 'other',
        subcategory: extractedData.subcategory || 'general',
        carbonFootprint: document.carbonFootprint
      }];
    }

    return [];
  }

  buildCategoryBreakdown(transactions = []) {
    return transactions.reduce((acc, transaction) => {
      const category = (transaction.category || 'other').toLowerCase();
      const subcategory = transaction.subcategory || 'general';
      const amount = Number(transaction.amount) || 0;
      const carbonFootprint = transaction.carbonFootprint ||
        carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
      const emissions = Number(carbonFootprint.co2Emissions) || 0;

      if (!acc[category]) {
        acc[category] = {
          count: 0,
          amount: 0,
          emissions: 0,
          emissionFactor: 0,
          subcategoryBreakdown: {}
        };
      }

      acc[category].count += 1;
      acc[category].amount += amount;
      acc[category].emissions += emissions;
      acc[category].emissionFactor = acc[category].amount > 0
        ? acc[category].emissions / acc[category].amount
        : 0;
      acc[category].subcategoryBreakdown[subcategory] =
        (acc[category].subcategoryBreakdown[subcategory] || 0) + emissions;

      return acc;
    }, {});
  }

  async calculateDocumentCarbonAnalysis(document, extractedData = {}, itemFootprints = [], msmeProfileOverride = null) {
    try {
      const MSME = require('../models/MSME');
      const msmeProfile = msmeProfileOverride || await MSME.findById(document.msmeId).lean();
      if (!msmeProfile) {
        return null;
      }

      const transactions = this.buildDocumentTransactions(
        document,
        extractedData,
        itemFootprints,
        msmeProfile
      );
      if (transactions.length === 0) {
        return null;
      }

      const assessment = carbonCalculationService.calculateMSMECarbonFootprint(
        msmeProfile,
        transactions
      );
      const totalAmount = transactions.reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0);

      return {
        totalCO2Emissions: assessment.totalCO2Emissions,
        totalAmount,
        transactionCount: transactions.length,
        categoryBreakdown: this.buildCategoryBreakdown(transactions),
        breakdown: assessment.breakdown,
        esgScopes: assessment.esgScopes,
        carbonScore: assessment.carbonScore,
        recommendations: assessment.recommendations,
        calculatedAt: new Date(),
        calculationMethod: 'document_transactions'
      };
    } catch (error) {
      console.error('Document carbon analysis error:', error);
      return null;
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

  mapDocumentToTransactionType(documentType) {
    switch (documentType) {
      case 'invoice':
      case 'bill':
        return 'expense';
      case 'receipt':
        return 'purchase';
      case 'statement':
        return 'other';
      default:
        return 'other';
    }
  }

  async updateMsmeCarbonAssessment(msmeId, referenceDate = new Date()) {
    try {
      const MSME = require('../models/MSME');
      const CarbonAssessment = require('../models/CarbonAssessment');
      const Transaction = require('../models/Transaction');

      const msmeProfile = await MSME.findById(msmeId);
      if (!msmeProfile) {
        return null;
      }

      const periodEnd = referenceDate ? new Date(referenceDate) : new Date();
      const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

      const windowTransactions = await Transaction.find({
        msmeId,
        date: { $gte: periodStart, $lte: periodEnd },
        isSpam: { $ne: true },
        isDuplicate: { $ne: true }
      }).lean();

      const assessmentData = carbonCalculationService.calculateMSMECarbonFootprint(
        msmeProfile,
        windowTransactions
      );

      const existingAssessment = await CarbonAssessment.findOne({
        msmeId,
        'period.startDate': { $lte: periodEnd },
        'period.endDate': { $gte: periodStart }
      }).sort({ createdAt: -1 });

      if (existingAssessment) {
        existingAssessment.totalCO2Emissions = assessmentData.totalCO2Emissions;
        existingAssessment.breakdown = assessmentData.breakdown;
        existingAssessment.esgScopes = assessmentData.esgScopes;
        existingAssessment.carbonScore = assessmentData.carbonScore;
        existingAssessment.recommendations = assessmentData.recommendations;
        existingAssessment.status = 'completed';
        existingAssessment.period = {
          startDate: periodStart,
          endDate: periodEnd
        };
        await existingAssessment.save();
      } else {
        const newAssessment = new CarbonAssessment({
          msmeId,
          assessmentType: 'automatic',
          period: {
            startDate: periodStart,
            endDate: periodEnd
          },
          totalCO2Emissions: assessmentData.totalCO2Emissions,
          breakdown: assessmentData.breakdown,
          esgScopes: assessmentData.esgScopes,
          carbonScore: assessmentData.carbonScore,
          recommendations: assessmentData.recommendations,
          status: 'completed'
        });
        await newAssessment.save();
      }

      msmeProfile.carbonScore = assessmentData.carbonScore;
      msmeProfile.lastCarbonAssessment = new Date();
      await msmeProfile.save();

      return assessmentData;
    } catch (error) {
      console.error('Failed to update MSME carbon assessment:', error);
      return null;
    }
  }

  /**
   * Create transaction record from processed document
   * @param {Object} document - Processed document
   * @returns {Object} - Created transaction
   */
  async createTransactionsFromDocument(document, itemFootprints = []) {
    try {
      const Transaction = require('../models/Transaction');

      const transactionType = this.mapDocumentToTransactionType(document.documentType);
      const transactionDate = document.extractedData?.date || new Date();
      const itemTransactions = Array.isArray(itemFootprints) ? itemFootprints : [];
      const createdTransactions = [];

      if (itemTransactions.length > 0) {
        for (const item of itemTransactions) {
          const amount = Number(item.total) || 0;
          if (!amount && !item.name) {
            continue;
          }

          const category = item.category || this.resolveItemCategory(item, document.extractedData);
          const subcategory = item.subcategory || this.resolveItemSubcategory(item, category, document.extractedData);

          const transaction = new Transaction({
            msmeId: document.msmeId,
            source: 'manual',
            sourceId: `${document._id.toString()}_${item.name || 'item'}`,
            transactionType,
            amount,
            currency: document.extractedData.currency,
            description: item.name
              ? `${document.extractedData.description || 'Document item'} - ${item.name}`
              : (document.extractedData.description || 'Document item'),
            vendor: document.extractedData.vendor,
            category,
            subcategory,
            date: transactionDate,
            carbonFootprint: item.carbonFootprint || document.carbonFootprint,
            metadata: {
              originalText: `Document: ${document.originalName}`,
              extractedData: document.extractedData,
              lineItem: {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                price: item.price,
                total: item.total
              },
              confidence: document.processingResults.confidence
            },
            isProcessed: true,
            processedAt: new Date(),
            tags: ['document-upload', 'document-item']
          });

          await transaction.save();
          createdTransactions.push(transaction);
        }
      } else {
        const transaction = new Transaction({
          msmeId: document.msmeId,
          source: 'manual',
          sourceId: document._id.toString(),
          transactionType,
          amount: document.extractedData.amount,
          currency: document.extractedData.currency,
          description: document.extractedData.description,
          vendor: document.extractedData.vendor,
          category: document.extractedData.category || 'other',
          subcategory: document.extractedData.subcategory || 'general',
          date: transactionDate,
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
        createdTransactions.push(transaction);
      }

      try {
        const orchestrationManagerEventService = require('./orchestrationManagerEventService');
        createdTransactions.forEach(created => {
          orchestrationManagerEventService.emitEvent('transactions.document_processed', {
            msmeId: document.msmeId,
            transaction: created.toObject(),
            documentId: document._id.toString(),
            source: 'document'
          }, 'document_processing');
        });
      } catch (eventError) {
        console.warn('Failed to emit orchestration event for document transaction', {
          error: eventError.message,
          msmeId: document.msmeId
        });
      }

      return createdTransactions;
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