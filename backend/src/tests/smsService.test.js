const SMSService = require('../services/smsService');

describe('SMS Service', () => {
  let service;

  beforeEach(() => {
    service = SMSService;
  });

  describe('processSMS', () => {
    test('should process valid SMS data successfully', async () => {
      const smsData = {
        body: 'Rs. 1000 debited from your account for electricity bill payment',
        sender: 'BANK',
        timestamp: new Date(),
        messageId: 'msg_123'
      };

      const result = await service.processSMS(smsData);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction.amount).toBe(1000);
      expect(result.transaction.category).toBe('energy');
      expect(result.transaction.transactionType).toBe('utility');
    });

    test('should handle SMS processing errors gracefully', async () => {
      const smsData = {
        body: '',
        sender: 'BANK',
        timestamp: new Date(),
        messageId: 'msg_123'
      };

      const result = await service.processSMS(smsData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('extractTransactionData', () => {
    test('should extract amount from SMS text', async () => {
      const text = 'Rs. 2500 debited for fuel purchase';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.amount).toBe(2500);
      expect(result.currency).toBe('INR');
    });

    test('should extract amount with different formats', async () => {
      const text = '₹1,500 credited to your account';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.amount).toBe(1500);
    });

    test('should extract date from SMS text', async () => {
      const text = 'Payment of Rs. 1000 on 15/12/2023';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.date).toBeDefined();
    });

    test('should classify transaction type correctly', async () => {
      const text = 'Rs. 5000 received from customer ABC Ltd';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.transactionType).toBe('sale');
    });

    test('should determine category based on content', async () => {
      const text = 'Rs. 2000 for electricity bill';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.category).toBe('energy');
    });

    test('should extract vendor name from SMS', async () => {
      const text = 'Payment of Rs. 1000 to XYZ Suppliers';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.vendor.name).toBe('Xyz Suppliers');
    });

    test('should extract sustainability factors', async () => {
      const text = 'Rs. 3000 for solar panel installation';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.sustainability.isGreen).toBe(true);
      expect(result.sustainability.greenScore).toBeGreaterThan(0);
    });

    test('should calculate confidence score', async () => {
      const text = 'Rs. 1000 debited for electricity bill payment on 15/12/2023';
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');

      expect(result.metadata.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('transaction type classification', () => {
    test.each([
      ['purchase', 'Rs. 12000 paid to supplier for purchase order 778'],
      ['sale', 'Rs. 5000 received payment from customer ABC'],
      ['expense', 'Rs. 800 service charge applied for maintenance'],
      ['utility', 'Electricity bill of Rs. 1500 debited'],
      ['transport', 'Fuel purchase Rs. 2000 for transport service'],
      ['investment', 'Equity investment of Rs. 50000 received'],
      ['other', 'OTP 123456 for login verification']
    ])('should classify %s transactions', async (expectedType, text) => {
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');
      expect(result.transactionType).toBe(expectedType);
    });
  });

  describe('sector/category detection', () => {
    test.each([
      ['energy', 'Electricity bill payment Rs. 1000'],
      ['water', 'Water bill payment Rs. 500'],
      ['transportation', 'Diesel fuel purchase Rs. 2000'],
      ['waste_management', 'Waste disposal charges Rs. 300'],
      ['equipment', 'Machinery equipment purchase Rs. 5000'],
      ['raw_materials', 'Purchased steel sheets for Rs. 9000'],
      ['maintenance', 'Maintenance and repair service charge Rs. 1200'],
      ['utilities', 'Internet bill payment Rs. 800'],
      ['other', 'Administrative fee charged Rs. 400']
    ])('should categorize %s sector messages', async (expectedCategory, text) => {
      const result = await service.extractTransactionData(text, 'BANK', new Date(), 'msg_123');
      expect(result.category).toBe(expectedCategory);
    });
  });

  describe('extractVendorName', () => {
    test('should extract vendor name from "from" pattern', () => {
      const text = 'Payment received from ABC Company';
      const sender = 'BANK';
      const result = service.extractVendorName(text, sender);

      expect(result).toBe('ABC Company');
    });

    test('should extract vendor name from "to" pattern', () => {
      const text = 'Payment made to XYZ Suppliers';
      const sender = 'BANK';
      const result = service.extractVendorName(text, sender);

      expect(result).toBe('XYZ Suppliers');
    });

    test('should extract vendor name from "at" pattern', () => {
      const text = 'Purchase at Amazon for Rs. 1000';
      const sender = 'BANK';
      const result = service.extractVendorName(text, sender);

      expect(result).toBe('Amazon');
    });

    test('should return common merchant name when found', () => {
      const text = 'Payment to Flipkart for Rs. 500';
      const sender = 'BANK';
      const result = service.extractVendorName(text, sender);

      expect(result).toBe('Flipkart');
    });

    test('should return sender when no pattern matches', () => {
      const text = 'Some random message';
      const sender = 'BANK';
      const result = service.extractVendorName(text, sender);

      expect(result).toBe('BANK');
    });
  });

  describe('determineCategory', () => {
    test('should categorize energy transactions', () => {
      const text = 'electricity bill payment of rs. 1000';
      const transactionType = 'expense';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('energy');
    });

    test('should categorize water transactions', () => {
      const text = 'water bill payment of rs. 500';
      const transactionType = 'expense';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('water');
    });

    test('should categorize transportation transactions', () => {
      const text = 'fuel purchase of rs. 2000';
      const transactionType = 'expense';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('transportation');
    });

    test('should categorize waste management transactions', () => {
      const text = 'waste disposal charges rs. 300';
      const transactionType = 'expense';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('waste_management');
    });

    test('should categorize equipment transactions', () => {
      const text = 'equipment purchase rs. 5000';
      const transactionType = 'purchase';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('equipment');
    });

    test('should use transaction type for unknown content', () => {
      const text = 'Some random transaction';
      const transactionType = 'purchase';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('raw_materials');
    });

    test('should categorize maintenance transactions', () => {
      const text = 'maintenance and repair charges';
      const transactionType = 'expense';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('maintenance');
    });

    test('should categorize utilities transactions', () => {
      const text = 'internet bill payment';
      const transactionType = 'utility';
      const result = service.determineCategory(text, transactionType);

      expect(result).toBe('utilities');
    });
  });

  describe('extractSubcategory', () => {
    test('should extract renewable energy subcategory', () => {
      const text = 'solar panel installation rs. 10000';
      const category = 'energy';
      const result = service.extractSubcategory(text, category);

      expect(result).toBe('renewable');
    });

    test('should extract grid energy subcategory', () => {
      const text = 'electricity bill rs. 1000';
      const category = 'energy';
      const result = service.extractSubcategory(text, category);

      expect(result).toBe('grid');
    });

    test('should extract diesel transportation subcategory', () => {
      const text = 'Diesel purchase Rs. 2000';
      const category = 'transportation';
      const result = service.extractSubcategory(text, category);

      expect(result).toBe('diesel');
    });

    test('should extract steel material subcategory', () => {
      const text = 'steel purchase rs. 5000';
      const category = 'raw_materials';
      const result = service.extractSubcategory(text, category);

      expect(result).toBe('steel');
    });

    test('should extract recycling waste subcategory', () => {
      const text = 'recycling service rs. 500';
      const category = 'waste_management';
      const result = service.extractSubcategory(text, category);

      expect(result).toBe('recycling');
    });
  });

  describe('extractLocation', () => {
    test('should extract location from "in" pattern', () => {
      const text = 'Purchase in Mumbai for Rs. 1000';
      const result = service.extractLocation(text);

      expect(result).toBe('Mumbai');
    });

    test('should extract location from "at" pattern', () => {
      const text = 'Payment at Delhi office';
      const result = service.extractLocation(text);

      expect(result).toBe('Delhi office');
    });

    test('should return null when no location found', () => {
      const text = 'Some random message';
      const result = service.extractLocation(text);

      expect(result).toBeNull();
    });
  });

  describe('categorizeVendor', () => {
    test('should categorize energy vendors', () => {
      const vendorName = 'Electricity Board';
      const result = service.categorizeVendor(vendorName);

      expect(result).toBe('energy');
    });

    test('should categorize transport vendors', () => {
      const vendorName = 'Fuel Station';
      const result = service.categorizeVendor(vendorName);

      expect(result).toBe('transport');
    });

    test('should categorize material vendors', () => {
      const vendorName = 'Steel Suppliers';
      const result = service.categorizeVendor(vendorName);

      expect(result).toBe('materials');
    });

    test('should categorize utility vendors', () => {
      const vendorName = 'Water Board';
      const result = service.categorizeVendor(vendorName);

      expect(result).toBe('utilities');
    });

    test('should return other for unknown vendors', () => {
      const vendorName = 'Unknown Company';
      const result = service.categorizeVendor(vendorName);

      expect(result).toBe('other');
    });
  });

  describe('extractSustainabilityFactors', () => {
    test('should extract green keywords', () => {
      const text = 'Solar panel installation with renewable energy';
      const result = service.extractSustainabilityFactors(text);

      expect(result).toContain('solar');
      expect(result).toContain('renewable');
    });

    test('should extract eco-friendly keywords', () => {
      const text = 'Eco-friendly and sustainable materials';
      const result = service.extractSustainabilityFactors(text);

      expect(result).toContain('eco');
      expect(result).toContain('sustainable');
    });

    test('should return empty array for non-green text', () => {
      const text = 'Regular diesel fuel purchase';
      const result = service.extractSustainabilityFactors(text);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateGreenScore', () => {
    test('should calculate green score based on factors', () => {
      const factors = ['solar', 'renewable', 'eco'];
      const result = service.calculateGreenScore(factors);

      expect(result).toBe(60); // 3 * 20
    });

    test('should cap green score at 100', () => {
      const factors = ['solar', 'renewable', 'eco', 'sustainable', 'green', 'biodegradable'];
      const result = service.calculateGreenScore(factors);

      expect(result).toBe(100);
    });

    test('should return 0 for no factors', () => {
      const factors = [];
      const result = service.calculateGreenScore(factors);

      expect(result).toBe(0);
    });
  });

  describe('extractTags', () => {
    test('should extract urgent tag', () => {
      const text = 'urgent payment required';
      const result = service.extractTags(text);

      expect(result).toContain('urgent');
    });

    test('should extract recurring tag', () => {
      const text = 'recurring monthly payment';
      const result = service.extractTags(text);

      expect(result).toContain('recurring');
    });

    test('should extract bulk tag', () => {
      const text = 'bulk purchase order';
      const result = service.extractTags(text);

      expect(result).toContain('bulk');
    });

    test('should extract discount tag', () => {
      const text = 'Payment with discount applied';
      const result = service.extractTags(text);

      expect(result).toContain('discount');
    });
  });

  describe('calculateConfidence', () => {
    test('should increase confidence for valid amount', () => {
      const text = 'Rs. 1000 payment';
      const amount = 1000;
      const transactionType = 'expense';
      const result = service.calculateConfidence(text, amount, transactionType);

      expect(result).toBeGreaterThan(0.5);
    });

    test('should increase confidence for clear transaction type', () => {
      const text = 'Payment made';
      const amount = 0;
      const transactionType = 'expense';
      const result = service.calculateConfidence(text, amount, transactionType);

      expect(result).toBeCloseTo(0.5, 1);
    });

    test('should decrease confidence for short text', () => {
      const text = 'Rs. 100';
      const amount = 100;
      const transactionType = 'other';
      const result = service.calculateConfidence(text, amount, transactionType);

      expect(result).toBeLessThan(0.8);
    });

    test('should increase confidence for structured messages', () => {
      const text = 'Rs. 1000 debited for electricity bill';
      const amount = 1000;
      const transactionType = 'expense';
      const result = service.calculateConfidence(text, amount, transactionType);

      expect(result).toBeGreaterThan(0.7);
    });
  });
});
