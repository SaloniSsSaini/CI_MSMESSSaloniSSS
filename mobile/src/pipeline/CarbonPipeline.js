/**
 * CarbonPipeline - Main orchestrator for carbon classification
 * Combines spam detection, category classification, quantity extraction, and scope attribution
 */

import { QuantityExtractor, extractQuantity, extractAmount } from './QuantityExtractor';
import { CategoryClassifier, classifyCategory } from './CategoryClassifier';
import { ScopeAttributor, attributeScope, GHGScope } from './ScopeAttributor';

// ============= Message Classification Patterns (from index.js) =============

// Financial transactions - debits/credits
const RE_DEBIT_CREDIT = /\b(debited|credited|withdrawn|deposited|transferred|paid\s*to|received\s*from|sent\s*to)\b/i;
const RE_ACCOUNT_INFO = /\b(a\/c\s*[x*]+\d+|acct?\s*[x*]+\d+|available\s*bal|avl\s*bal|current\s*bal|closing\s*bal|statement)\b/i;
const RE_TXN_REF = /\b(upi\s*ref|imps\s*ref|neft\s*ref|txn\s*id|ref\s*no|transaction\s*id)\b/i;
const RE_EMI_PAYMENT = /\b(emi\s*of\s*rs|emi\s*paid|emi\s*due|loan\s*emi|emi\s*amount|auto\s*debit|mandate)\b/i;
const RE_BILL_PAYMENT = /\b(bill\s*paid|payment\s*successful|payment\s*received|payment\s*confirmed|recharge\s*successful)\b/i;

// OTP and spam patterns
const RE_OTP = /\b(otp|one[-\s]?time\s*password|verification\s*code|auth\s*code|code\s*is\s*\d{4,8}|your\s*otp|otp\s*for|valid\s*for\s*\d+\s*min|do\s*not\s*share|pin\s*is)\b/i;
const RE_PROMOTIONAL = /\b(offer|discount|sale|deal|cashback|coupon|promo|off\s*on|flat\s*\d+%|upto\s*\d+%|limited\s*time|exclusive|special\s*price|shop\s*now|buy\s*now|order\s*now)\b/i;

// Expense tracking keywords (MSME relevant)
const RE_EXPENSE = /\b(fuel|diesel|petrol|electricity|kwh|invoice|dispatch|vendor|supplier|material|purchase\s*order)\b/i;

/**
 * Detect if message is a financial transaction (important)
 */
function isImportantTransaction(text) {
    const t = (text || '').trim();

    const hasDebitCredit = RE_DEBIT_CREDIT.test(t);
    const hasAccountInfo = RE_ACCOUNT_INFO.test(t);
    const hasTxnRef = RE_TXN_REF.test(t);
    const hasEMIPayment = RE_EMI_PAYMENT.test(t);
    const hasBillPayment = RE_BILL_PAYMENT.test(t);
    const hasExpense = RE_EXPENSE.test(t);

    return hasDebitCredit || hasAccountInfo || hasTxnRef || hasEMIPayment || hasBillPayment || hasExpense;
}

/**
 * Detect if message is spam/non-important
 */
function isSpamMessage(text) {
    const t = (text || '').trim();

    const hasOTP = RE_OTP.test(t);
    const hasPromo = RE_PROMOTIONAL.test(t);

    // OTP and promotional are considered "spam" (non-important for MSME)
    return hasOTP || hasPromo;
}

/**
 * Process a single message through the carbon classification pipeline
 * @param {string} text - SMS message text
 * @param {string|null} sender - Sender ID
 * @returns {Object} - Complete classification result
 */
export function processMessage(text, sender = null) {
    const t = (text || '').trim();

    // Empty message
    if (!t) {
        return {
            isImportant: false,
            isSpam: true,
            category: null,
            classification: null,
            quantity: null,
            amount: null,
            scope: null,
            reasonCodes: ['empty_message'],
        };
    }

    // Check if spam (OTP, promo, etc.)
    const isSpam = isSpamMessage(t);
    const isImportant = isImportantTransaction(t);

    // Extract quantity and amount
    const quantity = extractQuantity(t);
    const amount = extractAmount(t);

    // Classify category
    const classification = classifyCategory(t, quantity);

    // Attribute GHG scope
    const scope = attributeScope(t, classification, quantity);

    // Build reason codes
    const reasonCodes = [...classification.reasonCodes];
    if (isImportant) reasonCodes.push('important_transaction');
    if (isSpam) reasonCodes.push('spam_detected');
    if (quantity) reasonCodes.push(`quantity_${quantity.unit}`);
    if (amount) reasonCodes.push('amount_extracted');

    return {
        isImportant,
        isSpam,
        category: classification.category,
        classification: {
            category: classification.category,
            subcategory: classification.subcategory,
            activity: classification.activity,
            confidence: classification.confidence,
        },
        quantity,
        amount,
        scope: {
            ghgScope: scope.scope,
            category: scope.category,
            reason: scope.reason,
        },
        reasonCodes,
    };
}

/**
 * Get category display info
 */
export function getCategoryInfo(category) {
    const categoryMap = {
        fuel: { label: 'Fuel', icon: '⛽', color: '#FF6B6B' },
        energy: { label: 'Energy', icon: '⚡', color: '#4ECDC4' },
        transport: { label: 'Transport', icon: '🚗', color: '#45B7D1' },
        waste: { label: 'Waste', icon: '♻️', color: '#96CEB4' },
        procurement: { label: 'Procurement', icon: '📦', color: '#FFEAA7' },
        food: { label: 'Food', icon: '🍽️', color: '#DDA0DD' },
        other: { label: 'Other', icon: '📄', color: '#95A5A6' },
    };

    return categoryMap[category] || categoryMap.other;
}

/**
 * Get scope display info
 */
export function getScopeInfo(scope) {
    const scopeMap = {
        [GHGScope.SCOPE_1]: { label: 'Scope 1', description: 'Direct emissions', color: '#E74C3C' },
        [GHGScope.SCOPE_2]: { label: 'Scope 2', description: 'Purchased energy', color: '#3498DB' },
        [GHGScope.SCOPE_3]: { label: 'Scope 3', description: 'Indirect emissions', color: '#2ECC71' },
        [GHGScope.SCOPE_4]: { label: 'Avoided', description: 'Reductions', color: '#9B59B6' },
        [GHGScope.SCOPE_5]: { label: 'Offsets', description: 'Credits/removals', color: '#1ABC9C' },
        [GHGScope.SCOPE_6]: { label: 'Reporting', description: 'Governance', color: '#F39C12' },
        [GHGScope.SCOPE_7]: { label: 'Policy', description: 'Compliance', color: '#7F8C8D' },
        [GHGScope.UNKNOWN]: { label: 'Unknown', description: 'Unclassified', color: '#BDC3C7' },
    };

    return scopeMap[scope] || scopeMap[GHGScope.UNKNOWN];
}

export class CarbonPipeline {
    static process(text, sender = null) {
        return processMessage(text, sender);
    }

    static getCategoryInfo(category) {
        return getCategoryInfo(category);
    }

    static getScopeInfo(scope) {
        return getScopeInfo(scope);
    }
}

// Re-export components
export { QuantityExtractor, CategoryClassifier, ScopeAttributor, GHGScope };
