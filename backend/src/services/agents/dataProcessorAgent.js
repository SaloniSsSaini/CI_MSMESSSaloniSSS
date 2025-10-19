const natural = require('natural');
const logger = require('../../utils/logger');

class DataProcessorAgent {
  constructor() {
    this.name = 'Data Processor Agent';
    this.type = 'data_processor';
    this.capabilities = [
      'data_cleaning',
      'transaction_classification',
      'text_analysis',
      'data_enrichment',
      'quality_validation'
    ];
    
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.classifier = new natural.BayesClassifier();
    
    // Initialize category keywords
    this.categoryKeywords = this.initializeCategoryKeywords();
  }

  async processTransactions(transactions) {
    try {
      const processedData = {
        cleaned: [],
        classified: [],
        enriched: [],
        validated: [],
        statistics: {
          totalProcessed: 0,
          successfullyClassified: 0,
          validationErrors: 0,
          enrichmentApplied: 0
        }
      };

      for (const transaction of transactions) {
        try {
          // Step 1: Clean transaction data
          const cleaned = await this.cleanTransactionData(transaction);
          processedData.cleaned.push(cleaned);
          processedData.statistics.totalProcessed++;

          // Step 2: Classify transaction
          const classified = await this.classifyTransaction(cleaned);
          processedData.classified.push(classified);
          if (classified.category !== 'unknown') {
            processedData.statistics.successfullyClassified++;
          }

          // Step 3: Enrich with additional data
          const enriched = await this.enrichTransactionData(classified);
          processedData.enriched.push(enriched);
          if (enriched.enrichmentApplied) {
            processedData.statistics.enrichmentApplied++;
          }

          // Step 4: Validate for carbon calculation
          const validated = await this.validateForCarbonCalculation(enriched);
          processedData.validated.push(validated);
          if (validated.validationErrors.length > 0) {
            processedData.statistics.validationErrors += validated.validationErrors.length;
          }

        } catch (error) {
          logger.error(`Error processing transaction ${transaction._id}:`, error);
          // Add error transaction to results
          processedData.validated.push({
            ...transaction,
            processingError: error.message,
            validationErrors: ['Processing failed']
          });
          processedData.statistics.validationErrors++;
        }
      }

      return processedData;
    } catch (error) {
      logger.error('Transaction processing failed:', error);
      throw error;
    }
  }

  async cleanTransactionData(transaction) {
    const cleaned = { ...transaction };

    // Clean description
    if (cleaned.description) {
      cleaned.description = this.cleanText(cleaned.description);
    }

    // Clean vendor name
    if (cleaned.vendor) {
      cleaned.vendor = this.cleanVendorName(cleaned.vendor);
    }

    // Normalize amount
    if (cleaned.amount) {
      cleaned.amount = this.normalizeAmount(cleaned.amount);
    }

    // Clean and validate date
    if (cleaned.date) {
      cleaned.date = this.normalizeDate(cleaned.date);
    }

    // Remove empty or null fields
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
        delete cleaned[key];
      }
    });

    return cleaned;
  }

  async classifyTransaction(transaction) {
    const classified = { ...transaction };

    // If category is already set and valid, keep it
    if (classified.category && this.isValidCategory(classified.category)) {
      return classified;
    }

    // Classify based on description and vendor
    const text = `${classified.description || ''} ${classified.vendor || ''}`.toLowerCase();
    const category = this.classifyByKeywords(text);
    
    classified.category = category;
    classified.subcategory = this.classifySubcategory(text, category);
    classified.confidence = this.calculateClassificationConfidence(text, category);

    return classified;
  }

  async enrichTransactionData(transaction) {
    const enriched = { ...transaction };
    enriched.enrichmentApplied = false;

    // Enrich with sustainability data
    if (enriched.vendor) {
      const sustainabilityData = await this.getVendorSustainabilityData(enriched.vendor);
      if (sustainabilityData) {
        enriched.sustainability = sustainabilityData;
        enriched.enrichmentApplied = true;
      }
    }

    // Enrich with location data
    if (enriched.description) {
      const locationData = this.extractLocationData(enriched.description);
      if (locationData) {
        enriched.location = locationData;
        enriched.enrichmentApplied = true;
      }
    }

    // Enrich with material type
    if (enriched.category === 'raw_materials' && enriched.description) {
      const materialType = this.extractMaterialType(enriched.description);
      if (materialType) {
        enriched.materialType = materialType;
        enriched.enrichmentApplied = true;
      }
    }

    // Enrich with energy source
    if (enriched.category === 'energy' && enriched.description) {
      const energySource = this.extractEnergySource(enriched.description);
      if (energySource) {
        enriched.energySource = energySource;
        enriched.enrichmentApplied = true;
      }
    }

    return enriched;
  }

  async validateForCarbonCalculation(transaction) {
    const validated = { ...transaction };
    validated.validationErrors = [];

    // Required fields validation
    if (!validated.amount || validated.amount <= 0) {
      validated.validationErrors.push('Invalid or missing amount');
    }

    if (!validated.date) {
      validated.validationErrors.push('Missing transaction date');
    }

    if (!validated.category) {
      validated.validationErrors.push('Missing transaction category');
    }

    // Category-specific validation
    if (validated.category === 'energy' && !validated.subcategory) {
      validated.validationErrors.push('Energy transactions require subcategory (grid/renewable/fuel)');
    }

    if (validated.category === 'raw_materials' && !validated.materialType) {
      validated.validationErrors.push('Material transactions should specify material type');
    }

    // Amount range validation
    if (validated.amount > 1000000) {
      validated.validationErrors.push('Amount seems unusually high, please verify');
    }

    // Date validation
    if (validated.date && validated.date > new Date()) {
      validated.validationErrors.push('Transaction date cannot be in the future');
    }

    validated.isValid = validated.validationErrors.length === 0;

    return validated;
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .toLowerCase();
  }

  cleanVendorName(vendor) {
    if (!vendor) return '';
    
    return vendor
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  normalizeAmount(amount) {
    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      const cleaned = amount.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return Number(amount) || 0;
  }

  normalizeDate(date) {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return new Date();
  }

  initializeCategoryKeywords() {
    return {
      energy: ['electricity', 'power', 'energy', 'fuel', 'diesel', 'petrol', 'gas', 'solar', 'wind', 'renewable'],
      water: ['water', 'sewage', 'drainage', 'irrigation', 'treatment', 'supply'],
      waste_management: ['waste', 'garbage', 'recycling', 'disposal', 'landfill', 'compost'],
      transportation: ['transport', 'shipping', 'delivery', 'logistics', 'freight', 'vehicle', 'truck'],
      raw_materials: ['material', 'steel', 'aluminum', 'plastic', 'wood', 'concrete', 'fabric', 'chemical'],
      equipment: ['equipment', 'machine', 'tool', 'device', 'apparatus', 'instrument'],
      maintenance: ['maintenance', 'repair', 'service', 'overhaul', 'upgrade', 'fix'],
      other: ['miscellaneous', 'other', 'general', 'admin', 'office', 'supplies']
    };
  }

  classifyByKeywords(text) {
    let bestMatch = 'other';
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    }

    return maxScore > 0 ? bestMatch : 'unknown';
  }

  classifySubcategory(text, category) {
    const subcategoryMap = {
      energy: {
        'grid': ['grid', 'electricity', 'power'],
        'renewable': ['solar', 'wind', 'renewable', 'green'],
        'fuel': ['diesel', 'petrol', 'gas', 'fuel']
      },
      waste_management: {
        'recycling': ['recycling', 'recycle'],
        'hazardous': ['hazardous', 'toxic', 'chemical'],
        'solid': ['solid', 'garbage', 'waste']
      },
      transportation: {
        'diesel': ['diesel'],
        'petrol': ['petrol', 'gasoline'],
        'cng': ['cng', 'compressed natural gas']
      }
    };

    if (!subcategoryMap[category]) return null;

    for (const [subcategory, keywords] of Object.entries(subcategoryMap[category])) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return subcategory;
        }
      }
    }

    return null;
  }

  calculateClassificationConfidence(text, category) {
    const keywords = this.categoryKeywords[category] || [];
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    return Math.min(matches / keywords.length, 1);
  }

  isValidCategory(category) {
    return Object.keys(this.categoryKeywords).includes(category);
  }

  async getVendorSustainabilityData(vendor) {
    // Placeholder for vendor sustainability data lookup
    // In a real implementation, this would query a database or API
    const sustainabilityDatabase = {
      'green energy corp': { isGreen: true, greenScore: 85, certifications: ['ISO 14001'] },
      'eco materials ltd': { isGreen: true, greenScore: 90, certifications: ['FSC', 'GOTS'] },
      'sustainable solutions': { isGreen: true, greenScore: 80, certifications: ['LEED'] }
    };

    const vendorKey = vendor.toLowerCase();
    return sustainabilityDatabase[vendorKey] || null;
  }

  extractLocationData(description) {
    // Simple location extraction - in real implementation, use NLP libraries
    const locationKeywords = ['km', 'miles', 'distance', 'from', 'to', 'near', 'location'];
    const hasLocation = locationKeywords.some(keyword => description.includes(keyword));
    
    if (hasLocation) {
      return {
        hasLocation: true,
        extracted: this.extractDistance(description)
      };
    }
    
    return null;
  }

  extractDistance(description) {
    const distanceMatch = description.match(/(\d+)\s*(km|miles|m)/i);
    if (distanceMatch) {
      return {
        value: parseInt(distanceMatch[1]),
        unit: distanceMatch[2].toLowerCase()
      };
    }
    return null;
  }

  extractMaterialType(description) {
    const materialTypes = ['steel', 'aluminum', 'plastic', 'wood', 'concrete', 'fabric', 'paper', 'glass'];
    
    for (const material of materialTypes) {
      if (description.includes(material)) {
        return material;
      }
    }
    
    return null;
  }

  extractEnergySource(description) {
    const energySources = {
      'solar': ['solar', 'pv', 'photovoltaic'],
      'wind': ['wind', 'turbine'],
      'hydro': ['hydro', 'water'],
      'grid': ['grid', 'electricity', 'power'],
      'diesel': ['diesel'],
      'petrol': ['petrol', 'gasoline'],
      'cng': ['cng', 'compressed natural gas']
    };

    for (const [source, keywords] of Object.entries(energySources)) {
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
          return source;
        }
      }
    }

    return null;
  }
}

module.exports = new DataProcessorAgent();