// Self-contained message filter for React Native
// MSME Context: NOT SPAM = Important transactions only, SPAM = Everything else (OTPs, promos, etc.)

import spamArtifact from "../../artifacts/spam_model.json";

// ============= Hashing Vectorizer =============

const WHITESPACE_REGEX = /\s+/g;

function normalizeText(text = "") {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

class HashingVectorizer {
  constructor(analyzer, ngramRange, nFeatures) {
    this.analyzer = analyzer;
    this.ngramRange = Array.isArray(ngramRange) ? ngramRange : [ngramRange, ngramRange];
    this.nFeatures = nFeatures;
  }

  tokenize(text) {
    const normalized = normalizeText(text);
    if (!normalized) {
      return [];
    }
    if (this.analyzer === "word") {
      return normalized.split(WHITESPACE_REGEX);
    }
    return [...normalized];
  }

  extractNgrams(tokens) {
    const [minN, maxN] = this.ngramRange;
    const ngrams = [];
    for (let n = minN; n <= maxN; n += 1) {
      for (let i = 0; i <= tokens.length - n; i += 1) {
        const gram = tokens.slice(i, i + n).join(this.analyzer === "word" ? " " : "");
        ngrams.push(gram);
      }
    }
    return ngrams;
  }

  hashNgram(ngram) {
    let hash = 0;
    for (let i = 0; i < ngram.length; i += 1) {
      hash = (hash << 5) - hash + ngram.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.nFeatures;
  }

  transform(text, normalize = true) {
    const tokens = this.tokenize(text);
    if (!tokens.length) {
      return new Map();
    }
    const ngrams = this.extractNgrams(tokens);
    const features = new Map();
    ngrams.forEach((ngram) => {
      const idx = this.hashNgram(ngram);
      features.set(idx, (features.get(idx) || 0) + 1);
    });

    if (normalize && features.size > 0) {
      let sumSquares = 0;
      features.forEach((value) => {
        sumSquares += value * value;
      });
      const norm = Math.sqrt(sumSquares);
      if (norm > 0) {
        features.forEach((value, idx) => {
          features.set(idx, value / norm);
        });
      }
    }

    return features;
  }
}

class DualHashingEncoder {
  constructor(config) {
    this.wordVectorizer = new HashingVectorizer(
      config.word.analyzer,
      config.word.ngram_range,
      config.word.n_features,
    );
    this.charVectorizer = new HashingVectorizer(
      config.char.analyzer,
      config.char.ngram_range,
      config.char.n_features,
    );
    this.wordSize = config.word.n_features;
    this.totalFeatures = config.word.n_features + config.char.n_features;
  }

  transform(text) {
    const wordFeatures = this.wordVectorizer.transform(text, false);
    const charFeatures = this.charVectorizer.transform(text, false);
    const combined = new Map(wordFeatures);

    charFeatures.forEach((value, idx) => {
      const adjustedIdx = idx + this.wordSize;
      combined.set(adjustedIdx, (combined.get(adjustedIdx) || 0) + value);
    });

    if (combined.size > 0) {
      let sumSquares = 0;
      combined.forEach((value) => {
        sumSquares += value * value;
      });
      const norm = Math.sqrt(sumSquares);
      if (norm > 0) {
        combined.forEach((value, idx) => {
          combined.set(idx, value / norm);
        });
      }
    }

    return combined;
  }
}

// ============= Linear Model =============

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function sparseDotProduct(sparseVector, denseVector) {
  let sum = 0;
  sparseVector.forEach((count, idx) => {
    if (idx < denseVector.length) {
      sum += count * denseVector[idx];
    }
  });
  return sum;
}

class LinearModel {
  constructor(artifact) {
    this.classes = artifact.classes;
    this.encoder = new DualHashingEncoder(artifact.vectorizer);
    this.isBinary = !Array.isArray(artifact.coef?.[0]);
    this.coef = artifact.coef;
    this.intercept = artifact.intercept;

    if (this.isBinary && Array.isArray(this.coef)) {
      this.coef = [...this.coef];
    } else if (Array.isArray(this.coef)) {
      this.coef = this.coef.map((row) => [...row]);
    }
  }

  predict(text) {
    const features = this.encoder.transform(text);
    if (this.isBinary) {
      const logit = sparseDotProduct(features, this.coef) + this.intercept[0];
      const prob = sigmoid(logit);
      return { classes: this.classes, probabilities: [1 - prob, prob] };
    }

    const logits = this.coef.map((row, idx) => sparseDotProduct(features, row) + this.intercept[idx]);
    const maxLogit = Math.max(...logits);
    const expValues = logits.map((logit) => Math.exp(logit - maxLogit));
    const total = expValues.reduce((acc, value) => acc + value, 0);
    const probabilities = expValues.map((value) => value / total);
    return { classes: this.classes, probabilities };
  }
}

// ============= Message Classification Patterns =============

// ======= IMPORTANT TRANSACTIONS (NOT SPAM) =======
// These are the ONLY messages that should appear in "Not Spam" tab

// Financial transactions - debits/credits
const RE_DEBIT_CREDIT = /\b(debited|credited|withdrawn|deposited|transferred|paid\s*to|received\s*from|sent\s*to)\b/i;

// Account balance/statement
const RE_ACCOUNT_INFO = /\b(a\/c\s*[x*]+\d+|acct?\s*[x*]+\d+|available\s*bal|avl\s*bal|current\s*bal|closing\s*bal|statement)\b/i;

// UPI/NEFT/IMPS transactions with reference
const RE_TXN_REF = /\b(upi\s*ref|imps\s*ref|neft\s*ref|txn\s*id|ref\s*no|transaction\s*id)\b/i;

// EMI/Loan payment confirmation
const RE_EMI_PAYMENT = /\b(emi\s*of\s*rs|emi\s*paid|emi\s*due|loan\s*emi|emi\s*amount|auto\s*debit|mandate)\b/i;

// Bill payment confirmations
const RE_BILL_PAYMENT = /\b(bill\s*paid|payment\s*successful|payment\s*received|payment\s*confirmed|recharge\s*successful)\b/i;

// Expense tracking keywords (MSME relevant)
const RE_EXPENSE = /\b(fuel|diesel|petrol|electricity|kwh|invoice|dispatch|vendor|supplier|material|purchase\s*order)\b/i;

// ======= NOT IMPORTANT (SPAM) =======
// OTPs, promotional, general info - goes to "Spam" tab

// OTP messages
const RE_OTP = /\b(otp|one[-\s]?time\s*password|verification\s*code|auth\s*code|code\s*is\s*\d{4,8}|your\s*otp|otp\s*for|valid\s*for\s*\d+\s*min|do\s*not\s*share|pin\s*is)\b/i;

// Promotional content
const RE_PROMOTIONAL = /\b(offer|discount|sale|deal|cashback|coupon|promo|off\s*on|flat\s*\d+%|upto\s*\d+%|limited\s*time|exclusive|special\s*price|shop\s*now|buy\s*now|order\s*now)\b/i;

// Marketing messages
const RE_MARKETING = /\b(new\s*launch|introducing|check\s*out|visit\s*store|download\s*app|install\s*now|subscribe|follow\s*us|like\s*us)\b/i;

// Alerts/notifications (not transactions)
const RE_ALERTS = /\b(reminder|due\s*date|upcoming|scheduled|expiring|renewal|kyc\s*update|update\s*kyc|link\s*pan|verify)\b/i;

// Delivery notifications
const RE_DELIVERY = /\b(out\s*for\s*delivery|delivered|shipped|dispatched|arriving|in\s*transit|track\s*your|order\s*status)\b/i;

// Service notifications
const RE_SERVICE = /\b(subscription|plan\s*activated|plan\s*expired|data\s*balance|validity|recharged|activated|deactivated)\b/i;

// ============= DLT Header Detection =============

/**
 * Check if sender is a DLT (registered) header vs personal mobile number
 * DLT headers are alphanumeric like: XX-HDFCBK, SBIINB, VM-SWIGGY, AD-ICICIB
 * Personal numbers are: +919876543210, 9876543210, +91-9876543210
 */
function isDLTHeader(sender) {
  if (!sender) return false;

  const s = (sender || "").trim();
  if (!s) return false;

  // Pattern for personal mobile numbers (Indian)
  // Matches: +919876543210, 919876543210, 9876543210, +91-9876543210, +91 9876543210
  const personalNumberPattern = /^(\+?91[-\s]?)?[6-9]\d{9}$/;

  // If it's a personal number, it's NOT a DLT header
  if (personalNumberPattern.test(s.replace(/[-\s]/g, ''))) {
    return false;
  }

  // Pattern for DLT headers (alphanumeric sender IDs)
  // Matches: XX-HDFCBK, HDFCBK, VM-SWIGGY, AD-ICICIB, SBIINB, JK-PYTMSG
  // Typically 2-8 alphanumeric characters, optionally with prefix like XX-, VM-, AD-, JK-
  const dltHeaderPattern = /^([A-Z]{2}[-])?[A-Z0-9]{2,8}$/i;

  // Additional pattern for longer headers like HDFCBANK, IKIBNK, etc.
  const extendedDltPattern = /^[A-Z]{2,}[-]?[A-Z0-9]+$/i;

  return dltHeaderPattern.test(s) || extendedDltPattern.test(s);
}

/**
 * Check if sender looks like a personal/unknown number (not a registered business)
 */
function isPersonalNumber(sender) {
  if (!sender) return true; // No sender = treat as personal/unknown

  const s = (sender || "").trim();
  if (!s) return true;

  // Pattern for personal mobile numbers (Indian)
  const personalNumberPattern = /^(\+?91[-\s]?)?[6-9]\d{9}$/;

  // Pattern for international numbers
  const internationalPattern = /^\+?\d{10,15}$/;

  const cleanedSender = s.replace(/[-\s]/g, '');

  return personalNumberPattern.test(cleanedSender) || internationalPattern.test(cleanedSender);
}

/**
 * Message classification for MSME context.
 * 
 * NOT SPAM = Important financial transactions from DLT headers only
 * SPAM = Everything else (OTPs, promos, alerts, delivery, personal messages, etc.)
 */
function detectSpamRules(text, sender = null) {
  const t = (text || "").trim();
  if (!t) {
    return { isSpam: true, score: 1.0, signals: ["empty"], isTransactional: false };
  }

  const signals = [];

  // ========== FIRST CHECK: Sender Type ==========
  // Messages from personal numbers are always spam (not transactions)
  if (isPersonalNumber(sender)) {
    signals.push("personal_number");
    return {
      isSpam: true,
      score: 1.0,
      signals,
      isTransactional: false,
    };
  }

  // If sender is a DLT header, continue with content analysis
  if (isDLTHeader(sender)) {
    signals.push("dlt_header");
  }

  // ========== CHECK FOR IMPORTANT TRANSACTIONS (NOT SPAM) ==========

  const hasDebitCredit = RE_DEBIT_CREDIT.test(t);
  const hasAccountInfo = RE_ACCOUNT_INFO.test(t);
  const hasTxnRef = RE_TXN_REF.test(t);
  const hasEMIPayment = RE_EMI_PAYMENT.test(t);
  const hasBillPayment = RE_BILL_PAYMENT.test(t);
  const hasExpense = RE_EXPENSE.test(t);

  // Count important transaction signals
  let importantScore = 0;

  if (hasDebitCredit) {
    importantScore += 0.5;
    signals.push("debit_credit");
  }
  if (hasAccountInfo) {
    importantScore += 0.3;
    signals.push("account_info");
  }
  if (hasTxnRef) {
    importantScore += 0.3;
    signals.push("txn_ref");
  }
  if (hasEMIPayment) {
    importantScore += 0.4;
    signals.push("emi_payment");
  }
  if (hasBillPayment) {
    importantScore += 0.3;
    signals.push("bill_payment");
  }
  if (hasExpense) {
    importantScore += 0.25;
    signals.push("expense_related");
  }

  // If strong transaction signals AND from DLT header -> NOT SPAM
  if (importantScore >= 0.5) {
    return {
      isSpam: false,
      score: 1.0 - importantScore,
      signals,
      isTransactional: true,
    };
  }

  // ========== CHECK FOR NON-IMPORTANT MESSAGES (SPAM) ==========

  const hasOTP = RE_OTP.test(t);
  const hasPromo = RE_PROMOTIONAL.test(t);
  const hasMarketing = RE_MARKETING.test(t);
  const hasAlerts = RE_ALERTS.test(t);
  const hasDelivery = RE_DELIVERY.test(t);
  const hasService = RE_SERVICE.test(t);

  let spamScore = 0;

  if (hasOTP) {
    spamScore += 0.6;
    signals.push("otp");
  }
  if (hasPromo) {
    spamScore += 0.5;
    signals.push("promotional");
  }
  if (hasMarketing) {
    spamScore += 0.4;
    signals.push("marketing");
  }
  if (hasAlerts) {
    spamScore += 0.3;
    signals.push("alerts");
  }
  if (hasDelivery) {
    spamScore += 0.3;
    signals.push("delivery");
  }
  if (hasService) {
    spamScore += 0.3;
    signals.push("service_notif");
  }

  // No clear signals either way -> consider as spam (not important)
  if (spamScore === 0 && importantScore === 0) {
    signals.push("unclassified");
    spamScore = 0.6;
  }

  spamScore = Math.min(1.0, spamScore);

  return {
    isSpam: spamScore >= 0.3,  // Low threshold - most non-transaction messages are "spam"
    score: spamScore,
    signals,
    isTransactional: false,
  };
}

// ============= Spam Detector =============

class SpamDetector {
  constructor(mlModel = null, options = {}) {
    this.mlModel = mlModel;
    this.threshold = options.threshold ?? 0.3;
  }

  predict(text, sender = null) {
    const ruleResult = detectSpamRules(text, sender);
    const reasonCodes = [...ruleResult.signals];

    // Rules-only approach for this specific use case
    // ML model is not used as we have clear business rules

    return {
      isSpam: ruleResult.isSpam,
      confidence: ruleResult.isSpam ? ruleResult.score : (1.0 - ruleResult.score),
      reasonCodes,
      ruleScore: ruleResult.score,
      mlScore: null,
      isTransactional: ruleResult.isTransactional,
    };
  }
}

// ============= Exports =============

export function createSpamDetector(options = {}) {
  const spamModel = new LinearModel(spamArtifact);
  return new SpamDetector(spamModel, options);
}

export { SpamDetector, LinearModel, detectSpamRules, isDLTHeader, isPersonalNumber };

// Re-export CarbonPipeline components
export { processMessage, getCategoryInfo, getScopeInfo, CarbonPipeline } from './CarbonPipeline';
export { extractQuantity, extractAmount, QuantityExtractor } from './QuantityExtractor';
export { classifyCategory, CategoryClassifier } from './CategoryClassifier';
export { attributeScope, ScopeAttributor, GHGScope } from './ScopeAttributor';

// Re-export ExpenseClassifier components
export {
  classifyExpense,
  parseUPITransaction,
  extractExpenseAmount,
  getExpenseCategoryInfo,
  ExpenseClassifier,
  ExpenseCategory,
  ExpenseSubcategory,
} from './ExpenseClassifier';

// Re-export IndustryClassifier components (MSME B2B classification)
export {
  classifyIndustry,
  getIndustryInfo,
  getAllIndustries,
  IndustryClassifier,
  IndustrySector,
} from './IndustryClassifier';

// Re-export MSMERules for carbon calculation
export {
  SECTOR_MODELS,
  getSectorModel,
  BASE_TRANSACTION_TYPES,
  BASE_LOCATION_WEIGHTAGES,
  SECTOR_LOCATION_SENSITIVITY,
} from './MSMERules';