// Type declarations for pipeline module

export interface SpamPredictionResult {
    isSpam: boolean;
    confidence: number;
    reasonCodes: string[];
    ruleScore: number | null;
    mlScore: number | null;
    isTransactional: boolean;
}

export interface SpamDetector {
    predict(text: string, sender?: string | null): SpamPredictionResult;
}

export interface SpamDetectorOptions {
    threshold?: number;
}

export function createSpamDetector(options?: SpamDetectorOptions): SpamDetector;

export class SpamDetector {
    constructor(mlModel?: any, options?: SpamDetectorOptions);
    predict(text: string, sender?: string | null): SpamPredictionResult;
}

export class LinearModel {
    constructor(artifact: any);
    predict(text: string): { classes: string[]; probabilities: number[] };
}

export function detectSpamRules(
    text: string,
    sender?: string | null
): {
    isSpam: boolean;
    score: number;
    signals: string[];
    isTransactional: boolean;
};

/**
 * Check if sender is a DLT (registered) header vs personal mobile number
 * DLT headers are alphanumeric like: XX-HDFCBK, SBIINB, VM-SWIGGY, AD-ICICIB
 */
export function isDLTHeader(sender: string | null | undefined): boolean;

/**
 * Check if sender looks like a personal/unknown number (not a registered business)
 * Personal numbers are: +919876543210, 9876543210, +91-9876543210
 */
export function isPersonalNumber(sender: string | null | undefined): boolean;

// CarbonPipeline exports
export interface ProcessedMessage {
    isSpam: boolean;
    category: string | null;
    quantity: number | null;
    unit: string | null;
    amount: number | null;
    scope: string | null;
    reasonCodes: string[];
}

export function processMessage(text: string, sender?: string): ProcessedMessage;
export function getCategoryInfo(category: string): { name: string; description: string } | null;
export function getScopeInfo(scope: string): { name: string; description: string } | null;

export class CarbonPipeline {
    process(text: string, sender?: string): ProcessedMessage;
}

// QuantityExtractor exports
export interface QuantityResult {
    value: number;
    unit: string;
    commodity: string;
}

export interface AmountResult {
    value: number;
    currency: string;
}

export function extractQuantity(text: string): QuantityResult | null;
export function extractAmount(text: string): AmountResult | null;

export class QuantityExtractor {
    static extract(text: string): QuantityResult | null;
    static extractAmount(text: string): AmountResult | null;
    static extractAll(text: string): { quantity: QuantityResult | null; amount: AmountResult | null };
}

// CategoryClassifier exports
export type ExpenseCategory = 'energy' | 'fuel' | 'transport' | 'waste' | 'procurement' | 'food' | 'other';

export interface CategoryResult {
    category: ExpenseCategory;
    subcategory: string;
    activity: string;
    confidence: number;
    reasonCodes: string[];
}

export function classifyCategory(text: string, quantity?: QuantityResult | null): CategoryResult;

export class CategoryClassifier {
    static classify(text: string, quantity?: QuantityResult | null): CategoryResult;
}

// ScopeAttributor exports
export const GHGScope: {
    SCOPE_1: string;
    SCOPE_2: string;
    SCOPE_3: string;
};

export function attributeScope(category: string): string | null;

export class ScopeAttributor {
    attribute(category: string): string | null;
}

// ExpenseClassifier exports
export const ExpenseCategory: {
    ENERGY: 'energy';
    FOOD: 'food';
    TRANSPORT: 'transport';
    SHOPPING: 'shopping';
    BILLS: 'bills';
    FINANCE: 'finance';
    HEALTHCARE: 'healthcare';
    ENTERTAINMENT: 'entertainment';
    EDUCATION: 'education';
    TRANSFER: 'transfer';
    OTHER: 'other';
};

export const ExpenseSubcategory: {
    ELECTRICITY: 'electricity';
    GAS: 'gas';
    WATER: 'water';
    DELIVERY: 'delivery';
    GROCERY: 'grocery';
    RESTAURANT: 'restaurant';
    CAB: 'cab';
    FUEL: 'fuel';
    PUBLIC: 'public';
    PARKING: 'parking';
    TOLL: 'toll';
    FLIGHT: 'flight';
    TRAIN: 'train';
    ONLINE: 'online';
    RETAIL: 'retail';
    CLOTHING: 'clothing';
    ELECTRONICS: 'electronics';
    MOBILE: 'mobile';
    DTH: 'dth';
    BROADBAND: 'broadband';
    POSTPAID: 'postpaid';
    EMI: 'emi';
    INSURANCE: 'insurance';
    INVESTMENT: 'investment';
    LOAN: 'loan';
    CREDIT_CARD: 'credit_card';
    PHARMACY: 'pharmacy';
    HOSPITAL: 'hospital';
    DIAGNOSTIC: 'diagnostic';
    CONSULTATION: 'consultation';
    OTT: 'ott';
    MOVIES: 'movies';
    GAMING: 'gaming';
    EVENTS: 'events';
    FEES: 'fees';
    COURSES: 'courses';
    BOOKS: 'books';
    P2P: 'p2p';
    SELF: 'self';
    SALARY: 'salary';
    GENERAL: 'general';
};

export type ExpenseCategoryType =
    | 'energy' | 'food' | 'transport' | 'shopping' | 'bills'
    | 'finance' | 'healthcare' | 'entertainment' | 'education'
    | 'transfer' | 'other';

export type ExpenseSubcategoryType =
    | 'electricity' | 'gas' | 'water' | 'delivery' | 'grocery' | 'restaurant'
    | 'cab' | 'fuel' | 'public' | 'parking' | 'toll' | 'flight' | 'train'
    | 'online' | 'retail' | 'clothing' | 'electronics'
    | 'mobile' | 'dth' | 'broadband' | 'postpaid'
    | 'emi' | 'insurance' | 'investment' | 'loan' | 'credit_card'
    | 'pharmacy' | 'hospital' | 'diagnostic' | 'consultation'
    | 'ott' | 'movies' | 'gaming' | 'events'
    | 'fees' | 'courses' | 'books'
    | 'p2p' | 'self' | 'salary' | 'general';

export interface UPIDetails {
    isUPI: boolean;
    transactionType: 'debit' | 'credit' | null;
    upiRef: string | null;
    upiId: string | null;
    merchantName: string | null;
    paymentApp: string | null;
    accountNumber: string | null;
    bank: string | null;
}

export interface ExpenseClassificationResult {
    category: ExpenseCategoryType;
    subcategory: ExpenseSubcategoryType;
    confidence: number;
    transactionType: 'debit' | 'credit' | null;
    amount: AmountResult | null;
    upiDetails: UPIDetails | null;
    merchant: string | null;
    reasonCodes: string[];
}

export interface ExpenseCategoryInfo {
    label: string;
    icon: string;
    color: string;
    categoryLabel: string;
    categoryIcon: string;
}

export function classifyExpense(text: string, sender?: string | null): ExpenseClassificationResult;
export function parseUPITransaction(text: string): UPIDetails;
export function extractExpenseAmount(text: string): AmountResult | null;
export function getExpenseCategoryInfo(category: string, subcategory?: string | null): ExpenseCategoryInfo;

export class ExpenseClassifier {
    static classify(text: string, sender?: string | null): ExpenseClassificationResult;
    static parseUPI(text: string): UPIDetails;
    static extractAmount(text: string): AmountResult | null;
    static getCategoryInfo(category: string, subcategory?: string | null): ExpenseCategoryInfo;
}

// ============= Industry Classification (MSME/B2B) =============

export type IndustrySectorType =
    | 'manufacturing' | 'trading' | 'services' | 'export_import' | 'retail'
    | 'wholesale' | 'e_commerce' | 'consulting' | 'logistics' | 'agriculture'
    | 'handicrafts' | 'food_processing' | 'textiles' | 'electronics' | 'automotive'
    | 'construction' | 'healthcare' | 'education' | 'tourism' | 'other';

export const IndustrySector: {
    MANUFACTURING: 'manufacturing';
    TRADING: 'trading';
    SERVICES: 'services';
    EXPORT_IMPORT: 'export_import';
    RETAIL: 'retail';
    WHOLESALE: 'wholesale';
    E_COMMERCE: 'e_commerce';
    CONSULTING: 'consulting';
    LOGISTICS: 'logistics';
    AGRICULTURE: 'agriculture';
    HANDICRAFTS: 'handicrafts';
    FOOD_PROCESSING: 'food_processing';
    TEXTILES: 'textiles';
    ELECTRONICS: 'electronics';
    AUTOMOTIVE: 'automotive';
    CONSTRUCTION: 'construction';
    HEALTHCARE: 'healthcare';
    EDUCATION: 'education';
    TOURISM: 'tourism';
    OTHER: 'other';
};

export interface CarbonWeightages {
    energy: number;
    transport: number;
    materials: number;
    waste: number;
    water: number;
}

export interface LocationWeightages {
    'north-india': CarbonWeightages;
    'south-india': CarbonWeightages;
    'east-india': CarbonWeightages;
    'west-india': CarbonWeightages;
    'northeast-india': CarbonWeightages;
    default: CarbonWeightages;
}

export interface SectorModel {
    key: IndustrySectorType;
    label: string;
    processes: string[];
    machinery: string[];
    inputs: string[];
    outputs: string[];
    transactionTypes: Record<string, string[]>;
    locationWeightages: LocationWeightages;
}

export interface IndustryClassificationResult {
    sector: IndustrySectorType;
    sectorLabel: string;
    confidence: number;
    matchType: 'merchant' | 'keyword' | 'process' | null;
    matchedKeywords: string[];
    merchant: string | null;
    process: string | null;
    sectorModel: SectorModel | null;
    carbonWeightages: LocationWeightages | null;
    reasonCodes: string[];
}

export interface IndustryInfo {
    label: string;
    icon: string;
    color: string;
}

export interface IndustryItem extends IndustryInfo {
    key: IndustrySectorType;
}

export function classifyIndustry(text: string, sender?: string | null): IndustryClassificationResult;
export function getIndustryInfo(sector: IndustrySectorType): IndustryInfo;
export function getAllIndustries(): IndustryItem[];

export class IndustryClassifier {
    static classify(text: string, sender?: string | null): IndustryClassificationResult;
    static getInfo(sector: IndustrySectorType): IndustryInfo;
    static getAllIndustries(): IndustryItem[];
    static sectors: typeof IndustrySector;
}

// ============= MSME Rules =============

export const SECTOR_MODELS: Record<IndustrySectorType, SectorModel>;
export function getSectorModel(sectorKey: IndustrySectorType): SectorModel;
export const BASE_TRANSACTION_TYPES: Record<string, string[]>;
export const BASE_LOCATION_WEIGHTAGES: LocationWeightages;
export const SECTOR_LOCATION_SENSITIVITY: Record<IndustrySectorType, CarbonWeightages>;