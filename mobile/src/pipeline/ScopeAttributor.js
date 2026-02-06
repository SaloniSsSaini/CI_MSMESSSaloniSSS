/**
 * ScopeAttributor - Attributes GHG Protocol scopes to classified messages
 * Ported from Python scopes.py
 */

// GHG Protocol Scopes
export const GHGScope = {
    SCOPE_1: 'Scope 1',  // Direct emissions
    SCOPE_2: 'Scope 2',  // Purchased energy
    SCOPE_3: 'Scope 3',  // Indirect emissions
    SCOPE_4: 'Avoided emissions / reductions',
    SCOPE_5: 'Offsets / removals',
    SCOPE_6: 'Reporting / targets / governance',
    SCOPE_7: 'Government policy / mandates / compliance',
    UNKNOWN: 'Unknown',
};

// Scope detection patterns
const RE_ELECTRICITY = /\b(kwh|electricity|meter|power|grid|ac|hvac)\b/i;
const RE_FUEL_DIESEL = /\b(diesel)\b/i;
const RE_FUEL_GASOLINE = /\b(petrol|gasoline)\b/i;
const RE_FUEL_GENERIC = /\b(fuel|refuel|filled\s*up)\b/i;
const RE_STATIONARY = /\b(generator|genset|dg\s*set|boiler|furnace|kiln|heater)\b/i;
const RE_COMPANY_FLEET = /\b(company\s*van|fleet|company\s*car|delivery\s*van|truck)\b/i;

const RE_TRAVEL_3P = /\b(uber|ola|lyft|taxi|rideshare|flight|plane|train|rail|bus|subway|metro)\b/i;
const RE_WASTE = /\b(recycle|recycling|landfill|trash|garbage|waste)\b/i;
const RE_PURCHASE = /\b(order|ordered|purchase|invoice|shipping|delivery|courier|package)\b/i;

// Avoided emissions / reductions
const RE_AVOIDED = /\b(saved|save|reduced|reduce|avoided|avoid|switched|switch|replaced|replace|installed|install)\b/i;
const RE_LED_SOLAR = /\b(led|solar|pv|heat\s*pump)\b/i;
const RE_MODE_SHIFT = /\b(remote\s*meeting|video\s*call|carpool|bike|cycled|walked)\b/i;

// Offsets & removals
const RE_OFFSET = /\b(offset|offsets|carbon\s*credit|credit\s*purchase|vcu|ver|cer|gold\s*standard|vcs|verra)\b/i;
const RE_REMOVAL = /\b(removal|removals|sequestration|tree\s*plant|afforestation|reforestation|biochar)\b/i;
const RE_REC = /\b(rec|renewable\s*energy\s*certificate|i-rec|irec)\b/i;

// Reporting / governance
const RE_REPORTING = /\b(esg|sustainability|ghg|emissions?\s*report|disclosure|audit|assurance|sbti|net\s*zero|target|baseline)\b/i;

// Government policy
const RE_GOV_POLICY = /\b(government|ministry|authority|regulatory|regulation|policy|mandate|compliance|permit|license|inspection|pollution\s*control|cpcb|spcb|carbon\s*tax)\b/i;

/**
 * Attribute GHG scope to a message
 * @param {string} text - SMS message text
 * @param {Object} classification - { category, subcategory }
 * @param {Object|null} quantity - { value, unit, commodity }
 * @returns {Object} - { scope, category, reason }
 */
export function attributeScope(text, classification, quantity = null) {
    const t = (text || '').trim();

    // Check for Scope 5: Offsets/removals/credits
    if (RE_OFFSET.test(t) || RE_REMOVAL.test(t) || RE_REC.test(t)) {
        return {
            scope: GHGScope.SCOPE_5,
            category: 'Offsets / removals',
            reason: 'Message indicates offsets/removals/credits.',
        };
    }

    // Check for Scope 4: Avoided emissions
    if (RE_AVOIDED.test(t) && (RE_LED_SOLAR.test(t) || RE_MODE_SHIFT.test(t) || quantity)) {
        return {
            scope: GHGScope.SCOPE_4,
            category: 'Avoided emissions / reductions',
            reason: 'Message indicates reduction/savings action.',
        };
    }

    // Electricity (kWh) → Scope 2
    if (quantity && quantity.unit === 'kwh') {
        return {
            scope: GHGScope.SCOPE_2,
            category: 'Purchased electricity',
            reason: 'kWh detected (Scope 2).',
        };
    }

    // Fuel (liters) → Usually Scope 1
    if (quantity && quantity.unit === 'l') {
        if (RE_FUEL_DIESEL.test(t) || RE_FUEL_GASOLINE.test(t) || RE_FUEL_GENERIC.test(t) || RE_STATIONARY.test(t)) {
            return {
                scope: GHGScope.SCOPE_1,
                category: 'Fuel combustion (mobile/stationary)',
                reason: 'Fuel quantity with combustion keywords (Scope 1).',
            };
        }
    }

    // Natural gas (m³) → Scope 1
    if (quantity && quantity.unit === 'm3') {
        return {
            scope: GHGScope.SCOPE_1,
            category: 'Stationary combustion (natural gas)',
            reason: 'Natural gas volume detected (Scope 1).',
        };
    }

    // Distance (km) → Check if company fleet or third-party
    if (quantity && quantity.unit === 'km') {
        if (RE_COMPANY_FLEET.test(t)) {
            return {
                scope: GHGScope.SCOPE_1,
                category: 'Company-owned fleet travel',
                reason: 'Distance with fleet keywords (Scope 1).',
            };
        }
        if (RE_TRAVEL_3P.test(t) || classification.category === 'transport') {
            return {
                scope: GHGScope.SCOPE_3,
                category: 'Transport / travel (indirect)',
                reason: 'Third-party travel/transport (Scope 3).',
            };
        }
    }

    // Classification-based fallbacks
    if (classification.category === 'fuel') {
        const isStationary = classification.subcategory?.includes('stationary');
        return {
            scope: GHGScope.SCOPE_1,
            category: isStationary ? 'Stationary combustion' : 'Mobile combustion',
            reason: 'Fuel category detected (Scope 1).',
        };
    }

    if (classification.category === 'energy') {
        return {
            scope: GHGScope.SCOPE_2,
            category: 'Purchased electricity',
            reason: 'Energy category detected (Scope 2).',
        };
    }

    if (classification.category === 'transport') {
        return {
            scope: GHGScope.SCOPE_3,
            category: 'Transport / travel',
            reason: 'Transport category detected (Scope 3).',
        };
    }

    // Waste → Scope 3
    if (RE_WASTE.test(t) || classification.category === 'waste') {
        return {
            scope: GHGScope.SCOPE_3,
            category: 'Waste',
            reason: 'Waste keywords detected (Scope 3).',
        };
    }

    // Purchase → Scope 3
    if (RE_PURCHASE.test(t) || classification.category === 'procurement') {
        return {
            scope: GHGScope.SCOPE_3,
            category: 'Purchased goods/services & logistics',
            reason: 'Purchase/logistics keywords detected (Scope 3).',
        };
    }

    // Electricity keywords → Scope 2
    if (RE_ELECTRICITY.test(t)) {
        return {
            scope: GHGScope.SCOPE_2,
            category: 'Purchased electricity',
            reason: 'Electricity keywords detected (Scope 2).',
        };
    }

    // Government policy → Scope 7
    if (RE_GOV_POLICY.test(t)) {
        return {
            scope: GHGScope.SCOPE_7,
            category: 'Government policies & mandates',
            reason: 'Policy/compliance language detected.',
        };
    }

    // Reporting → Scope 6
    if (RE_REPORTING.test(t)) {
        return {
            scope: GHGScope.SCOPE_6,
            category: 'Reporting / targets / governance',
            reason: 'Reporting/governance language detected.',
        };
    }

    // Unknown
    return {
        scope: GHGScope.UNKNOWN,
        category: 'Unclassified',
        reason: 'No scope heuristic matched.',
    };
}

export class ScopeAttributor {
    static attribute(text, classification, quantity = null) {
        return attributeScope(text, classification, quantity);
    }
}
