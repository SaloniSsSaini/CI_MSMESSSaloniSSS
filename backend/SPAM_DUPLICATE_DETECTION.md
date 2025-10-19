# Spam and Duplicate Transaction Detection

This document describes the spam and duplicate transaction detection system implemented in the Carbon Intelligence platform.

## Overview

The system automatically detects and filters out spam and duplicate transactions to ensure accurate carbon footprint calculations and analytics. Transactions are analyzed in real-time during processing and marked accordingly.

## Features

### Spam Detection

The spam detection system uses multiple criteria to identify suspicious transactions:

#### Detection Methods

1. **Keyword Analysis**
   - Detects common spam keywords like "urgent", "act now", "free money", etc.
   - Weight: 2 points per keyword match

2. **Pattern Recognition**
   - Excessive caps (5+ consecutive uppercase letters)
   - Multiple exclamation/question marks (3+)
   - Large money amounts with K/M/B suffixes
   - Repeated characters (4+ consecutive)
   - URLs and long number sequences
   - Weight: 3 points per pattern match

3. **Sender Analysis**
   - Suspicious sender patterns (noreply, no-reply, etc.)
   - Suspicious domains (gmail.com, yahoo.com, etc.)
   - Random-looking sender names
   - Weight: 5 points for sender patterns, 3 for domains

4. **Amount Analysis**
   - Suspiciously round large amounts
   - Very large amounts (>1M)
   - Very small amounts (<10) - potential test transactions
   - Weight: 2-3 points based on amount

5. **Timing Analysis**
   - Future transaction dates
   - Very old transaction dates
   - Transactions at exactly midnight
   - Weight: 1-5 points based on timing

#### Spam Threshold

- **Threshold**: 10 points
- **Confidence**: Calculated as min(1, score / 20)

### Duplicate Detection

The duplicate detection system identifies similar transactions within a 10-second window:

#### Detection Methods

1. **Exact Match** (100% similarity)
   - Identical amount, description, vendor, category, and source
   - Weight: 30% amount, 25% description, 20% vendor, 15% category, 10% source

2. **Near Match** (85%+ similarity)
   - Very similar transactions with minor differences
   - Uses Jaccard similarity for text comparison

3. **Fuzzy Match** (70%+ similarity)
   - Similar transactions with some variations
   - Accounts for typos and minor changes

#### Time Window

- **Window**: 10 seconds before and after transaction time
- **Cache**: Recent transactions cached for 24 hours for performance

## Implementation

### Services

#### SpamDetectionService (`/services/spamDetectionService.js`)

```javascript
// Detect spam in a transaction
const detection = spamDetectionService.detectSpam(transaction, metadata);

// Get spam statistics
const stats = await spamDetectionService.getSpamStatistics(msmeId, startDate, endDate);
```

#### DuplicateDetectionService (`/services/duplicateDetectionService.js`)

```javascript
// Detect duplicates
const detection = await duplicateDetectionService.detectDuplicate(transaction, msmeId);

// Get duplicate statistics
const stats = await duplicateDetectionService.getDuplicateStatistics(msmeId, startDate, endDate);
```

### Database Schema

The Transaction model includes new fields for spam and duplicate detection:

```javascript
{
  // Spam detection fields
  isSpam: Boolean,
  spamScore: Number,
  spamReasons: [String],
  spamConfidence: Number,
  
  // Duplicate detection fields
  isDuplicate: Boolean,
  duplicateType: String, // 'exact', 'near', 'fuzzy'
  similarityScore: Number,
  matchedTransactionId: ObjectId,
  duplicateReasons: [String]
}
```

### Integration Points

#### SMS Processing (`/routes/sms.js`)

- Spam and duplicate detection integrated into `/api/sms/process`
- Bulk processing includes detection for each message
- Skipped transactions are logged and returned with reasons

#### Email Processing (`/routes/email.js`)

- Spam and duplicate detection integrated into `/api/email/process`
- Bulk processing includes detection for each email
- Skipped transactions are logged and returned with reasons

#### Analytics Updates

- All analytics endpoints exclude spam and duplicate transactions
- Queries include filters: `isSpam: { $ne: true }, isDuplicate: { $ne: true }`

## API Endpoints

### Admin Endpoints (`/api/admin/`)

#### Get Spam Transactions
```
GET /api/admin/spam-transactions
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- startDate: Filter start date
- endDate: Filter end date
- source: Filter by source (sms, email, etc.)
- category: Filter by category
```

#### Get Duplicate Transactions
```
GET /api/admin/duplicate-transactions
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10)
- startDate: Filter start date
- endDate: Filter end date
- source: Filter by source
- category: Filter by category
- duplicateType: Filter by type (exact, near, fuzzy)
```

#### Restore Transaction
```
PUT /api/admin/transactions/:id/restore
Description: Restore a spam or duplicate transaction to normal processing
```

#### Confirm and Delete Spam
```
DELETE /api/admin/transactions/:id/confirm-spam
Description: Confirm a transaction as spam and delete it permanently
```

#### Confirm and Delete Duplicate
```
DELETE /api/admin/transactions/:id/confirm-duplicate
Description: Confirm a transaction as duplicate and delete it permanently
```

#### Get Spam Statistics
```
GET /api/admin/spam-statistics
Query Parameters:
- startDate: Analysis start date
- endDate: Analysis end date
```

#### Get Duplicate Statistics
```
GET /api/admin/duplicate-statistics
Query Parameters:
- startDate: Analysis start date
- endDate: Analysis end date
```

#### Manually Mark as Spam
```
POST /api/admin/transactions/:id/mark-spam
Body:
{
  "reasons": ["Manual spam detection reason"]
}
```

#### Manually Mark as Duplicate
```
POST /api/admin/transactions/:id/mark-duplicate
Body:
{
  "matchedTransactionId": "transaction_id",
  "reasons": ["Manual duplicate detection reason"]
}
```

## Configuration

### Spam Detection Thresholds

```javascript
const thresholds = {
  keywordWeight: 2,        // Points per spam keyword
  patternWeight: 3,        // Points per suspicious pattern
  senderWeight: 5,         // Points for suspicious sender
  domainWeight: 3,         // Points for suspicious domain
  spamThreshold: 10,       // Minimum score to mark as spam
  confidenceThreshold: 0.7 // Minimum confidence for spam
};
```

### Duplicate Detection Thresholds

```javascript
const thresholds = {
  exactMatch: 1.0,    // 100% similarity
  nearMatch: 0.85,    // 85% similarity
  fuzzyMatch: 0.70    // 70% similarity
};
```

## Performance Considerations

### Caching

- Recent transactions are cached for 24 hours to avoid repeated database queries
- Cache is automatically cleaned up every 5 minutes
- Cache key format: `{msmeId}_{date}`

### Database Indexes

```javascript
// Optimized indexes for spam/duplicate detection
transactionSchema.index({ isSpam: 1, msmeId: 1 });
transactionSchema.index({ isDuplicate: 1, msmeId: 1 });
transactionSchema.index({ msmeId: 1, date: -1, isSpam: 1, isDuplicate: 1 });
```

## Monitoring and Logging

### Logging

All spam and duplicate detections are logged with:
- Transaction details
- Detection reasons
- Confidence scores
- MSME information

### Statistics

The system provides comprehensive statistics including:
- Total spam/duplicate transactions
- Breakdown by source, category, and type
- Common detection reasons
- Trend analysis over time
- Average similarity scores

## Testing

Comprehensive test suite covers:
- Spam detection with various patterns
- Duplicate detection within time windows
- Integration with transaction processing
- Admin endpoint functionality
- Edge cases and error handling

Run tests with:
```bash
npm test -- spamDuplicateDetection.test.js
```

## Future Enhancements

1. **Machine Learning Integration**
   - Train models on historical spam patterns
   - Improve detection accuracy over time

2. **Advanced Duplicate Detection**
   - Fuzzy matching algorithms
   - Cross-source duplicate detection

3. **Real-time Monitoring**
   - Dashboard for spam/duplicate statistics
   - Alert system for unusual patterns

4. **Configuration Management**
   - Dynamic threshold adjustment
   - Custom spam patterns per MSME

5. **Audit Trail**
   - Track all detection decisions
   - User override history