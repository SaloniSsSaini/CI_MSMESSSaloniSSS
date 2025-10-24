class CarbonCalculationService {
  constructor() {
    // Emission factors (kg CO2 per unit)
    this.emissionFactors = {
      // Energy
      electricity: {
        grid: 0.8, // kg CO2 per kWh (Indian grid average)
        renewable: 0.1,
        mixed: 0.4
      },
      fuel: {
        diesel: 2.68, // kg CO2 per liter
        petrol: 2.31,
        lpg: 1.51,
        cng: 1.51
      },
      
      // Water
      water: 0.0004, // kg CO2 per liter
      
      // Waste
      solidWaste: 0.5, // kg CO2 per kg (landfill)
      hazardousWaste: 2.0, // kg CO2 per kg
      
      // Materials
      materials: {
        steel: 1.85, // kg CO2 per kg
        aluminum: 8.24,
        plastic: 2.53,
        paper: 0.93,
        glass: 0.85,
        wood: 0.3,
        concrete: 0.15
      },
      
      // Transportation
      transport: {
        diesel: 2.68, // kg CO2 per liter
        petrol: 2.31,
        cng: 1.51
      }
    };
    
    // Industry-specific factors
    this.industryFactors = {
      manufacturing: 1.0,
      textiles: 1.2,
      food: 0.8,
      chemicals: 1.5,
      electronics: 1.1,
      automotive: 1.3,
      pharmaceuticals: 1.4,
      construction: 1.6,
      agriculture: 0.9,
      mining: 2.0,
      energy: 1.8,
      transportation: 1.7,
      retail: 0.7,
      services: 0.5
    };

    // MSME Business domain-specific factors (based on official MSME classifications)
    this.domainFactors = {
      manufacturing: {
        // Manufacturing has high energy consumption and material usage
        transportation: 1.2,
        energy: 1.4,
        materials: 1.5,
        waste: 1.3
      },
      trading: {
        // Trading focuses on logistics and distribution
        transportation: 1.3,
        energy: 0.8,
        materials: 1.1,
        waste: 0.9
      },
      services: {
        // Services typically have lower material and energy consumption
        transportation: 1.0,
        energy: 0.9,
        materials: 0.7,
        waste: 0.8
      },
      export_import: {
        // Export/Import has high transportation emissions
        transportation: 1.6,
        energy: 1.0,
        materials: 1.2,
        waste: 1.1
      },
      retail: {
        // Retail has moderate transportation and packaging emissions
        transportation: 1.2,
        energy: 0.9,
        materials: 1.2,
        waste: 1.1
      },
      wholesale: {
        // Wholesale has higher transportation but lower packaging
        transportation: 1.4,
        energy: 0.8,
        materials: 1.0,
        waste: 0.9
      },
      e_commerce: {
        // E-commerce has high last-mile delivery emissions
        transportation: 1.5,
        energy: 1.1,
        materials: 1.3,
        waste: 1.2
      },
      consulting: {
        // Consulting has minimal physical resource consumption
        transportation: 0.8,
        energy: 0.7,
        materials: 0.5,
        waste: 0.6
      },
      logistics: {
        // Logistics has very high transportation emissions
        transportation: 1.8,
        energy: 1.2,
        materials: 1.1,
        waste: 1.0
      },
      agriculture: {
        // Agriculture has moderate emissions with seasonal variations
        transportation: 1.1,
        energy: 0.9,
        materials: 1.0,
        waste: 0.8
      },
      handicrafts: {
        // Handicrafts have low energy but moderate material usage
        transportation: 1.0,
        energy: 0.8,
        materials: 1.2,
        waste: 0.9
      },
      food_processing: {
        // Food processing has high energy and water consumption
        transportation: 1.1,
        energy: 1.3,
        materials: 1.1,
        waste: 1.2
      },
      textiles: {
        // Textiles have high water and energy consumption
        transportation: 1.0,
        energy: 1.4,
        materials: 1.3,
        waste: 1.1
      },
      electronics: {
        // Electronics have moderate energy and material consumption
        transportation: 1.1,
        energy: 1.2,
        materials: 1.2,
        waste: 1.0
      },
      automotive: {
        // Automotive has high material and energy consumption
        transportation: 1.2,
        energy: 1.5,
        materials: 1.6,
        waste: 1.2
      },
      construction: {
        // Construction has very high material consumption
        transportation: 1.3,
        energy: 1.2,
        materials: 1.8,
        waste: 1.4
      },
      healthcare: {
        // Healthcare has moderate energy and material consumption
        transportation: 1.0,
        energy: 1.1,
        materials: 1.1,
        waste: 1.2
      },
      education: {
        // Education has low material consumption
        transportation: 0.9,
        energy: 0.9,
        materials: 0.8,
        waste: 0.8
      },
      tourism: {
        // Tourism has moderate transportation and energy consumption
        transportation: 1.2,
        energy: 1.0,
        materials: 0.9,
        waste: 1.0
      },
      other: {
        // Other domain types use default factors
        transportation: 1.0,
        energy: 1.0,
        materials: 1.0,
        waste: 1.0
      }
    };

    // Enhanced ESG parameters
    this.esgParameters = {
      // Location-based emission factors (kg CO2 per unit)
      locationFactors: {
        'north-india': { electricity: 0.85, transport: 1.1 },
        'south-india': { electricity: 0.75, transport: 1.0 },
        'east-india': { electricity: 0.90, transport: 1.2 },
        'west-india': { electricity: 0.80, transport: 1.05 },
        'northeast-india': { electricity: 0.70, transport: 1.3 }
      },
      
      // Temporal factors (seasonal variations)
      temporalFactors: {
        summer: { cooling: 1.3, heating: 0.7 },
        winter: { cooling: 0.7, heating: 1.4 },
        monsoon: { transport: 1.2, energy: 1.1 },
        dry: { energy: 0.9, transport: 0.95 }
      },
      
      // Company size factors
      sizeFactors: {
        micro: { efficiency: 0.8, scale: 1.2 },
        small: { efficiency: 0.9, scale: 1.1 },
        medium: { efficiency: 1.0, scale: 1.0 },
        large: { efficiency: 1.1, scale: 0.9 },
        enterprise: { efficiency: 1.2, scale: 0.8 }
      },
      
      // Technology factors
      technologyFactors: {
        traditional: 1.2,
        modern: 1.0,
        advanced: 0.8,
        cutting_edge: 0.6
      },
      
      // Scope 4 avoided emissions factors
      avoidedEmissionFactors: {
        renewableEnergy: {
          solar: 0.8, // kg CO2 per kWh avoided
          wind: 0.7,
          hydro: 0.6,
          biomass: 0.9
        },
        energyEfficiency: {
          ledLighting: 0.1, // kg CO2 per kWh saved
          efficientMotors: 0.15,
          insulation: 0.2,
          smartControls: 0.12
        },
        wasteReduction: {
          recycling: 0.5, // kg CO2 per kg waste avoided
          composting: 0.3,
          wasteToEnergy: 0.4
        },
        sustainableTransport: {
          electricVehicles: 0.3, // kg CO2 per km avoided
          publicTransport: 0.6,
          cycling: 0.1,
          walking: 0.05
        }
      }
    };
  }

  calculateTransactionCarbonFootprint(transaction) {
    const { category, amount, subcategory, vendor, sustainability } = transaction;
    
    let co2Emissions = 0;
    let emissionFactor = 0;
    const calculationMethod = 'transaction_analysis';
    
    switch (category) {
      case 'energy':
        co2Emissions = this.calculateEnergyEmissions(transaction);
        break;
      case 'water':
        co2Emissions = this.calculateWaterEmissions(transaction);
        break;
      case 'waste_management':
        co2Emissions = this.calculateWasteEmissions(transaction);
        break;
      case 'transportation':
        co2Emissions = this.calculateTransportEmissions(transaction);
        break;
      case 'raw_materials':
        co2Emissions = this.calculateMaterialEmissions(transaction);
        break;
      case 'equipment':
        co2Emissions = this.calculateEquipmentEmissions(transaction);
        break;
      case 'maintenance':
        co2Emissions = this.calculateMaintenanceEmissions(transaction);
        break;
      default:
        co2Emissions = this.calculateGenericEmissions(transaction);
    }
    
    // Apply sustainability factors
    if (sustainability.isGreen) {
      co2Emissions *= (1 - sustainability.greenScore / 200); // Reduce by up to 50%
    }
    
    // Apply industry factor
    const industryFactor = this.industryFactors[transaction.industry] || 1.0;
    co2Emissions *= industryFactor;

    // Apply business domain factor if available
    if (transaction.businessDomain) {
      const domainFactor = this.domainFactors[transaction.businessDomain];
      if (domainFactor) {
        switch (category) {
          case 'transportation':
            co2Emissions *= domainFactor.transportation;
            break;
          case 'energy':
            co2Emissions *= domainFactor.energy;
            break;
          case 'raw_materials':
            co2Emissions *= domainFactor.materials;
            break;
          case 'waste_management':
            co2Emissions *= domainFactor.waste;
            break;
        }
      }
    }
    
    emissionFactor = amount > 0 ? co2Emissions / amount : 0;
    
    return {
      co2Emissions: Math.round(co2Emissions * 100) / 100,
      emissionFactor: Math.round(emissionFactor * 10000) / 10000,
      calculationMethod
    };
  }

  calculateEnergyEmissions(transaction) {
    const { amount, subcategory, description } = transaction;
    
    if (subcategory === 'renewable') {
      return amount * this.emissionFactors.electricity.renewable;
    } else if (subcategory === 'grid') {
      return amount * this.emissionFactors.electricity.grid;
    } else {
      // Estimate based on description
      if (description && description.toLowerCase().includes('solar') || description && description.toLowerCase().includes('wind')) {
        return amount * this.emissionFactors.electricity.renewable;
      }
      return amount * this.emissionFactors.electricity.grid;
    }
  }

  calculateWaterEmissions(transaction) {
    const { amount } = transaction;
    return amount * this.emissionFactors.water;
  }

  calculateWasteEmissions(transaction) {
    const { amount, subcategory, description } = transaction;
    
    if (subcategory === 'recycling') {
      // Recycling reduces emissions by 70%
      return amount * this.emissionFactors.solidWaste * 0.3;
    } else if (description && description.toLowerCase().includes('hazardous')) {
      return amount * this.emissionFactors.hazardousWaste;
    } else {
      return amount * this.emissionFactors.solidWaste;
    }
  }

  calculateTransportEmissions(transaction) {
    const { amount, subcategory, description } = transaction;
    
    let fuelType = 'diesel'; // Default
    if (subcategory === 'petrol') fuelType = 'petrol';
    if (subcategory === 'cng') fuelType = 'cng';
    
    // If amount is in liters, use directly; otherwise estimate from cost
    let fuelConsumption = amount;
    if (description && description.toLowerCase().includes('cost') || description && description.toLowerCase().includes('price')) {
      const fuelPrice = 80; // Average diesel price per liter
      fuelConsumption = amount / fuelPrice;
    }
    
    return fuelConsumption * this.emissionFactors.transport[fuelType];
  }

  calculateMaterialEmissions(transaction) {
    const { amount, subcategory, description } = transaction;
    
    let materialType = 'steel'; // Default
    if (subcategory && this.emissionFactors.materials[subcategory]) {
      materialType = subcategory;
    } else {
      // Try to detect from description
      for (const [material, factor] of Object.entries(this.emissionFactors.materials)) {
        if (description.toLowerCase().includes(material)) {
          materialType = material;
          break;
        }
      }
    }
    
    const baseEmissions = amount * this.emissionFactors.materials[materialType];
    
    // Add transportation factor if supplier distance is mentioned
    if (description) {
      const distanceMatch = description.match(/(\d+)\s*km/i);
      if (distanceMatch) {
        const distance = parseInt(distanceMatch[1]);
        const transportFactor = distance * 0.0001; // 0.1 kg CO2 per km per kg
        return baseEmissions + (amount * transportFactor);
      }
    }
    
    return baseEmissions;
  }

  calculateEquipmentEmissions(transaction) {
    const { amount, description } = transaction;
    
    // Equipment emissions are typically embedded in manufacturing
    // Estimate based on equipment type and age
    let factor = 0.5; // Base factor
    
    if (description.toLowerCase().includes('old') || description.toLowerCase().includes('used')) {
      factor *= 1.5; // Old equipment is less efficient
    }
    if (description.toLowerCase().includes('energy efficient') || description.toLowerCase().includes('modern')) {
      factor *= 0.7; // Modern equipment is more efficient
    }
    
    return amount * factor;
  }

  calculateMaintenanceEmissions(transaction) {
    const { amount, description } = transaction;
    
    // Maintenance emissions are typically low
    let factor = 0.1;
    
    if (description.toLowerCase().includes('major') || description.toLowerCase().includes('overhaul')) {
      factor = 0.3;
    }
    
    return amount * factor;
  }

  calculateGenericEmissions(transaction) {
    const { amount, category } = transaction;
    
    // Generic emission factor based on category
    const genericFactors = {
      'other': 0.2,
      'utilities': 0.3,
      'services': 0.1
    };
    
    const factor = genericFactors[category] || 0.2;
    return amount * factor;
  }

  calculateMSMECarbonFootprint(msmeData, transactions) {
    const assessment = {
      totalCO2Emissions: 0,
      breakdown: {
        energy: { electricity: 0, fuel: 0, total: 0 },
        water: { consumption: 0, co2Emissions: 0 },
        waste: { solid: 0, hazardous: 0, total: 0 },
        transportation: { distance: 0, co2Emissions: 0, vehicleCount: 0, fuelEfficiency: 0 },
        materials: { consumption: 0, co2Emissions: 0, type: 'mixed', supplierDistance: 0 },
        manufacturing: { productionVolume: 0, co2Emissions: 0, efficiency: 0, equipmentAge: 0 }
      },
      // Add business domain information
      businessDomain: msmeData.businessDomain || 'other',
      domainFactors: msmeData.businessDomain ? this.domainFactors[msmeData.businessDomain] : null,
      // ESG Scope breakdown
      esgScopes: {
        scope1: {
          total: 0,
          breakdown: {
            directFuel: 0,
            directTransport: 0,
            directManufacturing: 0,
            fugitiveEmissions: 0,
            processEmissions: 0,
            stationaryCombustion: 0,
            mobileCombustion: 0
          },
          description: 'Direct emissions from owned or controlled sources',
          parameters: {
            fuelTypes: {},
            vehicleTypes: {},
            processTypes: {},
            emissionFactors: {}
          }
        },
        scope2: {
          total: 0,
          breakdown: {
            electricity: 0,
            heating: 0,
            cooling: 0,
            steam: 0,
            districtHeating: 0,
            districtCooling: 0
          },
          description: 'Indirect emissions from purchased energy',
          parameters: {
            energySources: {},
            gridFactors: {},
            renewablePercentage: 0,
            locationFactors: {}
          }
        },
        scope3: {
          total: 0,
          breakdown: {
            purchasedGoods: 0,
            transportation: 0,
            wasteDisposal: 0,
            businessTravel: 0,
            employeeCommuting: 0,
            leasedAssets: 0,
            investments: 0,
            franchises: 0,
            processingSoldProducts: 0,
            useSoldProducts: 0,
            endLifeDisposal: 0,
            other: 0
          },
          description: 'All other indirect emissions in the value chain',
          parameters: {
            supplyChainFactors: {},
            transportationModes: {},
            wasteTypes: {},
            productLifecycle: {}
          }
        },
        scope4: {
          total: 0,
          breakdown: {
            avoidedEmissions: 0,
            carbonOffsets: 0,
            renewableEnergyCredits: 0,
            energyEfficiency: 0,
            wasteReduction: 0,
            sustainableProducts: 0,
            greenTransportation: 0,
            carbonCapture: 0
          },
          description: 'Avoided emissions and positive climate impact',
          parameters: {
            offsetTypes: {},
            renewableEnergyTypes: {},
            efficiencyMeasures: {},
            carbonCaptureMethods: {}
          }
        }
      },
      carbonScore: 0,
      recommendations: []
    };

    // Process transactions by category
    transactions.forEach(transaction => {
      const carbonData = this.calculateTransactionCarbonFootprint(transaction);
      transaction.carbonFootprint = carbonData;
      
      assessment.totalCO2Emissions += carbonData.co2Emissions;
      
      // Update breakdown
      this.updateBreakdown(assessment.breakdown, transaction, carbonData.co2Emissions);
      
      // Update ESG scope breakdown
      this.updateESGScopes(assessment.esgScopes, transaction, carbonData.co2Emissions);
    });

    // Calculate carbon score
    assessment.carbonScore = this.calculateCarbonScore(assessment, msmeData);
    
    // Generate recommendations
    assessment.recommendations = this.generateRecommendations(assessment, msmeData);

    return assessment;
  }

  updateBreakdown(breakdown, transaction, co2Emissions) {
    const { category, amount, subcategory } = transaction;
    
    switch (category) {
      case 'energy':
        if (subcategory === 'renewable' || subcategory === 'grid') {
          breakdown.energy.electricity += co2Emissions;
        } else {
          breakdown.energy.fuel += co2Emissions;
        }
        breakdown.energy.total += co2Emissions;
        break;
        
      case 'water':
        breakdown.water.consumption += amount;
        breakdown.water.co2Emissions += co2Emissions;
        break;
        
      case 'waste_management':
        if (subcategory === 'hazardous') {
          breakdown.waste.hazardous += co2Emissions;
        } else {
          breakdown.waste.solid += co2Emissions;
        }
        breakdown.waste.total += co2Emissions;
        break;
        
      case 'transportation':
        breakdown.transportation.co2Emissions += co2Emissions;
        breakdown.transportation.vehicleCount += 1;
        break;
        
      case 'raw_materials':
        breakdown.materials.consumption += amount;
        breakdown.materials.co2Emissions += co2Emissions;
        if (subcategory) {
          breakdown.materials.type = subcategory;
        }
        break;
        
      case 'equipment':
      case 'maintenance':
        breakdown.manufacturing.co2Emissions += co2Emissions;
        break;
    }
  }

  updateESGScopes(esgScopes, transaction, co2Emissions) {
    const { category, subcategory, description } = transaction;
    
    // Scope 1: Direct emissions from owned or controlled sources
    if (this.isScope1Emission(transaction)) {
      esgScopes.scope1.total += co2Emissions;
      
      if (category === 'energy' && subcategory !== 'renewable' && subcategory !== 'grid') {
        esgScopes.scope1.breakdown.directFuel += co2Emissions;
        this.updateScope1Parameters(esgScopes.scope1.parameters, transaction, co2Emissions, 'fuel');
      } else if (category === 'transportation') {
        esgScopes.scope1.breakdown.directTransport += co2Emissions;
        this.updateScope1Parameters(esgScopes.scope1.parameters, transaction, co2Emissions, 'transport');
      } else if (category === 'equipment' || category === 'maintenance') {
        esgScopes.scope1.breakdown.directManufacturing += co2Emissions;
        this.updateScope1Parameters(esgScopes.scope1.parameters, transaction, co2Emissions, 'manufacturing');
      } else if (description && description.toLowerCase().includes('fugitive')) {
        esgScopes.scope1.breakdown.fugitiveEmissions += co2Emissions;
      } else if (description && description.toLowerCase().includes('process')) {
        esgScopes.scope1.breakdown.processEmissions += co2Emissions;
      } else if (description && description.toLowerCase().includes('stationary')) {
        esgScopes.scope1.breakdown.stationaryCombustion += co2Emissions;
      } else if (description && description.toLowerCase().includes('mobile')) {
        esgScopes.scope1.breakdown.mobileCombustion += co2Emissions;
      }
    }
    
    // Scope 2: Indirect emissions from purchased energy
    else if (this.isScope2Emission(transaction)) {
      esgScopes.scope2.total += co2Emissions;
      
      if (category === 'energy' && (subcategory === 'grid' || subcategory === 'renewable')) {
        esgScopes.scope2.breakdown.electricity += co2Emissions;
        this.updateScope2Parameters(esgScopes.scope2.parameters, transaction, co2Emissions, 'electricity');
      } else if (description && description.toLowerCase().includes('heating')) {
        esgScopes.scope2.breakdown.heating += co2Emissions;
        this.updateScope2Parameters(esgScopes.scope2.parameters, transaction, co2Emissions, 'heating');
      } else if (description && description.toLowerCase().includes('cooling')) {
        esgScopes.scope2.breakdown.cooling += co2Emissions;
        this.updateScope2Parameters(esgScopes.scope2.parameters, transaction, co2Emissions, 'cooling');
      } else if (description && description.toLowerCase().includes('steam')) {
        esgScopes.scope2.breakdown.steam += co2Emissions;
        this.updateScope2Parameters(esgScopes.scope2.parameters, transaction, co2Emissions, 'steam');
      } else if (description && description.toLowerCase().includes('district heating')) {
        esgScopes.scope2.breakdown.districtHeating += co2Emissions;
      } else if (description && description.toLowerCase().includes('district cooling')) {
        esgScopes.scope2.breakdown.districtCooling += co2Emissions;
      }
    }
    
    // Scope 3: All other indirect emissions
    else if (!this.isScope4Emission(transaction)) {
      esgScopes.scope3.total += co2Emissions;
      
      if (category === 'raw_materials') {
        esgScopes.scope3.breakdown.purchasedGoods += co2Emissions;
        this.updateScope3Parameters(esgScopes.scope3.parameters, transaction, co2Emissions, 'purchasedGoods');
      } else if (category === 'transportation' && !this.isScope1Emission(transaction)) {
        esgScopes.scope3.breakdown.transportation += co2Emissions;
        this.updateScope3Parameters(esgScopes.scope3.parameters, transaction, co2Emissions, 'transportation');
      } else if (category === 'waste_management') {
        esgScopes.scope3.breakdown.wasteDisposal += co2Emissions;
        this.updateScope3Parameters(esgScopes.scope3.parameters, transaction, co2Emissions, 'wasteDisposal');
      } else if (description && description.toLowerCase().includes('travel')) {
        esgScopes.scope3.breakdown.businessTravel += co2Emissions;
      } else if (description && description.toLowerCase().includes('commuting')) {
        esgScopes.scope3.breakdown.employeeCommuting += co2Emissions;
      } else if (description && description.toLowerCase().includes('lease')) {
        esgScopes.scope3.breakdown.leasedAssets += co2Emissions;
      } else if (description && description.toLowerCase().includes('investment')) {
        esgScopes.scope3.breakdown.investments += co2Emissions;
      } else if (description && description.toLowerCase().includes('franchise')) {
        esgScopes.scope3.breakdown.franchises += co2Emissions;
      } else if (description && description.toLowerCase().includes('processing')) {
        esgScopes.scope3.breakdown.processingSoldProducts += co2Emissions;
      } else if (description && description.toLowerCase().includes('use of sold')) {
        esgScopes.scope3.breakdown.useSoldProducts += co2Emissions;
      } else if (description && description.toLowerCase().includes('end life')) {
        esgScopes.scope3.breakdown.endLifeDisposal += co2Emissions;
      } else {
        esgScopes.scope3.breakdown.other += co2Emissions;
      }
    }
    
    // Scope 4: Avoided emissions and positive climate impact
    else if (this.isScope4Emission(transaction)) {
      const avoidedEmissions = this.calculateAvoidedEmissions(transaction);
      esgScopes.scope4.total += avoidedEmissions;
      
      if (description && description.toLowerCase().includes('renewable')) {
        esgScopes.scope4.breakdown.renewableEnergyCredits += avoidedEmissions;
        this.updateScope4Parameters(esgScopes.scope4.parameters, transaction, avoidedEmissions, 'renewableEnergy');
      } else if (description && description.toLowerCase().includes('efficiency')) {
        esgScopes.scope4.breakdown.energyEfficiency += avoidedEmissions;
        this.updateScope4Parameters(esgScopes.scope4.parameters, transaction, avoidedEmissions, 'energyEfficiency');
      } else if (description && description.toLowerCase().includes('waste reduction')) {
        esgScopes.scope4.breakdown.wasteReduction += avoidedEmissions;
        this.updateScope4Parameters(esgScopes.scope4.parameters, transaction, avoidedEmissions, 'wasteReduction');
      } else if (description && description.toLowerCase().includes('sustainable transport')) {
        esgScopes.scope4.breakdown.greenTransportation += avoidedEmissions;
        this.updateScope4Parameters(esgScopes.scope4.parameters, transaction, avoidedEmissions, 'sustainableTransport');
      } else if (description && description.toLowerCase().includes('carbon capture')) {
        esgScopes.scope4.breakdown.carbonCapture += avoidedEmissions;
        this.updateScope4Parameters(esgScopes.scope4.parameters, transaction, avoidedEmissions, 'carbonCapture');
      } else if (description && description.toLowerCase().includes('offset')) {
        esgScopes.scope4.breakdown.carbonOffsets += avoidedEmissions;
      } else {
        esgScopes.scope4.breakdown.avoidedEmissions += avoidedEmissions;
      }
    }
  }

  isScope1Emission(transaction) {
    const { category, subcategory, description } = transaction;
    
    // Direct fuel combustion
    if (category === 'energy' && subcategory !== 'renewable' && subcategory !== 'grid') {
      return true;
    }
    
    // Company-owned vehicles
    if (category === 'transportation' && description && 
        (description.toLowerCase().includes('company') || 
         description.toLowerCase().includes('owned') ||
         description.toLowerCase().includes('fleet'))) {
      return true;
    }
    
    // Direct manufacturing processes
    if (category === 'equipment' || category === 'maintenance') {
      return true;
    }
    
    // Fugitive emissions
    if (description && description.toLowerCase().includes('fugitive')) {
      return true;
    }
    
    return false;
  }

  isScope2Emission(transaction) {
    const { category, subcategory } = transaction;
    
    // Purchased electricity, heating, cooling, steam
    if (category === 'energy' && (subcategory === 'grid' || subcategory === 'renewable')) {
      return true;
    }
    
    return false;
  }

  calculateCarbonScore(assessment, msmeData) {
    let score = 100; // Start with perfect score
    
    // Apply business domain-specific scoring adjustments
    const domainAdjustments = this.getDomainScoreAdjustments(msmeData.businessDomain, assessment);
    score += domainAdjustments;
    
    // Penalize high emissions
    const emissionPenalty = Math.min(50, assessment.totalCO2Emissions / 100);
    score -= emissionPenalty;
    
    // Bonus for environmental controls
    if (msmeData.environmentalCompliance.hasEnvironmentalClearance) score += 5;
    if (msmeData.environmentalCompliance.hasPollutionControlBoard) score += 5;
    if (msmeData.environmentalCompliance.hasWasteManagement) score += 5;
    
    // Bonus for renewable energy usage
    const renewableRatio = assessment.breakdown.energy.electricity / 
      (assessment.breakdown.energy.electricity + assessment.breakdown.energy.fuel);
    if (renewableRatio > 0.5) score += 10;
    
    // Bonus for waste recycling
    const recyclingRatio = assessment.breakdown.waste.solid / assessment.breakdown.waste.total;
    if (recyclingRatio > 0.7) score += 5;
    
    // Domain-specific penalties and bonuses
    if (msmeData.businessDomain === 'logistics' && assessment.breakdown.transportation.co2Emissions > 300) {
      score -= 20; // Logistics companies should optimize transport
    } else if (msmeData.businessDomain === 'export_import' && assessment.breakdown.transportation.co2Emissions > 250) {
      score -= 15; // Export/Import should optimize international shipping
    } else if (msmeData.businessDomain === 'e_commerce' && assessment.breakdown.transportation.co2Emissions > 200) {
      score -= 15; // E-commerce should optimize last-mile delivery
    } else if (msmeData.businessDomain === 'manufacturing' && assessment.breakdown.energy.total > 800) {
      score -= 15; // Manufacturing should focus on energy efficiency
    } else if (msmeData.businessDomain === 'construction' && assessment.breakdown.materials.co2Emissions > 500) {
      score -= 20; // Construction should use sustainable materials
    } else if (msmeData.businessDomain === 'automotive' && assessment.breakdown.materials.co2Emissions > 400) {
      score -= 18; // Automotive should use lightweight materials
    } else if (msmeData.businessDomain === 'textiles' && assessment.breakdown.energy.total > 600) {
      score -= 12; // Textiles should optimize water and energy use
    } else if (msmeData.businessDomain === 'consulting' && assessment.breakdown.transportation.co2Emissions > 50) {
      score -= 10; // Consulting should minimize travel
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getDomainScoreAdjustments(businessDomain, assessment) {
    const adjustments = {
      manufacturing: -5, // Manufacturing typically has higher emissions
      trading: 0, // Neutral for trading
      services: 5, // Bonus for service-based low emissions
      export_import: -3, // Slightly penalized for high transport emissions
      retail: 0, // Neutral for retail
      wholesale: 0, // Neutral for wholesale
      e_commerce: -2, // Slightly penalized for last-mile delivery
      consulting: 10, // Bonus for minimal resource consumption
      logistics: -8, // Penalized for high transport emissions
      agriculture: 3, // Bonus for natural processes
      handicrafts: 5, // Bonus for traditional, low-impact methods
      food_processing: -3, // Penalized for high energy/water use
      textiles: -5, // Penalized for high water/energy consumption
      electronics: -2, // Slightly penalized for material intensity
      automotive: -8, // Heavily penalized for high material/energy use
      construction: -10, // Heavily penalized for very high material consumption
      healthcare: 2, // Slight bonus for essential services
      education: 8, // Bonus for low resource consumption
      tourism: 0, // Neutral for tourism
      other: 0 // Neutral for other
    };
    
    return adjustments[businessDomain] || 0;
  }

  generateRecommendations(assessment, msmeData) {
    const recommendations = [];
    
    // Domain-specific recommendations
    const domainRecommendations = this.getDomainSpecificRecommendations(msmeData.businessDomain, assessment);
    recommendations.push(...domainRecommendations);
    
    // Energy recommendations
    if (assessment.breakdown.energy.total > 500) {
      recommendations.push({
        category: 'energy',
        title: 'Switch to Renewable Energy',
        description: 'Consider installing solar panels or purchasing renewable energy credits',
        priority: 'high',
        potentialCO2Reduction: assessment.breakdown.energy.total * 0.3,
        implementationCost: 50000,
        paybackPeriod: 24
      });
    }
    
    // Waste management recommendations
    if (assessment.breakdown.waste.total > 100) {
      recommendations.push({
        category: 'waste',
        title: 'Improve Waste Recycling',
        description: 'Implement comprehensive waste segregation and recycling program',
        priority: 'medium',
        potentialCO2Reduction: assessment.breakdown.waste.total * 0.4,
        implementationCost: 10000,
        paybackPeriod: 12
      });
    }
    
    // Transportation recommendations
    if (assessment.breakdown.transportation.co2Emissions > 50) {
      recommendations.push({
        category: 'transportation',
        title: 'Optimize Transportation',
        description: 'Use fuel-efficient vehicles and optimize delivery routes',
        priority: 'medium',
        potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.2,
        implementationCost: 20000,
        paybackPeriod: 18
      });
    }
    
    // Material sourcing recommendations
    if (assessment.breakdown.materials.co2Emissions > 200) {
      recommendations.push({
        category: 'materials',
        title: 'Source Local Materials',
        description: 'Reduce transportation emissions by sourcing materials locally',
        priority: 'low',
        potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.15,
        implementationCost: 5000,
        paybackPeriod: 6
      });
    }
    
    return recommendations;
  }

  getDomainSpecificRecommendations(businessDomain, assessment) {
    const recommendations = [];
    
    switch (businessDomain) {
      case 'manufacturing':
        if (assessment.breakdown.energy.total > 500) {
          recommendations.push({
            category: 'energy',
            title: 'Manufacturing Energy Efficiency',
            description: 'Implement energy-efficient manufacturing processes and equipment upgrades',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.energy.total * 0.3,
            implementationCost: 75000,
            paybackPeriod: 24
          });
        }
        if (assessment.breakdown.materials.co2Emissions > 200) {
          recommendations.push({
            category: 'materials',
            title: 'Sustainable Material Sourcing',
            description: 'Source eco-friendly raw materials and implement circular economy practices',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.25,
            implementationCost: 50000,
            paybackPeriod: 18
          });
        }
        break;
        
      case 'trading':
        if (assessment.breakdown.transportation.co2Emissions > 100) {
          recommendations.push({
            category: 'transportation',
            title: 'Trading Logistics Optimization',
            description: 'Optimize supply chain routes and implement consolidated shipping',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.3,
            implementationCost: 25000,
            paybackPeriod: 12
          });
        }
        break;
        
      case 'services':
        if (assessment.breakdown.energy.total > 200) {
          recommendations.push({
            category: 'energy',
            title: 'Service Industry Energy Efficiency',
            description: 'Implement smart office solutions and remote work policies',
            priority: 'medium',
            potentialCO2Reduction: assessment.breakdown.energy.total * 0.4,
            implementationCost: 20000,
            paybackPeriod: 15
          });
        }
        break;
        
      case 'export_import':
        recommendations.push({
          category: 'transportation',
          title: 'Green Export/Import Operations',
          description: 'Use carbon-neutral shipping options and optimize international logistics',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.35,
          implementationCost: 40000,
          paybackPeriod: 18
        });
        break;
        
      case 'retail':
        if (assessment.breakdown.materials.co2Emissions > 150) {
          recommendations.push({
            category: 'materials',
            title: 'Sustainable Retail Packaging',
            description: 'Switch to biodegradable packaging and reduce single-use plastics',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.4,
            implementationCost: 30000,
            paybackPeriod: 12
          });
        }
        break;
        
      case 'wholesale':
        if (assessment.breakdown.transportation.co2Emissions > 150) {
          recommendations.push({
            category: 'transportation',
            title: 'Wholesale Distribution Optimization',
            description: 'Implement bulk shipping and route optimization for wholesale operations',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.25,
            implementationCost: 35000,
            paybackPeriod: 15
          });
        }
        break;
        
      case 'e_commerce':
        if (assessment.breakdown.transportation.co2Emissions > 120) {
          recommendations.push({
            category: 'transportation',
            title: 'E-commerce Last-Mile Optimization',
            description: 'Implement electric delivery vehicles and carbon-neutral shipping options',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.3,
            implementationCost: 45000,
            paybackPeriod: 20
          });
        }
        break;
        
      case 'consulting':
        recommendations.push({
          category: 'energy',
          title: 'Digital-First Consulting',
          description: 'Maximize virtual meetings and digital document management',
          priority: 'medium',
          potentialCO2Reduction: assessment.breakdown.energy.total * 0.5,
          implementationCost: 10000,
          paybackPeriod: 6
        });
        break;
        
      case 'logistics':
        recommendations.push({
          category: 'transportation',
          title: 'Green Logistics Fleet',
          description: 'Transition to electric or hybrid vehicles and optimize delivery routes',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.4,
          implementationCost: 100000,
          paybackPeriod: 30
        });
        break;
        
      case 'agriculture':
        recommendations.push({
          category: 'energy',
          title: 'Sustainable Agriculture Practices',
          description: 'Implement solar irrigation and organic farming techniques',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.energy.total * 0.3,
          implementationCost: 60000,
          paybackPeriod: 24
        });
        break;
        
      case 'handicrafts':
        recommendations.push({
          category: 'materials',
          title: 'Traditional Craft Sustainability',
          description: 'Use locally sourced, sustainable materials and traditional techniques',
          priority: 'medium',
          potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.2,
          implementationCost: 15000,
          paybackPeriod: 12
        });
        break;
        
      case 'food_processing':
        if (assessment.breakdown.energy.total > 300) {
          recommendations.push({
            category: 'energy',
            title: 'Food Processing Energy Efficiency',
            description: 'Implement energy-efficient processing equipment and waste-to-energy systems',
            priority: 'high',
            potentialCO2Reduction: assessment.breakdown.energy.total * 0.35,
            implementationCost: 80000,
            paybackPeriod: 20
          });
        }
        break;
        
      case 'textiles':
        recommendations.push({
          category: 'materials',
          title: 'Sustainable Textile Production',
          description: 'Use organic cotton and implement water recycling systems',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.3,
          implementationCost: 70000,
          paybackPeriod: 24
        });
        break;
        
      case 'electronics':
        recommendations.push({
          category: 'materials',
          title: 'Electronics Circular Economy',
          description: 'Implement e-waste recycling and sustainable component sourcing',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.25,
          implementationCost: 50000,
          paybackPeriod: 18
        });
        break;
        
      case 'automotive':
        recommendations.push({
          category: 'materials',
          title: 'Green Automotive Manufacturing',
          description: 'Use lightweight materials and implement electric vehicle components',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.4,
          implementationCost: 150000,
          paybackPeriod: 36
        });
        break;
        
      case 'construction':
        recommendations.push({
          category: 'materials',
          title: 'Sustainable Construction Materials',
          description: 'Use green building materials and implement waste reduction practices',
          priority: 'high',
          potentialCO2Reduction: assessment.breakdown.materials.co2Emissions * 0.35,
          implementationCost: 100000,
          paybackPeriod: 30
        });
        break;
        
      case 'healthcare':
        recommendations.push({
          category: 'energy',
          title: 'Healthcare Energy Efficiency',
          description: 'Implement energy-efficient medical equipment and smart building systems',
          priority: 'medium',
          potentialCO2Reduction: assessment.breakdown.energy.total * 0.25,
          implementationCost: 60000,
          paybackPeriod: 24
        });
        break;
        
      case 'education':
        recommendations.push({
          category: 'energy',
          title: 'Green Campus Initiative',
          description: 'Implement solar power and digital learning platforms',
          priority: 'medium',
          potentialCO2Reduction: assessment.breakdown.energy.total * 0.4,
          implementationCost: 40000,
          paybackPeriod: 18
        });
        break;
        
      case 'tourism':
        recommendations.push({
          category: 'transportation',
          title: 'Sustainable Tourism Practices',
          description: 'Promote eco-tourism and carbon-neutral travel options',
          priority: 'medium',
          potentialCO2Reduction: assessment.breakdown.transportation.co2Emissions * 0.2,
          implementationCost: 25000,
          paybackPeriod: 15
        });
        break;
    }
    
    return recommendations;
  }

  // Calculate carbon savings for MSMEs
  calculateCarbonSavings(msmeData, currentAssessment, previousAssessment = null) {
    const savings = {
      totalSavings: 0,
      periodSavings: 0,
      categorySavings: {
        energy: 0,
        water: 0,
        waste: 0,
        transportation: 0,
        materials: 0,
        manufacturing: 0
      },
      implementedRecommendations: 0,
      potentialSavings: 0,
      savingsPercentage: 0,
      benchmarkComparison: {
        industryAverage: 0,
        bestInClass: 0,
        performance: 'average'
      },
      trends: {
        monthly: [],
        quarterly: [],
        yearly: []
      },
      achievements: [],
      nextMilestones: []
    };

    // Calculate period savings if previous assessment exists
    if (previousAssessment) {
      savings.periodSavings = previousAssessment.totalCO2Emissions - currentAssessment.totalCO2Emissions;
      savings.savingsPercentage = previousAssessment.totalCO2Emissions > 0 ? 
        (savings.periodSavings / previousAssessment.totalCO2Emissions) * 100 : 0;
    }

    // Calculate category-wise savings
    if (previousAssessment) {
      Object.keys(savings.categorySavings).forEach(category => {
        const current = currentAssessment.breakdown[category]?.total || 0;
        const previous = previousAssessment.breakdown[category]?.total || 0;
        savings.categorySavings[category] = previous - current;
      });
    }

    // Calculate total savings (sum of all category savings)
    savings.totalSavings = Object.values(savings.categorySavings).reduce((sum, val) => sum + val, 0);

    // Count implemented recommendations
    savings.implementedRecommendations = currentAssessment.recommendations.filter(rec => rec.isImplemented).length;

    // Calculate potential savings from unimplemented recommendations
    savings.potentialSavings = currentAssessment.recommendations
      .filter(rec => !rec.isImplemented)
      .reduce((sum, rec) => sum + (rec.potentialCO2Reduction || 0), 0);

    // Set industry benchmarks based on company type and industry
    const industryBenchmarks = this.getIndustryBenchmarks(msmeData.industry, msmeData.companyType);
    savings.benchmarkComparison = {
      industryAverage: industryBenchmarks.average,
      bestInClass: industryBenchmarks.bestInClass,
      performance: this.calculatePerformanceLevel(currentAssessment.totalCO2Emissions, industryBenchmarks)
    };

    // Generate achievements based on savings
    savings.achievements = this.generateAchievements(savings, currentAssessment, msmeData);

    // Generate next milestones
    savings.nextMilestones = this.generateNextMilestones(savings, currentAssessment, msmeData);

    return savings;
  }

  getIndustryBenchmarks(industry, companyType) {
    // Industry-specific CO2 emissions per unit of production (kg CO2 per ₹1000 turnover)
    const industryFactors = {
      manufacturing: { average: 2.5, bestInClass: 1.2 },
      textiles: { average: 3.2, bestInClass: 1.8 },
      food: { average: 1.8, bestInClass: 1.0 },
      chemicals: { average: 4.5, bestInClass: 2.8 },
      electronics: { average: 2.8, bestInClass: 1.5 },
      automotive: { average: 3.8, bestInClass: 2.2 },
      pharmaceuticals: { average: 3.5, bestInClass: 2.0 }
    };

    // Company size multipliers
    const sizeMultipliers = {
      micro: 1.2,
      small: 1.0,
      medium: 0.8
    };

    const baseBenchmark = industryFactors[industry] || industryFactors.manufacturing;
    const sizeMultiplier = sizeMultipliers[companyType] || 1.0;

    return {
      average: baseBenchmark.average * sizeMultiplier,
      bestInClass: baseBenchmark.bestInClass * sizeMultiplier
    };
  }

  calculatePerformanceLevel(currentEmissions, benchmarks) {
    const efficiency = currentEmissions / benchmarks.average;
    
    if (efficiency <= 0.6) return 'excellent';
    if (efficiency <= 0.8) return 'good';
    if (efficiency <= 1.0) return 'average';
    if (efficiency <= 1.2) return 'below_average';
    return 'poor';
  }

  generateAchievements(savings, assessment, msmeData) {
    const achievements = [];

    // Carbon reduction achievements
    if (savings.savingsPercentage >= 20) {
      achievements.push({
        type: 'carbon_reduction',
        title: 'Carbon Reduction Champion',
        description: `Achieved ${savings.savingsPercentage.toFixed(1)}% reduction in carbon emissions`,
        level: 'gold',
        co2Saved: savings.periodSavings
      });
    } else if (savings.savingsPercentage >= 10) {
      achievements.push({
        type: 'carbon_reduction',
        title: 'Green Progress',
        description: `Achieved ${savings.savingsPercentage.toFixed(1)}% reduction in carbon emissions`,
        level: 'silver',
        co2Saved: savings.periodSavings
      });
    }

    // Recommendation implementation achievements
    if (savings.implementedRecommendations >= 5) {
      achievements.push({
        type: 'implementation',
        title: 'Sustainability Leader',
        description: `Implemented ${savings.implementedRecommendations} sustainability recommendations`,
        level: 'gold'
      });
    } else if (savings.implementedRecommendations >= 3) {
      achievements.push({
        type: 'implementation',
        title: 'Action Taker',
        description: `Implemented ${savings.implementedRecommendations} sustainability recommendations`,
        level: 'silver'
      });
    }

    // Carbon score achievements
    if (assessment.carbonScore >= 90) {
      achievements.push({
        type: 'score',
        title: 'Carbon Excellence',
        description: `Achieved carbon score of ${assessment.carbonScore}`,
        level: 'gold'
      });
    } else if (assessment.carbonScore >= 80) {
      achievements.push({
        type: 'score',
        title: 'Green Achiever',
        description: `Achieved carbon score of ${assessment.carbonScore}`,
        level: 'silver'
      });
    }

    return achievements;
  }

  generateNextMilestones(savings, assessment, msmeData) {
    const milestones = [];

    // Carbon reduction milestones
    const nextReductionTarget = Math.max(5, Math.ceil(savings.savingsPercentage / 5) * 5 + 5);
    milestones.push({
      type: 'carbon_reduction',
      title: `${nextReductionTarget}% Carbon Reduction`,
      description: `Aim for ${nextReductionTarget}% reduction in next assessment`,
      targetValue: nextReductionTarget,
      currentValue: savings.savingsPercentage,
      priority: 'high'
    });

    // Recommendation implementation milestones
    const nextRecTarget = savings.implementedRecommendations + 2;
    milestones.push({
      type: 'recommendations',
      title: `Implement ${nextRecTarget} Recommendations`,
      description: `Implement ${nextRecTarget} sustainability recommendations`,
      targetValue: nextRecTarget,
      currentValue: savings.implementedRecommendations,
      priority: 'medium'
    });

    // Carbon score milestones
    const nextScoreTarget = Math.min(100, assessment.carbonScore + 10);
    if (nextScoreTarget > assessment.carbonScore) {
      milestones.push({
        type: 'score',
        title: `Carbon Score ${nextScoreTarget}`,
        description: `Achieve carbon score of ${nextScoreTarget}`,
        targetValue: nextScoreTarget,
        currentValue: assessment.carbonScore,
        priority: 'medium'
      });
    }

    return milestones;
  }

  updateScope1Parameters(parameters, transaction, co2Emissions, type) {
    if (!parameters[type]) {
      parameters[type] = {
        totalEmissions: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalAmount: 0
      };
    }
    
    parameters[type].totalEmissions += co2Emissions;
    parameters[type].transactionCount += 1;
    parameters[type].totalAmount += transaction.amount;
    parameters[type].averageAmount = parameters[type].totalAmount / parameters[type].transactionCount;
  }

  updateScope2Parameters(parameters, transaction, co2Emissions, type) {
    if (!parameters[type]) {
      parameters[type] = {
        totalEmissions: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalAmount: 0
      };
    }
    
    parameters[type].totalEmissions += co2Emissions;
    parameters[type].transactionCount += 1;
    parameters[type].totalAmount += transaction.amount;
    parameters[type].averageAmount = parameters[type].totalAmount / parameters[type].transactionCount;
  }

  isScope4Emission(transaction) {
    // Scope 4 emissions are typically avoided emissions or carbon credits
    // For now, return false as we don't have scope 4 emissions in our system
    return false;
  }

  updateScope3Parameters(parameters, transaction, co2Emissions, type) {
    if (!parameters[type]) {
      parameters[type] = {
        totalEmissions: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalAmount: 0
      };
    }
    
    parameters[type].totalEmissions += co2Emissions;
    parameters[type].transactionCount += 1;
    parameters[type].totalAmount += transaction.amount;
    parameters[type].averageAmount = parameters[type].totalAmount / parameters[type].transactionCount;
  }

  updateScope4Parameters(parameters, transaction, avoidedEmissions, type) {
    if (!parameters[type]) {
      parameters[type] = {
        totalAvoidedEmissions: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalAmount: 0
      };
    }
    
    parameters[type].totalAvoidedEmissions += avoidedEmissions;
    parameters[type].transactionCount += 1;
    parameters[type].totalAmount += transaction.amount;
    parameters[type].averageAmount = parameters[type].totalAmount / parameters[type].transactionCount;
  }
}

module.exports = new CarbonCalculationService();