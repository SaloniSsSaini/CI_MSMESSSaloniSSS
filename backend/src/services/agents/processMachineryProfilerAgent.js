const carbonCalculationService = require('../carbonCalculationService');
const logger = require('../../utils/logger');

const PROCESS_MACHINERY_BY_SECTOR = {
  manufacturing: {
    processes: ['material_preparation', 'machining', 'assembly', 'finishing', 'quality_control'],
    machinery: ['cnc_machines', 'compressors', 'boilers', 'conveyors', 'industrial_fans']
  },
  textiles: {
    processes: ['spinning', 'weaving', 'dyeing', 'finishing', 'washing'],
    machinery: ['looms', 'dyeing_units', 'dryers', 'boilers', 'air_compressors']
  },
  food_processing: {
    processes: ['sorting', 'processing', 'cooking', 'packaging', 'cold_storage'],
    machinery: ['boilers', 'refrigeration_units', 'mixers', 'conveyors', 'packaging_lines']
  },
  electronics: {
    processes: ['assembly', 'soldering', 'testing', 'packaging'],
    machinery: ['smt_lines', 'testing_rigs', 'clean_rooms', 'compressors']
  },
  automotive: {
    processes: ['fabrication', 'machining', 'welding', 'painting', 'assembly'],
    machinery: ['welding_units', 'paint_booths', 'presses', 'cnc_machines', 'conveyors']
  },
  construction: {
    processes: ['material_mixing', 'fabrication', 'transport', 'on_site_assembly'],
    machinery: ['mixers', 'cranes', 'generators', 'compressors', 'transport_fleet']
  },
  logistics: {
    processes: ['sorting', 'routing', 'loading', 'delivery'],
    machinery: ['transport_fleet', 'forklifts', 'refrigeration_units', 'conveyors']
  },
  agriculture: {
    processes: ['irrigation', 'harvesting', 'processing', 'storage'],
    machinery: ['pumps', 'tractors', 'cold_storage', 'generators']
  },
  healthcare: {
    processes: ['sterilization', 'waste_handling', 'facility_operations'],
    machinery: ['autoclaves', 'hvac_systems', 'generators', 'medical_devices']
  },
  education: {
    processes: ['facility_operations', 'transportation'],
    machinery: ['hvac_systems', 'diesel_generators', 'lab_equipment']
  },
  tourism: {
    processes: ['facility_operations', 'transportation', 'hospitality_services'],
    machinery: ['hvac_systems', 'transport_fleet', 'laundry_units', 'boilers']
  },
  trading: {
    processes: ['storage', 'distribution', 'transport'],
    machinery: ['transport_fleet', 'forklifts', 'cold_storage']
  },
  retail: {
    processes: ['storage', 'last_mile_delivery', 'store_operations'],
    machinery: ['transport_fleet', 'hvac_systems', 'refrigeration_units']
  },
  wholesale: {
    processes: ['storage', 'distribution', 'transport'],
    machinery: ['transport_fleet', 'forklifts', 'compressors']
  },
  services: {
    processes: ['office_operations', 'travel', 'client_delivery'],
    machinery: ['hvac_systems', 'it_infrastructure', 'transport_fleet']
  },
  export_import: {
    processes: ['storage', 'packaging', 'shipping', 'customs_handling'],
    machinery: ['transport_fleet', 'forklifts', 'packaging_lines', 'refrigeration_units']
  },
  consulting: {
    processes: ['office_operations', 'client_travel'],
    machinery: ['it_infrastructure', 'transport_fleet']
  },
  handicrafts: {
    processes: ['material_preparation', 'crafting', 'finishing', 'packaging'],
    machinery: ['hand_tools', 'small_looms', 'dryers']
  },
  e_commerce: {
    processes: ['fulfillment', 'packaging', 'last_mile_delivery'],
    machinery: ['sorting_lines', 'packaging_lines', 'transport_fleet']
  },
  other: {
    processes: ['operations', 'transport', 'facility_management'],
    machinery: ['transport_fleet', 'hvac_systems', 'generators']
  }
};

const PRODUCT_PROCESS_HINTS = [
  { match: ['steel', 'metal', 'fabrication'], processes: ['cutting', 'welding'], machinery: ['presses', 'welding_units'] },
  { match: ['cement', 'concrete'], processes: ['mixing', 'curing'], machinery: ['mixers', 'kilns'] },
  { match: ['textile', 'garment', 'cotton'], processes: ['dyeing', 'weaving'], machinery: ['looms', 'dyeing_units'] },
  { match: ['food', 'dairy', 'bakery'], processes: ['processing', 'cold_storage'], machinery: ['refrigeration_units', 'boilers'] },
  { match: ['pharma', 'medical'], processes: ['sterilization', 'packaging'], machinery: ['autoclaves', 'clean_rooms'] },
  { match: ['electronics', 'circuit'], processes: ['soldering', 'testing'], machinery: ['smt_lines', 'testing_rigs'] },
  { match: ['automotive', 'vehicle'], processes: ['assembly', 'painting'], machinery: ['paint_booths', 'conveyors'] },
  { match: ['agro', 'rice', 'grain'], processes: ['processing', 'storage'], machinery: ['dryers', 'cold_storage'] }
];

class ProcessMachineryProfilerAgent {
  async analyzeProfile(input) {
    try {
      const msmeData = input?.msmeData || {};
      const transactions = Array.isArray(input?.transactions) ? input.transactions : [];
      const context = input?.context || {};

      const sectorKey = (msmeData.businessDomain || 'other').toLowerCase();
      const baseProfile = PROCESS_MACHINERY_BY_SECTOR[sectorKey] || PROCESS_MACHINERY_BY_SECTOR.other;
      const productSignals = this.extractProductSignals(msmeData);
      const processMapping = this.runProcessMapper(baseProfile, productSignals);
      const machineryMapping = this.runMachineryMapper(baseProfile, productSignals);
      const enrichedProfile = {
        processes: processMapping.processes,
        machinery: machineryMapping.machinery
      };
      const activitySignals = this.deriveActivitySignals(transactions);
      const emissionFactorMapping = this.runEmissionFactorMapper(enrichedProfile, activitySignals, context);
      const intensityEstimator = this.runIntensityEstimator(enrichedProfile, activitySignals);

      return {
        sector: sectorKey,
        processes: enrichedProfile.processes,
        machinery: enrichedProfile.machinery,
        activitySignals,
        emissionFactors: emissionFactorMapping.emissionFactors,
        intensityProfile: intensityEstimator.intensityProfile,
        subAgents: {
          processMapper: processMapping,
          machineryMapper: machineryMapping,
          emissionFactorMapper: emissionFactorMapping,
          intensityEstimator
        },
        notes: this.buildNotes(enrichedProfile, productSignals, activitySignals),
        confidence: this.calculateConfidence(transactions, msmeData)
      };
    } catch (error) {
      logger.error('Process/machinery profiling failed:', error);
      throw error;
    }
  }

  extractProductSignals(msmeData) {
    const products = (msmeData?.business?.primaryProducts || '')
      .toLowerCase()
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    return products;
  }

  enrichWithProducts(baseProfile, productSignals) {
    const processes = new Set(baseProfile.processes || []);
    const machinery = new Set(baseProfile.machinery || []);

    productSignals.forEach(product => {
      PRODUCT_PROCESS_HINTS.forEach(hint => {
        if (hint.match.some(token => product.includes(token))) {
          hint.processes.forEach(process => processes.add(process));
          hint.machinery.forEach(machine => machinery.add(machine));
        }
      });
    });

    return {
      processes: Array.from(processes),
      machinery: Array.from(machinery)
    };
  }

  runProcessMapper(baseProfile, productSignals) {
    const enriched = this.enrichWithProducts(baseProfile, productSignals);
    return {
      processes: enriched.processes,
      rationale: productSignals.length > 0
        ? 'Processes derived from sector defaults and product hints.'
        : 'Processes derived from sector defaults.'
    };
  }

  runMachineryMapper(baseProfile, productSignals) {
    const enriched = this.enrichWithProducts(baseProfile, productSignals);
    return {
      machinery: enriched.machinery,
      rationale: productSignals.length > 0
        ? 'Machinery derived from sector defaults and product hints.'
        : 'Machinery derived from sector defaults.'
    };
  }

  runEmissionFactorMapper(profile, activitySignals, context) {
    return {
      emissionFactors: this.deriveEmissionFactors(profile, activitySignals, context),
      signals: {
        transportShare: activitySignals.transportation || 0,
        materialShare: activitySignals.raw_materials || 0
      }
    };
  }

  runIntensityEstimator(profile, activitySignals) {
    return {
      intensityProfile: this.estimateIntensity(profile, activitySignals),
      signals: activitySignals
    };
  }

  deriveActivitySignals(transactions) {
    const totals = transactions.reduce((acc, txn) => {
      const category = (txn.category || 'other').toLowerCase();
      acc.totalAmount += Number(txn.amount) || 0;
      acc.categoryTotals[category] = (acc.categoryTotals[category] || 0) + (Number(txn.amount) || 0);
      return acc;
    }, { totalAmount: 0, categoryTotals: {} });

    const signals = {};
    Object.keys(totals.categoryTotals).forEach(category => {
      signals[category] = totals.totalAmount > 0 ? totals.categoryTotals[category] / totals.totalAmount : 0;
    });

    return signals;
  }

  deriveEmissionFactors(profile, activitySignals, context) {
    const factors = [];

    factors.push({
      category: 'energy',
      label: 'Grid electricity',
      unit: 'kg CO2 per kWh',
      value: carbonCalculationService.emissionFactors.electricity.grid
    });

    factors.push({
      category: 'energy',
      label: 'Renewable electricity',
      unit: 'kg CO2 per kWh',
      value: carbonCalculationService.emissionFactors.electricity.renewable
    });

    Object.entries(carbonCalculationService.emissionFactors.fuel).forEach(([fuel, value]) => {
      factors.push({
        category: 'fuel',
        label: `${fuel} fuel combustion`,
        unit: 'kg CO2 per liter',
        value
      });
    });

    if (activitySignals.transportation > 0.1 || profile.machinery.includes('transport_fleet')) {
      Object.entries(carbonCalculationService.emissionFactors.transport).forEach(([fuel, value]) => {
        factors.push({
          category: 'transportation',
          label: `${fuel} transport`,
          unit: 'kg CO2 per liter',
          value
        });
      });
    }

    if (activitySignals.raw_materials > 0.1 || profile.processes.includes('material_preparation')) {
      Object.entries(carbonCalculationService.emissionFactors.materials).forEach(([material, value]) => {
        factors.push({
          category: 'materials',
          label: `${material} inputs`,
          unit: 'kg CO2 per kg',
          value
        });
      });
    }

    if (context.region && carbonCalculationService.esgParameters?.locationFactors?.[context.region]) {
      const regionFactors = carbonCalculationService.esgParameters.locationFactors[context.region];
      factors.push({
        category: 'location',
        label: `Regional electricity factor (${context.region})`,
        unit: 'kg CO2 per kWh',
        value: regionFactors.electricity
      });
    }

    return factors;
  }

  estimateIntensity(profile, activitySignals) {
    const intensity = {
      energy: activitySignals.energy || 0,
      transportation: activitySignals.transportation || 0,
      materials: activitySignals.raw_materials || 0,
      waste: activitySignals.waste_management || 0,
      operations: profile.processes.length / 10
    };

    return {
      score: Math.min(1, Object.values(intensity).reduce((sum, val) => sum + val, 0) / 2),
      breakdown: intensity
    };
  }

  buildNotes(profile, productSignals, activitySignals) {
    const notes = [];
    if (productSignals.length > 0) {
      notes.push(`Products analyzed: ${productSignals.join(', ')}`);
    }
    if (activitySignals.energy > 0.2) {
      notes.push('Energy-intensive operations detected from transactions.');
    }
    if (profile.machinery.includes('boilers')) {
      notes.push('Boilers suggest fuel combustion emissions to monitor.');
    }
    if (activitySignals.transportation > 0.15) {
      notes.push('Transportation spend indicates logistics emissions focus.');
    }
    return notes;
  }

  calculateConfidence(transactions, msmeData) {
    let confidence = Math.min(1, transactions.length / 12);
    if (msmeData?.business?.primaryProducts) {
      confidence += 0.15;
    }
    if (msmeData?.business?.manufacturingUnits) {
      confidence += 0.1;
    }
    return Math.min(1, confidence);
  }
}

module.exports = new ProcessMachineryProfilerAgent();
