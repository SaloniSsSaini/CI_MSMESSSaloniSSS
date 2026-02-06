/**
 * IndustryClassifier - Classifies SMS messages into MSME industry sectors
 * Uses keywords from MSMERules to identify which sector a transaction belongs to
 */

const { SECTOR_MODELS, getSectorModel } = require('./MSMERules');

// ============= Industry Sector Definitions =============

export const IndustrySector = {
    MANUFACTURING: 'manufacturing',
    TRADING: 'trading',
    SERVICES: 'services',
    EXPORT_IMPORT: 'export_import',
    RETAIL: 'retail',
    WHOLESALE: 'wholesale',
    E_COMMERCE: 'e_commerce',
    CONSULTING: 'consulting',
    LOGISTICS: 'logistics',
    AGRICULTURE: 'agriculture',
    HANDICRAFTS: 'handicrafts',
    FOOD_PROCESSING: 'food_processing',
    TEXTILES: 'textiles',
    ELECTRONICS: 'electronics',
    AUTOMOTIVE: 'automotive',
    CONSTRUCTION: 'construction',
    HEALTHCARE: 'healthcare',
    EDUCATION: 'education',
    TOURISM: 'tourism',
    OTHER: 'other',
};

// ============= Industry Keywords Database =============

const INDUSTRY_KEYWORDS = {
    manufacturing: {
        merchants: [
            'tata steel', 'jsw', 'jindal', 'sail', 'hindalco', 'vedanta',
            'godrej', 'mahindra', 'larsen', 'l&t', 'bhel', 'siemens',
            'abb', 'schneider', 'havells', 'crompton', 'finolex', 'polycab',
        ],
        keywords: [
            /\b(factory|plant|assembly|fabrication|machining|cnc|lathe|welding)\b/i,
            /\b(raw\s*material|component|spare\s*part|machinery|boiler|compressor)\b/i,
            /\b(production|manufacturing|industrial|workshop|tooling)\b/i,
            /\b(steel|metal|plastic|chemical|polymer|alloy)\b/i,
            /\b(batch|lot|inventory\s*stock|finished\s*goods|byproduct)\b/i,
        ],
        processes: ['assembly', 'fabrication', 'machining', 'coating', 'inspection'],
    },

    trading: {
        merchants: [
            'dmart', 'reliance', 'future group', 'metro cash', 'walmart',
            'best price', 'booker', 'udaan', 'indiamart', 'tradeindia',
        ],
        keywords: [
            /\b(wholesale|distributor|dealer|stockist|reseller|trader)\b/i,
            /\b(bulk\s*order|inventory|stock|godown|warehouse)\b/i,
            /\b(procurement|sourcing|supply\s*chain|distribution)\b/i,
            /\b(margin|markup|trade\s*price|channel\s*partner)\b/i,
        ],
        processes: ['procurement', 'inventory_management', 'distribution'],
    },

    services: {
        merchants: [
            'tcs', 'infosys', 'wipro', 'hcl', 'tech mahindra', 'cognizant',
            'accenture', 'capgemini', 'ltimindtree', 'mphasis', 'persistent',
        ],
        keywords: [
            /\b(software|it\s*services|consulting|advisory|professional\s*services)\b/i,
            /\b(billing|invoice|retainer|project\s*fee|service\s*charge)\b/i,
            /\b(client|customer|engagement|contract|sow|statement\s*of\s*work)\b/i,
            /\b(support|maintenance|amc|annual\s*maintenance)\b/i,
        ],
        processes: ['service_delivery', 'client_support', 'billing'],
    },

    export_import: {
        merchants: [
            'dhl', 'fedex', 'ups', 'maersk', 'msc', 'hapag', 'evergreen',
            'cma cgm', 'cosco', 'oocl', 'mediterranean shipping',
        ],
        keywords: [
            /\b(export|import|customs|duty|shipment|consignment)\b/i,
            /\b(bill\s*of\s*lading|airway\s*bill|iec|dgft)\b/i,
            /\b(fob|cif|cfr|exw|incoterms|letter\s*of\s*credit|lc)\b/i,
            /\b(port|container|freight|clearing|forwarding)\b/i,
            /\b(cha|customs\s*house|shipping\s*line)\b/i,
        ],
        processes: ['customs_clearance', 'international_shipping', 'documentation'],
    },

    retail: {
        merchants: [
            'big bazaar', 'vishal mega', 'reliance retail', 'spencer',
            'more', 'easyday', 'spar', 'star bazaar', 'hyper city',
        ],
        keywords: [
            /\b(retail|store|outlet|shop|counter|pos|point\s*of\s*sale)\b/i,
            /\b(footfall|billing|consumer|shopper|display)\b/i,
            /\b(shelf|rack|merchandising|promotion|discount)\b/i,
        ],
        processes: ['store_operations', 'point_of_sale', 'merchandising'],
    },

    wholesale: {
        merchants: [
            'metro', 'bestprice', 'walmart b2b', 'reliance market',
        ],
        keywords: [
            /\b(wholesale|bulk|carton|pallet|lot|godown)\b/i,
            /\b(channel\s*partner|super\s*stockist|c&f|carrying\s*forwarding)\b/i,
            /\b(margin|trade\s*discount|volume\s*discount)\b/i,
        ],
        processes: ['bulk_ordering', 'warehouse_handling', 'distribution'],
    },

    e_commerce: {
        merchants: [
            'amazon seller', 'flipkart seller', 'meesho', 'shopify',
            'woocommerce', 'magento', 'opencart', 'shiprocket', 'delhivery',
            'ecom express', 'xpressbees', 'shadowfax',
        ],
        keywords: [
            /\b(e-?commerce|online\s*store|marketplace|seller\s*central)\b/i,
            /\b(sku|fulfillment|fba|fbm|cod|prepaid|shipping\s*label)\b/i,
            /\b(return|refund|rto|last\s*mile|pincode)\b/i,
            /\b(listing|catalog|product\s*page|cart)\b/i,
        ],
        processes: ['order_fulfillment', 'last_mile_delivery', 'returns_processing'],
    },

    consulting: {
        merchants: [
            'mckinsey', 'bcg', 'bain', 'deloitte', 'pwc', 'ey', 'kpmg',
            'roland berger', 'oliver wyman', 'at kearney',
        ],
        keywords: [
            /\b(consulting|advisory|strategy|due\s*diligence|assessment)\b/i,
            /\b(engagement|proposal|pitch|deliverable|report)\b/i,
            /\b(workshop|training|facilitation|coaching)\b/i,
        ],
        processes: ['project_delivery', 'research', 'client_management'],
    },

    logistics: {
        merchants: [
            'blue dart', 'gati', 'safexpress', 'tci', 'vrl', 'om logistics',
            'mahindra logistics', 'tvs supply chain', 'allcargo', 'container corporation',
        ],
        keywords: [
            /\b(logistics|transport|freight|trucking|fleet|haulage)\b/i,
            /\b(warehouse|3pl|4pl|supply\s*chain|cold\s*chain)\b/i,
            /\b(consignment|lr|lorry\s*receipt|pod|proof\s*of\s*delivery)\b/i,
            /\b(toll|fastag|fuel|diesel|petrol|cng)\b/i,
        ],
        processes: ['fleet_operations', 'warehouse_management', 'route_planning'],
    },

    agriculture: {
        merchants: [
            'iffco', 'kribhco', 'national fertilizer', 'rashtriya chemicals',
            'upl', 'bayer crop', 'syngenta', 'basf agro', 'fmc',
            'mahindra agri', 'escorts', 'sonalika', 'john deere',
        ],
        keywords: [
            /\b(farm|agriculture|agri|crop|harvest|seed|fertilizer|pesticide)\b/i,
            /\b(tractor|irrigation|sprayer|drip|kisan|mandi)\b/i,
            /\b(urea|dap|npk|organic\s*manure|bio\s*fertilizer)\b/i,
            /\b(apmc|fpo|farmer\s*producer|krishi)\b/i,
        ],
        processes: ['irrigation', 'harvesting', 'soil_preparation', 'crop_protection'],
    },

    handicrafts: {
        merchants: [
            'fabindia', 'khadi', 'cottage emporium', 'cauvery',
            'lepakshi', 'gurjari', 'poompuhar', 'phulkari',
        ],
        keywords: [
            /\b(handicraft|handmade|artisan|craftsman|loom|weaving)\b/i,
            /\b(embroidery|block\s*print|tie\s*dye|batik|kalamkari)\b/i,
            /\b(pottery|ceramic|woodwork|metalwork|lacquer)\b/i,
            /\b(gi\s*tag|geographical\s*indication|heritage)\b/i,
        ],
        processes: ['handcrafting', 'dyeing', 'finishing', 'polishing'],
    },

    food_processing: {
        merchants: [
            'nestle', 'britannia', 'parle', 'itc foods', 'amul', 'mother dairy',
            'haldiram', 'mtr', 'lijjat', 'patanjali', 'dabur',
        ],
        keywords: [
            /\b(food\s*processing|fssai|fda|packaged\s*food|ready\s*to\s*eat)\b/i,
            /\b(cold\s*storage|blast\s*freezer|pasteurizer|homogenizer)\b/i,
            /\b(shelf\s*life|batch\s*code|expiry|mrp|nutritional)\b/i,
            /\b(flour|oil|spice|pickle|beverage|dairy)\b/i,
        ],
        processes: ['processing', 'cold_storage', 'packaging', 'quality_testing'],
    },

    textiles: {
        merchants: [
            'raymond', 'arvind', 'welspun', 'trident', 'vardhman', 'alok',
            'bombay dyeing', 'grasim', 'aditya birla fashion', 'page industries',
        ],
        keywords: [
            /\b(textile|fabric|yarn|cotton|polyester|viscose|linen)\b/i,
            /\b(spinning|weaving|dyeing|printing|finishing|stitching)\b/i,
            /\b(garment|apparel|fashion|readymade|rtw)\b/i,
            /\b(gsm|thread\s*count|denier|tex|warp|weft)\b/i,
        ],
        processes: ['spinning', 'weaving', 'dyeing', 'finishing', 'stitching'],
    },

    electronics: {
        merchants: [
            'samsung', 'lg', 'sony', 'panasonic', 'philips', 'bosch',
            'havells', 'orient', 'crompton', 'bajaj electricals',
            'voltas', 'blue star', 'daikin', 'dixon', 'amber',
        ],
        keywords: [
            /\b(electronics|pcb|circuit|smt|smd|component|semiconductor)\b/i,
            /\b(led|lcd|display|battery|charger|adapter|transformer)\b/i,
            /\b(appliance|consumer\s*durable|white\s*goods|brown\s*goods)\b/i,
            /\b(bis|isi|rohs|weee|e-?waste)\b/i,
        ],
        processes: ['pcb_assembly', 'testing', 'packaging', 'burn_in'],
    },

    automotive: {
        merchants: [
            'maruti', 'hyundai', 'tata motors', 'mahindra auto', 'hero',
            'bajaj auto', 'tvs motor', 'ashok leyland', 'eicher', 'force',
            'bosch auto', 'denso', 'valeo', 'minda', 'motherson',
        ],
        keywords: [
            /\b(automotive|automobile|vehicle|auto\s*parts|oem|tier-?1|tier-?2)\b/i,
            /\b(chassis|engine|transmission|axle|suspension|braking)\b/i,
            /\b(paint\s*shop|body\s*shop|assembly\s*line|pressing|stamping)\b/i,
            /\b(bharat\s*stage|bs6|emission|catalytic|ev|electric\s*vehicle)\b/i,
        ],
        processes: ['stamping', 'assembly', 'painting', 'heat_treatment'],
    },

    construction: {
        merchants: [
            'ultratech', 'acc', 'ambuja', 'shree cement', 'jk cement',
            'jk lakshmi', 'dalmia', 'birla corp', 'india cement',
            'l&t construction', 'shapoorji', 'tata projects', 'kalpataru',
        ],
        keywords: [
            /\b(construction|civil|builder|contractor|infrastructure|real\s*estate)\b/i,
            /\b(cement|concrete|rmc|ready\s*mix|steel|rebar|tmt)\b/i,
            /\b(site|excavation|foundation|formwork|shuttering|scaffolding)\b/i,
            /\b(rera|occupation\s*certificate|completion|possession)\b/i,
        ],
        processes: ['site_preparation', 'construction', 'finishing', 'curing'],
    },

    healthcare: {
        merchants: [
            'apollo', 'fortis', 'max', 'manipal', 'narayana', 'medanta',
            'cipla', 'sun pharma', 'dr reddy', 'lupin', 'biocon', 'glenmark',
        ],
        keywords: [
            /\b(hospital|clinic|diagnostic|pharma|pharmaceutical|medical)\b/i,
            /\b(patient|doctor|consultation|treatment|therapy|surgery)\b/i,
            /\b(medicine|tablet|capsule|injection|iv|saline)\b/i,
            /\b(fda|cdsco|dcgi|gmp|who|usfda)\b/i,
        ],
        processes: ['patient_care', 'diagnostics', 'sterilization', 'pharmacy_operations'],
    },

    education: {
        merchants: [
            'byju', 'unacademy', 'vedantu', 'upgrad', 'great learning',
            'simplilearn', 'coursera', 'udemy', 'edx', 'khan academy',
        ],
        keywords: [
            /\b(education|school|college|university|institute|academy)\b/i,
            /\b(tuition|fee|admission|semester|course|class|lecture)\b/i,
            /\b(student|teacher|faculty|curriculum|syllabus|exam)\b/i,
            /\b(ugc|aicte|ncte|naac|nba|accreditation)\b/i,
        ],
        processes: ['teaching', 'facility_management', 'lab_operations'],
    },

    tourism: {
        merchants: [
            'taj', 'oberoi', 'itc hotels', 'marriott', 'hyatt', 'hilton',
            'oyo', 'treebo', 'fabhotel', 'lemon tree', 'radisson',
            'makemytrip', 'goibibo', 'cleartrip', 'yatra', 'thomas cook',
        ],
        keywords: [
            /\b(hotel|resort|hospitality|tourism|travel|booking)\b/i,
            /\b(room|suite|accommodation|stay|checkin|checkout)\b/i,
            /\b(tour|package|itinerary|sightseeing|excursion)\b/i,
            /\b(guest|visitor|tourist|traveller|holiday)\b/i,
        ],
        processes: ['hospitality', 'travel_services', 'event_management'],
    },
};

// ============= Industry Icons and Colors =============

const INDUSTRY_DISPLAY_INFO = {
    manufacturing: { label: 'Manufacturing', icon: '🏭', color: '#607D8B' },
    trading: { label: 'Trading', icon: '🏪', color: '#795548' },
    services: { label: 'Services', icon: '💼', color: '#9C27B0' },
    export_import: { label: 'Export/Import', icon: '🚢', color: '#00BCD4' },
    retail: { label: 'Retail', icon: '🛒', color: '#E91E63' },
    wholesale: { label: 'Wholesale', icon: '📦', color: '#FF5722' },
    e_commerce: { label: 'E-Commerce', icon: '🛍️', color: '#FF9800' },
    consulting: { label: 'Consulting', icon: '📊', color: '#3F51B5' },
    logistics: { label: 'Logistics', icon: '🚚', color: '#4CAF50' },
    agriculture: { label: 'Agriculture', icon: '🌾', color: '#8BC34A' },
    handicrafts: { label: 'Handicrafts', icon: '🧶', color: '#F44336' },
    food_processing: { label: 'Food Processing', icon: '🍽️', color: '#FFC107' },
    textiles: { label: 'Textiles', icon: '🧵', color: '#673AB7' },
    electronics: { label: 'Electronics', icon: '📱', color: '#2196F3' },
    automotive: { label: 'Automotive', icon: '🚗', color: '#455A64' },
    construction: { label: 'Construction', icon: '🏗️', color: '#FF7043' },
    healthcare: { label: 'Healthcare', icon: '🏥', color: '#E53935' },
    education: { label: 'Education', icon: '📚', color: '#1976D2' },
    tourism: { label: 'Tourism', icon: '✈️', color: '#00ACC1' },
    other: { label: 'Other', icon: '📄', color: '#9E9E9E' },
};

// ============= Industry Classification Functions =============

/**
 * Detect industry from merchant name
 * @param {string} text - SMS message text
 * @returns {Object|null} - { sector, confidence, merchant }
 */
function detectIndustryByMerchant(text) {
    const tLower = (text || '').toLowerCase();

    for (const [sector, data] of Object.entries(INDUSTRY_KEYWORDS)) {
        if (!data.merchants) continue;

        for (const merchant of data.merchants) {
            const regex = new RegExp(`\\b${merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(tLower)) {
                return {
                    sector,
                    confidence: 0.95,
                    merchant,
                    matchType: 'merchant',
                };
            }
        }
    }

    return null;
}

/**
 * Detect industry from keywords in text
 * @param {string} text - SMS message text
 * @returns {Object|null} - { sector, confidence, keywords }
 */
function detectIndustryByKeywords(text) {
    const t = (text || '').trim();
    if (!t) return null;

    const matches = [];

    for (const [sector, data] of Object.entries(INDUSTRY_KEYWORDS)) {
        if (!data.keywords) continue;

        let matchCount = 0;
        const matchedKeywords = [];

        for (const pattern of data.keywords) {
            const match = pattern.exec(t);
            if (match) {
                matchCount++;
                matchedKeywords.push(match[0].toLowerCase());
            }
        }

        if (matchCount > 0) {
            matches.push({
                sector,
                matchCount,
                keywords: matchedKeywords,
                confidence: Math.min(0.4 + (matchCount * 0.15), 0.85),
            });
        }
    }

    if (matches.length === 0) return null;

    // Sort by match count and return best match
    matches.sort((a, b) => b.matchCount - a.matchCount);
    const best = matches[0];

    return {
        sector: best.sector,
        confidence: best.confidence,
        keywords: best.keywords,
        matchType: 'keyword',
    };
}

/**
 * Detect industry from process keywords
 * @param {string} text - SMS message text
 * @returns {Object|null} - { sector, confidence, process }
 */
function detectIndustryByProcess(text) {
    const tLower = (text || '').toLowerCase();

    for (const [sector, data] of Object.entries(INDUSTRY_KEYWORDS)) {
        if (!data.processes) continue;

        for (const process of data.processes) {
            const processKeyword = process.replace(/_/g, '\\s*');
            const regex = new RegExp(`\\b${processKeyword}\\b`, 'i');
            if (regex.test(tLower)) {
                return {
                    sector,
                    confidence: 0.7,
                    process,
                    matchType: 'process',
                };
            }
        }
    }

    return null;
}

/**
 * Main function to classify SMS message by industry sector
 * @param {string} text - SMS message text
 * @param {string|null} sender - Sender ID
 * @returns {Object} - Complete industry classification result
 */
export function classifyIndustry(text, sender = null) {
    const t = (text || '').trim();

    const result = {
        sector: IndustrySector.OTHER,
        sectorLabel: 'Other',
        confidence: 0.3,
        matchType: null,
        matchedKeywords: [],
        merchant: null,
        process: null,
        sectorModel: null,
        carbonWeightages: null,
        reasonCodes: [],
    };

    if (!t) {
        result.reasonCodes.push('empty_message');
        return result;
    }

    // Step 1: Try merchant detection (highest confidence)
    const merchantResult = detectIndustryByMerchant(t);
    if (merchantResult) {
        result.sector = merchantResult.sector;
        result.confidence = merchantResult.confidence;
        result.matchType = 'merchant';
        result.merchant = merchantResult.merchant;
        result.reasonCodes.push('industry_merchant_detected');
    }

    // Step 2: Try keyword detection
    if (!merchantResult) {
        const keywordResult = detectIndustryByKeywords(t);
        if (keywordResult) {
            result.sector = keywordResult.sector;
            result.confidence = keywordResult.confidence;
            result.matchType = 'keyword';
            result.matchedKeywords = keywordResult.keywords;
            result.reasonCodes.push('industry_keyword_matched');
        }
    }

    // Step 3: Try process detection
    if (!merchantResult && result.sector === IndustrySector.OTHER) {
        const processResult = detectIndustryByProcess(t);
        if (processResult) {
            result.sector = processResult.sector;
            result.confidence = processResult.confidence;
            result.matchType = 'process';
            result.process = processResult.process;
            result.reasonCodes.push('industry_process_detected');
        }
    }

    // Get sector display info
    const displayInfo = INDUSTRY_DISPLAY_INFO[result.sector] || INDUSTRY_DISPLAY_INFO.other;
    result.sectorLabel = displayInfo.label;

    // Get full sector model from MSMERules
    try {
        result.sectorModel = getSectorModel(result.sector);
        result.carbonWeightages = result.sectorModel?.locationWeightages || null;
    } catch (e) {
        // MSMERules may not be loaded
        result.sectorModel = null;
    }

    return result;
}

/**
 * Get display information for industry sector
 * @param {string} sector - Industry sector key
 * @returns {Object} - { label, icon, color }
 */
export function getIndustryInfo(sector) {
    return INDUSTRY_DISPLAY_INFO[sector] || INDUSTRY_DISPLAY_INFO.other;
}

/**
 * Get all industry sectors
 * @returns {Array} - Array of { key, label, icon, color }
 */
export function getAllIndustries() {
    return Object.entries(INDUSTRY_DISPLAY_INFO).map(([key, info]) => ({
        key,
        ...info,
    }));
}

// ============= IndustryClassifier Class for convenience =============

export const IndustryClassifier = {
    classify: classifyIndustry,
    getInfo: getIndustryInfo,
    getAllIndustries,
    sectors: IndustrySector,
};

export default IndustryClassifier;
