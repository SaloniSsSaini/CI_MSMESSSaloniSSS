/**
 * QuantityExtractor - Extracts carbon-relevant quantities from SMS text
 * Ported from Python parser.py
 */

// Number pattern for extraction
const NUM_PATTERN = /(\d+(?:,\d{3})*(?:\.\d+)?)/;

// Distance patterns
const RE_KM = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:km|kilometer(?:s)?|kilometre(?:s)?)\\b`, 'i');
const RE_MI = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:mi|mile(?:s)?)\\b`, 'i');

// Electricity patterns
const RE_KWH = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:k\\s*wh|kwh|units?)\\b`, 'i');

// Fuel patterns (liters / gallons)
const RE_LITER = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:l|ltr|litre(?:s)?|liter(?:s)?)\\b`, 'i');
const RE_GALLON = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:gal|gallon(?:s)?)\\b`, 'i');

// Natural gas (cubic meters)
const RE_M3 = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:m3|m\\^3|cubic\\s*met(?:er|re)(?:s)?)\\b`, 'i');

// CO2e quantities
const RE_KG_CO2E = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:kg)\\s*(?:co2e?|carbon)\\b`, 'i');
const RE_T_CO2E = new RegExp(`\\b${NUM_PATTERN.source}\\s*(?:t|tonne(?:s)?|ton(?:s)?)\\s*(?:co2e?|carbon)\\b`, 'i');

// Fuel type detection
const RE_DIESEL = /\b(diesel|hsd)\b/i;
const RE_PETROL = /\b(petrol|gasoline|unleaded)\b/i;
const RE_CNG = /\b(cng|natural\s*gas)\b/i;
const RE_LPG = /\b(lpg|propane)\b/i;

// Unit conversion helpers
function milesToKm(mi) {
    return mi * 1.60934;
}

function gallonsToLiters(gal) {
    return gal * 3.78541;
}

function tonnesToKg(t) {
    return t * 1000.0;
}

function parseNumber(str) {
    if (!str) return null;
    // Remove commas and parse
    const cleaned = str.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

/**
 * Extract quantity from text
 * @param {string} text - SMS message text
 * @returns {Object|null} - { value, unit, commodity? }
 */
export function extractQuantity(text) {
    const t = (text || '').trim();
    if (!t) return null;

    let match;

    // Priority 1: kWh (energy/electricity)
    match = RE_KWH.exec(t);
    if (match) {
        const value = parseNumber(match[1]);
        if (value !== null) {
            return { value, unit: 'kwh', commodity: 'electricity' };
        }
    }

    // Priority 2: Fuel in liters
    match = RE_LITER.exec(t);
    if (match) {
        const value = parseNumber(match[1]);
        if (value !== null) {
            let commodity = 'fuel';
            if (RE_DIESEL.test(t)) commodity = 'diesel';
            else if (RE_PETROL.test(t)) commodity = 'petrol';
            else if (RE_LPG.test(t)) commodity = 'lpg';
            return { value, unit: 'l', commodity };
        }
    }

    // Priority 3: Fuel in gallons (convert to liters)
    match = RE_GALLON.exec(t);
    if (match) {
        const gallons = parseNumber(match[1]);
        if (gallons !== null) {
            let commodity = 'fuel';
            if (RE_DIESEL.test(t)) commodity = 'diesel';
            else if (RE_PETROL.test(t)) commodity = 'petrol';
            return { value: gallonsToLiters(gallons), unit: 'l', commodity };
        }
    }

    // Priority 4: Natural gas (m³)
    match = RE_M3.exec(t);
    if (match) {
        const value = parseNumber(match[1]);
        if (value !== null) {
            return { value, unit: 'm3', commodity: 'natural_gas' };
        }
    }

    // Priority 5: CNG
    if (RE_CNG.test(t)) {
        // Look for kg of CNG
        const kgMatch = /(\d+(?:\.\d+)?)\s*kg/i.exec(t);
        if (kgMatch) {
            const value = parseNumber(kgMatch[1]);
            if (value !== null) {
                return { value, unit: 'kg', commodity: 'cng' };
            }
        }
    }

    // Priority 6: Distance in km
    match = RE_KM.exec(t);
    if (match) {
        const value = parseNumber(match[1]);
        if (value !== null) {
            return { value, unit: 'km', commodity: 'distance' };
        }
    }

    // Priority 7: Distance in miles (convert to km)
    match = RE_MI.exec(t);
    if (match) {
        const miles = parseNumber(match[1]);
        if (miles !== null) {
            return { value: milesToKm(miles), unit: 'km', commodity: 'distance' };
        }
    }

    // Priority 8: Explicit CO2e in kg
    match = RE_KG_CO2E.exec(t);
    if (match) {
        const value = parseNumber(match[1]);
        if (value !== null) {
            return { value, unit: 'kgco2e', commodity: 'emissions' };
        }
    }

    // Priority 9: Explicit CO2e in tonnes (convert to kg)
    match = RE_T_CO2E.exec(t);
    if (match) {
        const tonnes = parseNumber(match[1]);
        if (tonnes !== null) {
            return { value: tonnesToKg(tonnes), unit: 'kgco2e', commodity: 'emissions' };
        }
    }

    return null;
}

/**
 * Extract monetary amount from text
 * @param {string} text - SMS message text
 * @returns {Object|null} - { value, currency }
 */
export function extractAmount(text) {
    const t = (text || '').trim();
    if (!t) return null;

    // INR pattern: Rs, Rs., ₹, INR followed by amount
    const inrPatterns = [
        /(?:Rs\.?|₹|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
        /(?:debited|credited|paid|received)\s*(?:Rs\.?|₹|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ];

    for (const pattern of inrPatterns) {
        const match = pattern.exec(t);
        if (match) {
            const value = parseNumber(match[1]);
            if (value !== null && value > 0) {
                return { value, currency: 'INR' };
            }
        }
    }

    return null;
}

export class QuantityExtractor {
    static extract(text) {
        return extractQuantity(text);
    }

    static extractAmount(text) {
        return extractAmount(text);
    }

    static extractAll(text) {
        return {
            quantity: extractQuantity(text),
            amount: extractAmount(text),
        };
    }
}
