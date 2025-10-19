const natural = require('natural');
const compromise = require('compromise');

class SMSService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.classifier = new natural.BayesClassifier();
    
    // Initialize with common transaction patterns
    this.initializePatterns();
  }

  initializePatterns() {
    // Transaction type patterns
    const patterns = {
      purchase: [
        'purchased', 'bought', 'order', 'invoice', 'payment made',
        'debit', 'paid to', 'purchase order', 'procurement'
      ],
      sale: [
        'sold', 'sale', 'received payment', 'credit', 'invoice generated',
        'order received', 'customer payment', 'revenue'
      ],
      expense: [
        'expense', 'cost', 'spent', 'bill', 'charges', 'fees',
        'maintenance', 'repair', 'service charge'
      ],
      utility: [
        'electricity', 'water', 'gas', 'internet', 'phone', 'utility',
        'power bill', 'water bill', 'energy consumption'
      ],
      transport: [
        'fuel', 'diesel', 'petrol', 'transport', 'shipping', 'logistics',
        'delivery', 'freight', 'vehicle'
      ]
    };

    // Train classifier with patterns
    Object.entries(patterns).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        this.classifier.addDocument(keyword, type);
      });
    });
    
    this.classifier.train();
  }

  async processSMS(smsData) {
    try {
      const { body, sender, timestamp, messageId } = smsData;
      
      // Extract transaction information
      const transaction = await this.extractTransactionData(body, sender, timestamp, messageId);
      
      return {
        success: true,
        transaction,
        confidence: transaction.metadata.confidence
      };
    } catch (error) {
      console.error('SMS processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async extractTransactionData(text, sender, timestamp, messageId) {
    // Clean and normalize text
    const cleanText = text.toLowerCase().trim();
    
    // Extract amount using regex
    const amountMatch = cleanText.match(/(?:rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
    
    // Extract date
    const dateMatch = cleanText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const extractedDate = dateMatch ? new Date(dateMatch[1]) : new Date(timestamp);
    
    // Classify transaction type
    const transactionType = this.classifier.classify(cleanText);
    
    // Extract vendor/merchant name
    const vendorName = this.extractVendorName(cleanText, sender);
    
    // Determine category based on content
    const category = this.determineCategory(cleanText, transactionType);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(cleanText, amount, transactionType);
    
    // Extract sustainability factors
    const sustainabilityFactors = this.extractSustainabilityFactors(cleanText);
    
    return {
      source: 'sms',
      sourceId: messageId,
      transactionType,
      amount: amount || 0,
      currency: 'INR',
      description: text,
      vendor: {
        name: vendorName,
        category: this.categorizeVendor(vendorName),
        location: this.extractLocation(cleanText)
      },
      category,
      subcategory: this.extractSubcategory(cleanText, category),
      date: extractedDate,
      carbonFootprint: {
        co2Emissions: 0, // Will be calculated later
        emissionFactor: 0,
        calculationMethod: 'sms_extraction'
      },
      sustainability: {
        isGreen: sustainabilityFactors.length > 0,
        greenScore: this.calculateGreenScore(sustainabilityFactors),
        sustainabilityFactors
      },
      metadata: {
        originalText: text,
        extractedData: {
          amountMatch: amountMatch?.[0],
          dateMatch: dateMatch?.[0],
          sender: sender
        },
        confidence
      },
      tags: this.extractTags(cleanText)
    };
  }

  extractVendorName(text, sender) {
    // Common patterns for vendor names in SMS
    const patterns = [
      /from\s+([a-z\s]+)/i,
      /to\s+([a-z\s]+)/i,
      /at\s+([a-z\s]+)/i,
      /merchant:\s*([a-z\s]+)/i,
      /vendor:\s*([a-z\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // If no pattern matches, use sender or extract from common merchant names
    return this.getCommonMerchantName(text) || sender;
  }

  getCommonMerchantName(text) {
    const merchants = [
      'amazon', 'flipkart', 'swiggy', 'zomato', 'uber', 'ola',
      'paytm', 'phonepe', 'google pay', 'razorpay', 'stripe',
      'electricity board', 'water board', 'gas company'
    ];
    
    for (const merchant of merchants) {
      if (text.includes(merchant)) {
        return merchant;
      }
    }
    
    return null;
  }

  determineCategory(text, transactionType) {
    const categoryMap = {
      'purchase': 'raw_materials',
      'sale': 'other',
      'expense': 'other',
      'utility': 'energy',
      'transport': 'transportation'
    };
    
    // Override based on content analysis
    if (text.includes('electricity') || text.includes('power')) return 'energy';
    if (text.includes('water')) return 'water';
    if (text.includes('fuel') || text.includes('diesel') || text.includes('petrol')) return 'transportation';
    if (text.includes('waste') || text.includes('recycling')) return 'waste_management';
    if (text.includes('equipment') || text.includes('machinery')) return 'equipment';
    
    return categoryMap[transactionType] || 'other';
  }

  extractSubcategory(text, category) {
    const subcategoryMap = {
      'energy': text.includes('solar') ? 'renewable' : 'grid',
      'transportation': text.includes('diesel') ? 'diesel' : 'petrol',
      'raw_materials': text.includes('steel') ? 'steel' : 'general',
      'waste_management': text.includes('recycling') ? 'recycling' : 'disposal'
    };
    
    return subcategoryMap[category] || 'general';
  }

  extractLocation(text) {
    // Simple location extraction - can be enhanced with NLP
    const locationPatterns = [
      /in\s+([a-z\s]+)/i,
      /at\s+([a-z\s]+)/i,
      /location:\s*([a-z\s]+)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  categorizeVendor(vendorName) {
    const categories = {
      'energy': ['electricity', 'power', 'energy'],
      'transport': ['fuel', 'diesel', 'petrol', 'transport'],
      'materials': ['steel', 'aluminum', 'plastic', 'raw'],
      'utilities': ['water', 'gas', 'internet', 'phone'],
      'services': ['maintenance', 'repair', 'service']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => vendorName.toLowerCase().includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  extractSustainabilityFactors(text) {
    const factors = [];
    
    const greenKeywords = [
      'solar', 'wind', 'renewable', 'green', 'eco', 'sustainable',
      'recycling', 'recycled', 'biodegradable', 'organic', 'natural'
    ];
    
    greenKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        factors.push(keyword);
      }
    });
    
    return factors;
  }

  calculateGreenScore(factors) {
    if (factors.length === 0) return 0;
    
    const baseScore = factors.length * 20; // 20 points per factor
    return Math.min(100, baseScore);
  }

  extractTags(text) {
    const tags = [];
    
    // Extract common tags
    if (text.includes('urgent')) tags.push('urgent');
    if (text.includes('recurring')) tags.push('recurring');
    if (text.includes('one-time')) tags.push('one-time');
    if (text.includes('bulk')) tags.push('bulk');
    if (text.includes('discount')) tags.push('discount');
    
    return tags;
  }

  calculateConfidence(text, amount, transactionType) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence if amount is found
    if (amount && amount > 0) confidence += 0.3;
    
    // Increase confidence if transaction type is clear
    if (transactionType !== 'other') confidence += 0.2;
    
    // Decrease confidence for very short texts
    if (text.length < 20) confidence -= 0.2;
    
    // Increase confidence for structured messages
    if (text.includes('rs') || text.includes('₹') || text.includes('inr')) confidence += 0.1;
    
    return Math.min(1, Math.max(0, confidence));
  }
}

module.exports = new SMSService();