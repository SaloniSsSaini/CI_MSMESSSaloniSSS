/**
 * ExpenseClassifier - Classifies SMS messages into expense categories
 * Lightweight, keyword-based classification for client-side processing
 */

// ============= Expense Category Definitions =============

export const ExpenseCategory = {
    ENERGY: 'energy',
    FOOD: 'food',
    TRANSPORT: 'transport',
    SHOPPING: 'shopping',
    BILLS: 'bills',
    FINANCE: 'finance',
    HEALTHCARE: 'healthcare',
    ENTERTAINMENT: 'entertainment',
    EDUCATION: 'education',
    TRANSFER: 'transfer',
    OTHER: 'other',
};

export const ExpenseSubcategory = {
    // Energy
    ELECTRICITY: 'electricity',
    GAS: 'gas',
    WATER: 'water',

    // Food
    DELIVERY: 'delivery',
    GROCERY: 'grocery',
    RESTAURANT: 'restaurant',

    // Transport
    CAB: 'cab',
    FUEL: 'fuel',
    PUBLIC: 'public',
    PARKING: 'parking',
    TOLL: 'toll',
    FLIGHT: 'flight',
    TRAIN: 'train',

    // Shopping
    ONLINE: 'online',
    RETAIL: 'retail',
    CLOTHING: 'clothing',
    ELECTRONICS: 'electronics',

    // Bills
    MOBILE: 'mobile',
    DTH: 'dth',
    BROADBAND: 'broadband',
    POSTPAID: 'postpaid',

    // Finance
    EMI: 'emi',
    INSURANCE: 'insurance',
    INVESTMENT: 'investment',
    LOAN: 'loan',
    CREDIT_CARD: 'credit_card',

    // Healthcare
    PHARMACY: 'pharmacy',
    HOSPITAL: 'hospital',
    DIAGNOSTIC: 'diagnostic',
    CONSULTATION: 'consultation',

    // Entertainment
    OTT: 'ott',
    MOVIES: 'movies',
    GAMING: 'gaming',
    EVENTS: 'events',

    // Education
    FEES: 'fees',
    COURSES: 'courses',
    BOOKS: 'books',

    // Transfer
    P2P: 'p2p',
    SELF: 'self',
    SALARY: 'salary',

    // Other
    GENERAL: 'general',
};

// ============= Merchant Database =============

const MERCHANT_MAPPINGS = {
    // Food & Dining - Delivery
    food_delivery: [
        'swiggy', 'zomato', 'dominos', 'domino', 'mcdonalds', 'mcd', 'kfc',
        'subway', 'burger king', 'wendys', 'pizza hut', 'papa johns',
        'box8', 'faasos', 'behrouz', 'oven story', 'licious', 'freshmenu',
        'rebel foods', 'eatsure', 'dunzo food',
    ],

    // Food & Dining - Grocery
    food_grocery: [
        'bigbasket', 'blinkit', 'zepto', 'instamart', 'grofers', 'dunzo',
        'jiomart', 'amazon fresh', 'flipkart grocery', 'dmart', 'reliance fresh',
        'more', 'spencers', 'nature basket', 'godrej nature', 'milkbasket',
        'country delight', 'supr daily', 'bb daily', 'bbdaily',
    ],

    // Food & Dining - Restaurants/Cafes
    food_restaurant: [
        'starbucks', 'ccd', 'cafe coffee day', 'barista', 'costa coffee',
        'chaayos', 'chai point', 'haldirams', 'bikanervala', 'sagar ratna',
        'mainland china', 'barbeque nation', 'bbq', 'punjabi', 'dhaba',
    ],

    // Transport - Cab/Ride
    transport_cab: [
        'uber', 'ola', 'rapido', 'meru', 'mega cabs', 'blu smart', 'blusmart',
        'namma yatri', 'auto ride', 'auto rickshaw', 'rickshaw', 'indriver', 'jugnoo',
    ],

    // Transport - Fuel
    transport_fuel: [
        'iocl', 'indian oil', 'hpcl', 'hindustan petroleum', 'bpcl',
        'bharat petroleum', 'shell', 'reliance petroleum', 'nayara',
        'essar', 'petrol pump', 'fuel station', 'cng station',
    ],

    // Transport - Public/Travel
    transport_public: [
        'metro', 'dmrc', 'bmrc', 'cmrl', 'nmmc', 'mmrda', 'best bus',
        'dtc', 'ksrtc', 'apsrtc', 'tsrtc', 'msrtc', 'gsrtc', 'upsrtc',
        'irctc', 'indian railways', 'redbus', 'abhibus', 'goibibo',
        'makemytrip', 'mmt', 'cleartrip', 'ixigo', 'trainman',
    ],

    // Transport - Toll/Parking
    transport_toll: [
        'fastag', 'paytm fastag', 'netc', 'toll', 'parking', 'park+',
        'parkwhiz', 'get my parking',
    ],

    // Transport - Flight
    transport_flight: [
        'indigo', '6e', 'spicejet', 'air india', 'vistara', 'akasa',
        'goair', 'go first', 'airasia', 'emirates', 'etihad', 'qatar',
        'lufthansa', 'singapore airlines', 'thai airways',
    ],

    // Energy - Electricity
    energy_electricity: [
        'bescom', 'tpddl', 'bses', 'adani electricity', 'aeml', 'tata power',
        'reliance energy', 'msedcl', 'mgvcl', 'ugvcl', 'dgvcl', 'pgvcl',
        'tneb', 'tangedco', 'apspdcl', 'tsspdcl', 'wbsedcl', 'cesc',
        'torrent power', 'electricity bill', 'power bill', 'eb bill',
    ],

    // Energy - Gas
    energy_gas: [
        'mahanagar gas', 'mgl', 'indraprastha gas', 'igl', 'gail gas',
        'adani gas', 'gujarat gas', 'sabarmati gas', 'torrent gas',
        'hp gas', 'indane', 'bharat gas', 'lpg', 'piped gas', 'png',
    ],

    // Energy - Water
    energy_water: [
        'jal board', 'water board', 'bwssb', 'mcgm water', 'dda water',
        'water bill', 'water supply', 'jalkal',
    ],

    // Shopping - Online
    shopping_online: [
        'amazon', 'flipkart', 'snapdeal', 'paytm mall', 'tatacliq',
        'tata cliq', 'jiomart', 'shopclues', 'firstcry', 'purplle',
    ],

    // Shopping - Fashion
    shopping_fashion: [
        'myntra', 'ajio', 'meesho', 'nykaa', 'nykaa fashion', 'bewakoof',
        'limeroad', 'koovs', 'jabong', 'zara', 'h&m', 'uniqlo',
        'westside', 'pantaloons', 'lifestyle', 'shoppers stop',
        'central', 'max fashion', 'fbb', 'reliance trends',
    ],

    // Shopping - Electronics
    shopping_electronics: [
        'reliance digital', 'croma', 'vijay sales', 'poorvika',
        'sangeetha', 'big c', 'lot mobiles', 'apple store', 'samsung',
        'mi store', 'oneplus', 'realme',
    ],

    // Bills - Mobile/Telecom
    bills_mobile: [
        'jio', 'airtel', 'vi', 'vodafone', 'idea', 'bsnl', 'mtnl',
        'recharge', 'prepaid', 'postpaid', 'mobile bill',
    ],

    // Bills - DTH
    bills_dth: [
        'tata sky', 'tatasky', 'tata sky recharge', 'dish tv', 'dishtv', 'd2h', 'videocon d2h',
        'airtel digital tv', 'airtel dth', 'sun direct', 'dth recharge', 'dth',
    ],

    // Bills - Broadband/Internet
    bills_broadband: [
        'act fibernet', 'actcorp', 'hathway', 'tikona', 'you broadband',
        'spectra', 'excitel', 'airtel xstream', 'jio fiber', 'jiofiber',
        'tata sky broadband', 'wifi', 'broadband', 'internet bill',
    ],

    // Healthcare - Pharmacy
    healthcare_pharmacy: [
        'apollo pharmacy', '1mg', 'pharmeasy', 'netmeds', 'medplus',
        'medlife', 'wellness forever', 'frank ross', 'guardian pharmacy',
        'medicine', 'pharmacy', 'chemist', 'drugstore',
    ],

    // Healthcare - Hospital/Clinic
    healthcare_hospital: [
        'apollo hospital', 'fortis', 'max healthcare', 'medanta',
        'manipal hospital', 'narayana health', 'aster', 'columbia asia',
        'sahyadri', 'ruby hall', 'kokilaben', 'lilavati', 'breach candy',
        'hospital', 'clinic', 'nursing home', 'medical center',
    ],

    // Healthcare - Diagnostic
    healthcare_diagnostic: [
        'dr lal', 'lal path', 'thyrocare', 'metropolis', 'srl diagnostics',
        'healthians', 'redcliffe', 'orange health', 'diagnostic', 'pathlab',
        'blood test', 'lab test', 'health checkup',
    ],

    // Healthcare - Consultation
    healthcare_consultation: [
        'practo', 'docprime', 'lybrate', 'mfine', 'docsapp', 'tata 1mg',
        'consultation', 'doctor', 'appointment',
    ],

    // Entertainment - OTT
    entertainment_ott: [
        'netflix', 'amazon prime', 'prime video', 'hotstar', 'disney+',
        'disney plus', 'zee5', 'sonyliv', 'voot', 'jiocinema', 'mxplayer',
        'aha', 'hoichoi', 'alt balaji', 'eros now', 'hungama',
        'spotify', 'gaana', 'jiosaavn', 'wynk', 'apple music', 'youtube premium',
    ],

    // Entertainment - Movies
    entertainment_movies: [
        'pvr', 'inox', 'cinepolis', 'bookmyshow', 'paytm movies',
        'carnival cinemas', 'miraj cinemas', 'movie ticket', 'multiplex',
    ],

    // Entertainment - Events/Gaming
    entertainment_events: [
        'paytm insider', 'insider.in', 'townscript', 'explara', 'eventbrite',
        'dream11', 'mpl', 'winzo', 'gaming', 'playstation', 'xbox', 'steam',
    ],

    // Finance - EMI/Loan
    finance_emi: [
        'emi', 'loan emi', 'home loan', 'car loan', 'personal loan',
        'education loan', 'bajaj finserv', 'hdfc ltd', 'lichfl', 'pnb housing',
        'iifl', 'fullerton', 'tata capital', 'aditya birla finance',
    ],

    // Finance - Insurance
    finance_insurance: [
        'lic', 'life insurance', 'hdfc life', 'icici prudential', 'icici pru',
        'sbi life', 'max life', 'bajaj allianz', 'tata aia', 'kotak life',
        'birla sun life', 'health insurance', 'car insurance', 'motor insurance',
        'term insurance', 'premium', 'policy premium',
    ],

    // Finance - Investment
    finance_investment: [
        'zerodha', 'groww', 'upstox', 'angel one', 'angel broking', '5paisa',
        'paytm money', 'kuvera', 'coin', 'smallcase', 'et money', 'scripbox',
        'mutual fund', 'mf', 'sip', 'equity', 'shares', 'stocks', 'nps',
        'ppf', 'epf', 'investment',
    ],

    // Finance - Credit Card
    finance_credit_card: [
        'credit card', 'cc bill', 'card payment', 'card outstanding',
        'minimum due', 'total due', 'statement', 'card bill',
    ],

    // Education - Fees
    education_fees: [
        'school fee', 'college fee', 'university fee', 'tuition fee',
        'admission fee', 'exam fee', 'registration fee', 'semester fee',
    ],

    // Education - Courses
    education_courses: [
        'udemy', 'coursera', 'edx', 'skillshare', 'linkedin learning',
        'unacademy', 'byjus', 'vedantu', 'toppr', 'physicswallah',
        'upgrad', 'simplilearn', 'great learning', 'scaler', 'coding ninjas',
    ],

    // Education - Books
    education_books: [
        'amazon books', 'flipkart books', 'kindle', 'audible', 'scribd',
        'crossword', 'om book shop', 'sapna book', 'pustakwala',
    ],
};

// ============= Keyword Patterns =============

const KEYWORD_PATTERNS = {
    // Energy keywords
    energy: {
        electricity: /\b(electricity|electric|power|eb\s*bill|unit|kwh|meter\s*reading)\b/i,
        gas: /\b(gas\s*bill|lpg|png|piped\s*gas|cylinder|cooking\s*gas)\b/i,
        water: /\b(water\s*bill|water\s*supply|water\s*charge)\b/i,
    },

    // Food keywords
    food: {
        delivery: /\b(food\s*order|meal|delivery|delivered|restaurant\s*order)\b/i,
        grocery: /\b(grocery|groceries|vegetables|fruits|daily\s*needs|milk|eggs)\b/i,
        restaurant: /\b(dine|dining|restaurant|cafe|coffee|tea|snacks)\b/i,
    },

    // Transport keywords
    transport: {
        cab: /\b(ride|trip|cab|taxi|auto|booking|pick\s*up|drop)\b/i,
        fuel: /\b(petrol|diesel|fuel|cng|filled|refuel|liters?|litres?)\b/i,
        public: /\b(metro|train|bus|ticket|travel|journey|railway)\b/i,
        toll: /\b(toll|fastag|parking|park)\b/i,
        flight: /\b(flight|airline|boarding|airport|departure|arrival)\b/i,
    },

    // Shopping keywords
    shopping: {
        online: /\b(order|ordered|purchase|bought|shopping|cart|checkout)\b/i,
        fashion: /\b(clothing|clothes|fashion|apparel|footwear|shoes|accessories)\b/i,
        electronics: /\b(mobile|phone|laptop|tv|television|appliance|gadget)\b/i,
    },

    // Bills keywords
    bills: {
        mobile: /\b(recharge|prepaid|postpaid|mobile\s*bill|talk\s*time|data\s*pack)\b/i,
        dth: /\b(dth|dish|set\s*top\s*box|tv\s*recharge)\b/i,
        broadband: /\b(broadband|internet|wifi|fiber|fibernet)\b/i,
    },

    // Finance keywords
    finance: {
        emi: /\b(emi|equated\s*monthly|installment|loan\s*payment|auto\s*debit)\b/i,
        insurance: /\b(insurance|premium|policy|cover|claim)\b/i,
        investment: /\b(investment|sip|mutual\s*fund|mf|dividend|nav|units?\s*allot)\b/i,
        credit_card: /\b(credit\s*card|cc\s*bill|card\s*payment|outstanding|minimum\s*due)\b/i,
    },

    // Healthcare keywords
    healthcare: {
        pharmacy: /\b(medicine|medication|pharmacy|prescription|tablet|capsule)\b/i,
        hospital: /\b(hospital|clinic|admission|discharge|treatment|surgery|opd|ipd)\b/i,
        diagnostic: /\b(test|diagnostic|pathology|lab|blood|report|checkup)\b/i,
        consultation: /\b(doctor|consultation|appointment|specialist|physician)\b/i,
    },

    // Entertainment keywords
    entertainment: {
        ott: /\b(subscription|streaming|watch|series|movie|music|premium)\b/i,
        movies: /\b(movie|cinema|film|theatre|theater|ticket|show|seat)\b/i,
        events: /\b(event|concert|show|match|game|gaming|play)\b/i,
    },

    // Education keywords
    education: {
        fees: /\b(fee|fees|tuition|admission|semester|exam)\b/i,
        courses: /\b(course|class|learning|certification|training|workshop)\b/i,
        books: /\b(book|books|ebook|kindle|reading|textbook)\b/i,
    },

    // Transfer keywords
    transfer: {
        p2p: /\b(sent\s*to|received\s*from|transfer|transferred|from\s*[a-z]+@|to\s*[a-z]+@)\b/i,
        self: /\b(self\s*transfer|own\s*account|savings|fd|fixed\s*deposit)\b/i,
        salary: /\b(salary|wages|pay|payroll|credited.*salary)\b/i,
    },
};

// ============= UPI Patterns =============

const UPI_PATTERNS = {
    // UPI Reference pattern
    upiRef: /\b(?:upi\s*(?:ref|id|txn)?[:.\s]*|ref(?:erence)?[:.\s]*|txn[:.\s]*)(\d{12,})\b/i,

    // UPI ID pattern (merchant@bank)
    upiId: /\b([a-zA-Z0-9._-]+@[a-zA-Z]+)\b/i,

    // Debit patterns
    debit: /\b(debited|debit|paid|spent|payment\s*of|sent|transferred)\b/i,

    // Credit patterns
    credit: /\b(credited|credit|received|got|deposited)\b/i,

    // Account patterns
    account: /\b(?:a\/c|acct?|account)\s*(?:no\.?|number)?\s*[x*]*(\d{4,})\b/i,

    // Bank patterns
    bank: /\b(hdfc|icici|sbi|axis|kotak|pnb|bob|canara|union|idbi|yes\s*bank|indusind|federal|rbl|au\s*small|equitas|idfc|bandhan)\b/i,

    // Payment app patterns
    paymentApp: /\b(gpay|google\s*pay|phonepe|paytm|bhim|amazon\s*pay|whatsapp\s*pay|cred|fampay)\b/i,
};

// ============= Amount Extraction =============

const AMOUNT_PATTERNS = [
    /(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|₹|inr)/i,
    /(?:amount|amt)[:.\s]*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:debited|credited|paid|received).*?([\d,]+(?:\.\d{1,2})?)/i,
];

/**
 * Extract amount from message text
 * @param {string} text - SMS message text
 * @returns {Object|null} - { value, currency }
 */
export function extractExpenseAmount(text) {
    const t = (text || '').trim();
    if (!t) return null;

    for (const pattern of AMOUNT_PATTERNS) {
        const match = pattern.exec(t);
        if (match) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(value) && value > 0) {
                return { value, currency: 'INR' };
            }
        }
    }
    return null;
}

// ============= UPI Parser =============

/**
 * Parse UPI transaction details from SMS
 * @param {string} text - SMS message text
 * @returns {Object} - UPI transaction details
 */
export function parseUPITransaction(text) {
    const t = (text || '').trim();
    const result = {
        isUPI: false,
        transactionType: null, // 'debit' | 'credit'
        upiRef: null,
        upiId: null,
        merchantName: null,
        paymentApp: null,
        accountNumber: null,
        bank: null,
    };

    if (!t) return result;

    // Check for UPI reference
    const refMatch = UPI_PATTERNS.upiRef.exec(t);
    if (refMatch) {
        result.isUPI = true;
        result.upiRef = refMatch[1];
    }

    // Check for UPI ID
    const upiIdMatch = UPI_PATTERNS.upiId.exec(t);
    if (upiIdMatch) {
        result.isUPI = true;
        result.upiId = upiIdMatch[1].toLowerCase();
        // Extract merchant name from UPI ID
        const merchantPart = upiIdMatch[1].split('@')[0];
        result.merchantName = merchantPart.replace(/[._-]/g, ' ').trim();
    }

    // Determine transaction type
    if (UPI_PATTERNS.debit.test(t)) {
        result.transactionType = 'debit';
    } else if (UPI_PATTERNS.credit.test(t)) {
        result.transactionType = 'credit';
    }

    // Extract account number
    const accountMatch = UPI_PATTERNS.account.exec(t);
    if (accountMatch) {
        result.accountNumber = accountMatch[1];
    }

    // Detect bank
    const bankMatch = UPI_PATTERNS.bank.exec(t);
    if (bankMatch) {
        result.bank = bankMatch[1].toLowerCase();
    }

    // Detect payment app
    const appMatch = UPI_PATTERNS.paymentApp.exec(t);
    if (appMatch) {
        result.isUPI = true;
        result.paymentApp = appMatch[1].toLowerCase();
    }

    // Also mark as UPI if contains common UPI keywords
    if (/\b(upi|bhim|vpa)\b/i.test(t)) {
        result.isUPI = true;
    }

    return result;
}

// ============= Merchant Detection =============

/**
 * Detect merchant from text and return category info
 * @param {string} text - SMS message text
 * @returns {Object|null} - { category, subcategory, merchant, confidence }
 */
function detectMerchant(text) {
    const tLower = (text || '').toLowerCase();

    // Category mapping for merchant groups
    const categoryMap = {
        food_delivery: { category: ExpenseCategory.FOOD, subcategory: ExpenseSubcategory.DELIVERY },
        food_grocery: { category: ExpenseCategory.FOOD, subcategory: ExpenseSubcategory.GROCERY },
        food_restaurant: { category: ExpenseCategory.FOOD, subcategory: ExpenseSubcategory.RESTAURANT },
        transport_cab: { category: ExpenseCategory.TRANSPORT, subcategory: ExpenseSubcategory.CAB },
        transport_fuel: { category: ExpenseCategory.TRANSPORT, subcategory: ExpenseSubcategory.FUEL },
        transport_public: { category: ExpenseCategory.TRANSPORT, subcategory: ExpenseSubcategory.PUBLIC },
        transport_toll: { category: ExpenseCategory.TRANSPORT, subcategory: ExpenseSubcategory.TOLL },
        transport_flight: { category: ExpenseCategory.TRANSPORT, subcategory: ExpenseSubcategory.FLIGHT },
        energy_electricity: { category: ExpenseCategory.ENERGY, subcategory: ExpenseSubcategory.ELECTRICITY },
        energy_gas: { category: ExpenseCategory.ENERGY, subcategory: ExpenseSubcategory.GAS },
        energy_water: { category: ExpenseCategory.ENERGY, subcategory: ExpenseSubcategory.WATER },
        shopping_online: { category: ExpenseCategory.SHOPPING, subcategory: ExpenseSubcategory.ONLINE },
        shopping_fashion: { category: ExpenseCategory.SHOPPING, subcategory: ExpenseSubcategory.CLOTHING },
        shopping_electronics: { category: ExpenseCategory.SHOPPING, subcategory: ExpenseSubcategory.ELECTRONICS },
        bills_mobile: { category: ExpenseCategory.BILLS, subcategory: ExpenseSubcategory.MOBILE },
        bills_dth: { category: ExpenseCategory.BILLS, subcategory: ExpenseSubcategory.DTH },
        bills_broadband: { category: ExpenseCategory.BILLS, subcategory: ExpenseSubcategory.BROADBAND },
        healthcare_pharmacy: { category: ExpenseCategory.HEALTHCARE, subcategory: ExpenseSubcategory.PHARMACY },
        healthcare_hospital: { category: ExpenseCategory.HEALTHCARE, subcategory: ExpenseSubcategory.HOSPITAL },
        healthcare_diagnostic: { category: ExpenseCategory.HEALTHCARE, subcategory: ExpenseSubcategory.DIAGNOSTIC },
        healthcare_consultation: { category: ExpenseCategory.HEALTHCARE, subcategory: ExpenseSubcategory.CONSULTATION },
        entertainment_ott: { category: ExpenseCategory.ENTERTAINMENT, subcategory: ExpenseSubcategory.OTT },
        entertainment_movies: { category: ExpenseCategory.ENTERTAINMENT, subcategory: ExpenseSubcategory.MOVIES },
        entertainment_events: { category: ExpenseCategory.ENTERTAINMENT, subcategory: ExpenseSubcategory.EVENTS },
        finance_emi: { category: ExpenseCategory.FINANCE, subcategory: ExpenseSubcategory.EMI },
        finance_insurance: { category: ExpenseCategory.FINANCE, subcategory: ExpenseSubcategory.INSURANCE },
        finance_investment: { category: ExpenseCategory.FINANCE, subcategory: ExpenseSubcategory.INVESTMENT },
        finance_credit_card: { category: ExpenseCategory.FINANCE, subcategory: ExpenseSubcategory.CREDIT_CARD },
        education_fees: { category: ExpenseCategory.EDUCATION, subcategory: ExpenseSubcategory.FEES },
        education_courses: { category: ExpenseCategory.EDUCATION, subcategory: ExpenseSubcategory.COURSES },
        education_books: { category: ExpenseCategory.EDUCATION, subcategory: ExpenseSubcategory.BOOKS },
    };

    // Priority order for merchant detection (more specific first)
    const priorityOrder = [
        // Specific food categories first
        'food_grocery', 'food_delivery', 'food_restaurant',
        // Energy
        'energy_electricity', 'energy_gas', 'energy_water',
        // Transport
        'transport_cab', 'transport_fuel', 'transport_flight', 'transport_toll', 'transport_public',
        // Healthcare
        'healthcare_pharmacy', 'healthcare_hospital', 'healthcare_diagnostic', 'healthcare_consultation',
        // Entertainment (before finance to avoid premium triggering insurance)
        'entertainment_movies', 'entertainment_ott', 'entertainment_events',
        // Finance
        'finance_emi', 'finance_insurance', 'finance_investment', 'finance_credit_card',
        // Bills (DTH before mobile to catch "tata sky recharge" correctly)
        'bills_dth', 'bills_broadband', 'bills_mobile',
        // Education
        'education_courses', 'education_fees', 'education_books',
        // Shopping (last as it's most generic)
        'shopping_electronics', 'shopping_fashion', 'shopping_online',
    ];

    for (const groupKey of priorityOrder) {
        const merchants = MERCHANT_MAPPINGS[groupKey];
        if (!merchants) continue;

        for (const merchant of merchants) {
            // Create regex for whole word match
            const regex = new RegExp(`\\b${merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (regex.test(tLower)) {
                const categoryInfo = categoryMap[groupKey];
                return {
                    ...categoryInfo,
                    merchant,
                    confidence: 0.9,
                };
            }
        }
    }

    return null;
}

// ============= Keyword Classification =============

/**
 * Classify based on keyword patterns
 * @param {string} text - SMS message text
 * @returns {Object|null} - { category, subcategory, confidence, keywords }
 */
function classifyByKeywords(text) {
    const t = (text || '').trim();
    if (!t) return null;

    const matches = [];

    // Check each category's keyword patterns
    for (const [category, subcategories] of Object.entries(KEYWORD_PATTERNS)) {
        for (const [subcategory, pattern] of Object.entries(subcategories)) {
            const match = pattern.exec(t);
            if (match) {
                matches.push({
                    category,
                    subcategory,
                    keyword: match[0],
                    confidence: 0.7,
                });
            }
        }
    }

    if (matches.length === 0) return null;

    // Return the first (highest priority) match
    // Could be enhanced with scoring system for multiple matches
    const bestMatch = matches[0];
    return {
        category: bestMatch.category,
        subcategory: bestMatch.subcategory,
        confidence: bestMatch.confidence,
        keywords: matches.map(m => m.keyword),
    };
}

// ============= Main Classification Function =============

/**
 * Classify expense from SMS message
 * @param {string} text - SMS message text
 * @param {string|null} sender - Sender ID/number
 * @returns {Object} - Complete expense classification result
 */
export function classifyExpense(text, sender = null) {
    const t = (text || '').trim();

    // Default result
    const result = {
        category: ExpenseCategory.OTHER,
        subcategory: ExpenseSubcategory.GENERAL,
        confidence: 0.3,
        transactionType: null,
        amount: null,
        upiDetails: null,
        merchant: null,
        reasonCodes: [],
        // Industry classification (for B2B/MSME transactions)
        industry: null,
        industryLabel: null,
        industryConfidence: 0,
        carbonWeightages: null,
    };

    if (!t) {
        result.reasonCodes.push('empty_message');
        return result;
    }

    // Extract amount
    result.amount = extractExpenseAmount(t);
    if (result.amount) {
        result.reasonCodes.push('amount_extracted');
    }

    // Parse UPI details
    result.upiDetails = parseUPITransaction(t);
    if (result.upiDetails.isUPI) {
        result.reasonCodes.push('upi_transaction');
        result.transactionType = result.upiDetails.transactionType;
    }

    // Step 1: Try merchant detection (highest confidence)
    const merchantResult = detectMerchant(t);
    if (merchantResult) {
        result.category = merchantResult.category;
        result.subcategory = merchantResult.subcategory;
        result.confidence = merchantResult.confidence;
        result.merchant = merchantResult.merchant;
        result.reasonCodes.push('merchant_detected');
        return result;
    }

    // Step 2: Try UPI ID merchant name matching
    if (result.upiDetails.merchantName) {
        const upiMerchantResult = detectMerchant(result.upiDetails.merchantName);
        if (upiMerchantResult) {
            result.category = upiMerchantResult.category;
            result.subcategory = upiMerchantResult.subcategory;
            result.confidence = upiMerchantResult.confidence * 0.95; // Slightly lower confidence
            result.merchant = upiMerchantResult.merchant;
            result.reasonCodes.push('upi_merchant_detected');
            return result;
        }
    }

    // Step 3: Try keyword classification
    const keywordResult = classifyByKeywords(t);
    if (keywordResult) {
        result.category = keywordResult.category;
        result.subcategory = keywordResult.subcategory;
        result.confidence = keywordResult.confidence;
        result.reasonCodes.push('keyword_matched');
        result.reasonCodes.push(...keywordResult.keywords.slice(0, 3));
        return result;
    }

    // Step 4: Check for P2P transfer (UPI with no merchant)
    if (result.upiDetails.isUPI && result.upiDetails.upiId) {
        result.category = ExpenseCategory.TRANSFER;
        result.subcategory = ExpenseSubcategory.P2P;
        result.confidence = 0.6;
        result.reasonCodes.push('upi_p2p_transfer');
        return result;
    }

    // Step 5: Salary/credit detection
    if (result.upiDetails.transactionType === 'credit') {
        if (/\b(salary|wages|pay|payroll)\b/i.test(t)) {
            result.category = ExpenseCategory.TRANSFER;
            result.subcategory = ExpenseSubcategory.SALARY;
            result.confidence = 0.8;
            result.reasonCodes.push('salary_credit');
        } else {
            result.category = ExpenseCategory.TRANSFER;
            result.subcategory = ExpenseSubcategory.P2P;
            result.confidence = 0.5;
            result.reasonCodes.push('credit_received');
        }
        return result;
    }

    // Fallback: unclassified
    result.reasonCodes.push('unclassified');
    return result;
}

// ============= Category Display Info =============

/**
 * Get display information for expense category
 * @param {string} category - Expense category
 * @param {string} subcategory - Expense subcategory
 * @returns {Object} - { label, icon, color }
 */
export function getExpenseCategoryInfo(category, subcategory = null) {
    const categoryInfo = {
        [ExpenseCategory.ENERGY]: {
            label: 'Energy',
            icon: '⚡',
            color: '#4ECDC4',
            subcategories: {
                [ExpenseSubcategory.ELECTRICITY]: { label: 'Electricity', icon: '💡' },
                [ExpenseSubcategory.GAS]: { label: 'Gas', icon: '🔥' },
                [ExpenseSubcategory.WATER]: { label: 'Water', icon: '💧' },
            },
        },
        [ExpenseCategory.FOOD]: {
            label: 'Food',
            icon: '🍽️',
            color: '#FF6B6B',
            subcategories: {
                [ExpenseSubcategory.DELIVERY]: { label: 'Delivery', icon: '🛵' },
                [ExpenseSubcategory.GROCERY]: { label: 'Grocery', icon: '🛒' },
                [ExpenseSubcategory.RESTAURANT]: { label: 'Restaurant', icon: '🍴' },
            },
        },
        [ExpenseCategory.TRANSPORT]: {
            label: 'Transport',
            icon: '🚗',
            color: '#45B7D1',
            subcategories: {
                [ExpenseSubcategory.CAB]: { label: 'Cab', icon: '🚕' },
                [ExpenseSubcategory.FUEL]: { label: 'Fuel', icon: '⛽' },
                [ExpenseSubcategory.PUBLIC]: { label: 'Public', icon: '🚌' },
                [ExpenseSubcategory.PARKING]: { label: 'Parking', icon: '🅿️' },
                [ExpenseSubcategory.TOLL]: { label: 'Toll', icon: '🛣️' },
                [ExpenseSubcategory.FLIGHT]: { label: 'Flight', icon: '✈️' },
                [ExpenseSubcategory.TRAIN]: { label: 'Train', icon: '🚆' },
            },
        },
        [ExpenseCategory.SHOPPING]: {
            label: 'Shopping',
            icon: '🛍️',
            color: '#9B59B6',
            subcategories: {
                [ExpenseSubcategory.ONLINE]: { label: 'Online', icon: '🌐' },
                [ExpenseSubcategory.RETAIL]: { label: 'Retail', icon: '🏪' },
                [ExpenseSubcategory.CLOTHING]: { label: 'Clothing', icon: '👕' },
                [ExpenseSubcategory.ELECTRONICS]: { label: 'Electronics', icon: '📱' },
            },
        },
        [ExpenseCategory.BILLS]: {
            label: 'Bills',
            icon: '📱',
            color: '#3498DB',
            subcategories: {
                [ExpenseSubcategory.MOBILE]: { label: 'Mobile', icon: '📞' },
                [ExpenseSubcategory.DTH]: { label: 'DTH', icon: '📺' },
                [ExpenseSubcategory.BROADBAND]: { label: 'Internet', icon: '📶' },
                [ExpenseSubcategory.POSTPAID]: { label: 'Postpaid', icon: '💳' },
            },
        },
        [ExpenseCategory.FINANCE]: {
            label: 'Finance',
            icon: '💰',
            color: '#27AE60',
            subcategories: {
                [ExpenseSubcategory.EMI]: { label: 'EMI', icon: '📅' },
                [ExpenseSubcategory.INSURANCE]: { label: 'Insurance', icon: '🛡️' },
                [ExpenseSubcategory.INVESTMENT]: { label: 'Investment', icon: '📈' },
                [ExpenseSubcategory.LOAN]: { label: 'Loan', icon: '🏦' },
                [ExpenseSubcategory.CREDIT_CARD]: { label: 'Credit Card', icon: '💳' },
            },
        },
        [ExpenseCategory.HEALTHCARE]: {
            label: 'Healthcare',
            icon: '🏥',
            color: '#E74C3C',
            subcategories: {
                [ExpenseSubcategory.PHARMACY]: { label: 'Pharmacy', icon: '💊' },
                [ExpenseSubcategory.HOSPITAL]: { label: 'Hospital', icon: '🏥' },
                [ExpenseSubcategory.DIAGNOSTIC]: { label: 'Diagnostic', icon: '🔬' },
                [ExpenseSubcategory.CONSULTATION]: { label: 'Doctor', icon: '👨‍⚕️' },
            },
        },
        [ExpenseCategory.ENTERTAINMENT]: {
            label: 'Entertainment',
            icon: '🎬',
            color: '#E91E63',
            subcategories: {
                [ExpenseSubcategory.OTT]: { label: 'OTT', icon: '📺' },
                [ExpenseSubcategory.MOVIES]: { label: 'Movies', icon: '🎬' },
                [ExpenseSubcategory.GAMING]: { label: 'Gaming', icon: '🎮' },
                [ExpenseSubcategory.EVENTS]: { label: 'Events', icon: '🎫' },
            },
        },
        [ExpenseCategory.EDUCATION]: {
            label: 'Education',
            icon: '📚',
            color: '#FF9800',
            subcategories: {
                [ExpenseSubcategory.FEES]: { label: 'Fees', icon: '🎓' },
                [ExpenseSubcategory.COURSES]: { label: 'Courses', icon: '📖' },
                [ExpenseSubcategory.BOOKS]: { label: 'Books', icon: '📕' },
            },
        },
        [ExpenseCategory.TRANSFER]: {
            label: 'Transfer',
            icon: '↔️',
            color: '#607D8B',
            subcategories: {
                [ExpenseSubcategory.P2P]: { label: 'P2P', icon: '👥' },
                [ExpenseSubcategory.SELF]: { label: 'Self', icon: '🔄' },
                [ExpenseSubcategory.SALARY]: { label: 'Salary', icon: '💵' },
            },
        },
        [ExpenseCategory.OTHER]: {
            label: 'Other',
            icon: '📄',
            color: '#95A5A6',
            subcategories: {
                [ExpenseSubcategory.GENERAL]: { label: 'General', icon: '📋' },
            },
        },
    };

    const catInfo = categoryInfo[category] || categoryInfo[ExpenseCategory.OTHER];

    if (subcategory && catInfo.subcategories && catInfo.subcategories[subcategory]) {
        const subInfo = catInfo.subcategories[subcategory];
        return {
            label: subInfo.label,
            icon: subInfo.icon,
            color: catInfo.color,
            categoryLabel: catInfo.label,
            categoryIcon: catInfo.icon,
        };
    }

    return {
        label: catInfo.label,
        icon: catInfo.icon,
        color: catInfo.color,
        categoryLabel: catInfo.label,
        categoryIcon: catInfo.icon,
    };
}

// ============= Export Class =============

export class ExpenseClassifier {
    static classify(text, sender = null) {
        return classifyExpense(text, sender);
    }

    static parseUPI(text) {
        return parseUPITransaction(text);
    }

    static extractAmount(text) {
        return extractExpenseAmount(text);
    }

    static getCategoryInfo(category, subcategory = null) {
        return getExpenseCategoryInfo(category, subcategory);
    }
}
