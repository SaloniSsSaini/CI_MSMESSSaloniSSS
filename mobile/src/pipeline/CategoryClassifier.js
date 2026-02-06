/**
 * CategoryClassifier - Classifies SMS messages into carbon-relevant categories
 * Ported from Python classification.py and model.py
 */

// ============= Category Detection Patterns =============

// Transport patterns
const RE_TRANSPORT = {
    car: /\b(drove|drive|driving|car|vehicle|sedan|suv|hatchback)\b/i,
    rideshare: /\b(uber|ola|lyft|taxi|cab|rideshare|grab)\b/i,
    bus: /\b(bus|coach|public\s*transport)\b/i,
    train: /\b(train|rail|metro|subway|local\s*train)\b/i,
    bike: /\b(bike|bicycle|cycling|cycled)\b/i,
    walk: /\b(walk|walked|walking|on\s*foot)\b/i,
    flight: /\b(flight|flew|flying|airplane|plane|airport|boarding)\b/i,
    auto: /\b(auto|rickshaw|auto-rickshaw|autorickshaw)\b/i,
};

// Energy patterns
const RE_ENERGY = {
    electricity: /\b(kwh|electricity|power|meter\s*reading|bill|unit|grid|consumed)\b/i,
    gas: /\b(gas\s*bill|natural\s*gas|piped\s*gas|png|cng)\b/i,
    solar: /\b(solar|pv|rooftop|net\s*metering)\b/i,
};

// Fuel patterns
const RE_FUEL = {
    diesel: /\b(diesel|hsd)\b/i,
    petrol: /\b(petrol|gasoline|unleaded)\b/i,
    cng: /\b(cng)\b/i,
    lpg: /\b(lpg|cylinder|cooking\s*gas)\b/i,
};

// Fuel station/context patterns
const RE_FUEL_CONTEXT = /\b(pump|petrol\s*pump|fuel\s*station|hp|iocl|bpcl|shell|filled|refuel|tank)\b/i;

// Stationary combustion
const RE_STATIONARY = /\b(generator|genset|dg\s*set|boiler|furnace|kiln|heater)\b/i;

// Waste patterns
const RE_WASTE = {
    recycling: /\b(recycle|recycling|recycled|sorted|segregat)\b/i,
    trash: /\b(trash|garbage|waste|landfill|dump|disposed)\b/i,
};

// Purchase/delivery patterns
const RE_PURCHASE = /\b(order|ordered|purchase|invoice|shipping|delivery|courier|package|dispatch|shipment)\b/i;

// Food patterns
const RE_FOOD = {
    beef: /\b(beef|steak|burger|mutton|lamb|goat)\b/i,
    chicken: /\b(chicken|poultry)\b/i,
    fish: /\b(fish|seafood|prawn|shrimp)\b/i,
    vegan: /\b(vegan|vegetarian|plant\s*based|tofu|lentil|dal)\b/i,
};

// Subcategory refinement patterns
const RE_SUBCATEGORY = {
    meter: /\b(meter|metering|reading)\b/i,
    solar: /\b(solar|pv|net\s*metering|rooftop)\b/i,
    lighting: /\b(led|lighting|bulb)\b/i,
    hvac: /\b(ac|hvac|air\s*con|heater|heating|cooling)\b/i,
    machinery: /\b(cnc|machine|motor|compressor|welding|kiln)\b/i,
    ev: /\b(ev|e-?rickshaw|charged|charging|electric\s*vehicle)\b/i,
    logistics: /\b(delivery|dispatch|courier|shipment|pickup)\b/i,
    business_travel: /\b(client|meeting|audit|visit)\b/i,
    commute: /\b(commute|to\s*work|to\s*office|office)\b/i,
    raw_material: /\b(raw\s*material|inputs?)\b/i,
    packaging: /\b(packaging|carton|box)\b/i,
};

/**
 * Classify an SMS message into a category
 * @param {string} text - SMS message text
 * @param {Object|null} quantity - Extracted quantity { value, unit, commodity }
 * @returns {Object} - { category, subcategory, activity, confidence, reasonCodes }
 */
export function classifyCategory(text, quantity = null) {
    const t = (text || '').trim();
    const tl = t.toLowerCase();
    const reasonCodes = [];

    if (!t) {
        return {
            category: 'other',
            subcategory: 'empty',
            activity: 'unknown',
            confidence: 0,
            reasonCodes: ['empty_message'],
        };
    }

    // ========== QUANTITY-DRIVEN CLASSIFICATION ==========
    // Quantity is more reliable than text alone

    // Electricity (kWh)
    if (quantity && quantity.unit === 'kwh') {
        reasonCodes.push('kwh_detected');
        let subcategory = 'general';

        if (RE_SUBCATEGORY.ev.test(t)) {
            subcategory = 'ev_charging';
            reasonCodes.push('ev_context');
        } else if (RE_SUBCATEGORY.solar.test(t)) {
            subcategory = 'solar_net_metering';
            reasonCodes.push('solar_context');
        } else if (RE_SUBCATEGORY.meter.test(t)) {
            subcategory = 'meter_reading';
            reasonCodes.push('meter_context');
        } else if (RE_SUBCATEGORY.hvac.test(t)) {
            subcategory = 'hvac';
            reasonCodes.push('hvac_context');
        } else if (RE_SUBCATEGORY.machinery.test(t)) {
            subcategory = 'machinery';
            reasonCodes.push('machinery_context');
        } else if (RE_SUBCATEGORY.lighting.test(t)) {
            subcategory = 'lighting';
            reasonCodes.push('lighting_context');
        }

        return {
            category: 'energy',
            subcategory,
            activity: 'electricity',
            confidence: 0.9,
            reasonCodes,
        };
    }

    // Fuel (liters)
    if (quantity && quantity.unit === 'l') {
        reasonCodes.push('fuel_volume_detected');

        let fuelType = 'liquid_fuel';
        if (RE_FUEL.diesel.test(t)) {
            fuelType = 'diesel';
            reasonCodes.push('diesel_keyword');
        } else if (RE_FUEL.petrol.test(t)) {
            fuelType = 'petrol';
            reasonCodes.push('petrol_keyword');
        }

        const isStationary = RE_STATIONARY.test(t);
        const subcategory = `${fuelType}.${isStationary ? 'stationary' : 'mobile'}`;

        if (isStationary) reasonCodes.push('stationary_combustion');
        else reasonCodes.push('mobile_combustion');

        return {
            category: 'fuel',
            subcategory,
            activity: 'combustion',
            confidence: 0.9,
            reasonCodes,
        };
    }

    // Natural gas (m³)
    if (quantity && quantity.unit === 'm3') {
        reasonCodes.push('gas_volume_detected');
        return {
            category: 'fuel',
            subcategory: 'natural_gas.stationary',
            activity: 'combustion',
            confidence: 0.9,
            reasonCodes,
        };
    }

    // Distance (km) - need to determine transport mode
    if (quantity && quantity.unit === 'km') {
        reasonCodes.push('distance_detected');

        // Check transport mode
        for (const [mode, pattern] of Object.entries(RE_TRANSPORT)) {
            if (pattern.test(t)) {
                reasonCodes.push(`${mode}_keyword`);

                let subcategory = mode;
                if (RE_SUBCATEGORY.logistics.test(t)) {
                    subcategory = `${mode}.logistics`;
                } else if (RE_SUBCATEGORY.business_travel.test(t)) {
                    subcategory = `${mode}.business_travel`;
                } else if (RE_SUBCATEGORY.commute.test(t)) {
                    subcategory = `${mode}.commute`;
                }

                return {
                    category: 'transport',
                    subcategory,
                    activity: 'travel',
                    confidence: 0.85,
                    reasonCodes,
                };
            }
        }

        // Default to car if distance but no specific mode
        return {
            category: 'transport',
            subcategory: 'car.general',
            activity: 'travel',
            confidence: 0.6,
            reasonCodes: [...reasonCodes, 'default_car'],
        };
    }

    // ========== TEXT-BASED CLASSIFICATION ==========

    // Check for fuel purchase (even without quantity)
    if (RE_FUEL_CONTEXT.test(t)) {
        reasonCodes.push('fuel_context');

        let fuelType = 'fuel';
        if (RE_FUEL.diesel.test(t)) fuelType = 'diesel';
        else if (RE_FUEL.petrol.test(t)) fuelType = 'petrol';
        else if (RE_FUEL.cng.test(t)) fuelType = 'cng';
        else if (RE_FUEL.lpg.test(t)) fuelType = 'lpg';

        return {
            category: 'fuel',
            subcategory: `${fuelType}.mobile`,
            activity: 'purchase',
            confidence: 0.75,
            reasonCodes,
        };
    }

    // Check electricity
    if (RE_ENERGY.electricity.test(t)) {
        reasonCodes.push('electricity_keyword');
        return {
            category: 'energy',
            subcategory: 'electricity.general',
            activity: 'consumption',
            confidence: 0.7,
            reasonCodes,
        };
    }

    // Check transport modes
    for (const [mode, pattern] of Object.entries(RE_TRANSPORT)) {
        if (pattern.test(t)) {
            reasonCodes.push(`${mode}_keyword`);
            return {
                category: 'transport',
                subcategory: mode,
                activity: 'travel',
                confidence: 0.7,
                reasonCodes,
            };
        }
    }

    // Check waste
    for (const [type, pattern] of Object.entries(RE_WASTE)) {
        if (pattern.test(t)) {
            reasonCodes.push(`waste_${type}`);
            return {
                category: 'waste',
                subcategory: type,
                activity: type === 'recycling' ? 'recycling' : 'disposal',
                confidence: 0.7,
                reasonCodes,
            };
        }
    }

    // Check purchase/delivery
    if (RE_PURCHASE.test(t)) {
        reasonCodes.push('purchase_keyword');

        let subcategory = 'general';
        if (RE_SUBCATEGORY.raw_material.test(t)) subcategory = 'raw_materials';
        else if (RE_SUBCATEGORY.packaging.test(t)) subcategory = 'packaging';
        else if (RE_SUBCATEGORY.logistics.test(t)) subcategory = 'courier_logistics';

        return {
            category: 'procurement',
            subcategory,
            activity: 'delivery',
            confidence: 0.65,
            reasonCodes,
        };
    }

    // Check food
    for (const [type, pattern] of Object.entries(RE_FOOD)) {
        if (pattern.test(t)) {
            reasonCodes.push(`food_${type}`);
            return {
                category: 'food',
                subcategory: type,
                activity: 'consumption',
                confidence: 0.6,
                reasonCodes,
            };
        }
    }

    // Fallback
    return {
        category: 'other',
        subcategory: 'general',
        activity: 'unknown',
        confidence: 0.3,
        reasonCodes: ['unclassified'],
    };
}

export class CategoryClassifier {
    static classify(text, quantity = null) {
        return classifyCategory(text, quantity);
    }
}
