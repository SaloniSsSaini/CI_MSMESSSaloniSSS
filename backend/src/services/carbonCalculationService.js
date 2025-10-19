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
      pharmaceuticals: 1.4
    };
  }

  calculateTransactionCarbonFootprint(transaction) {
    const { category, amount, subcategory, vendor, sustainability } = transaction;
    
    let co2Emissions = 0;
    let emissionFactor = 0;
    let calculationMethod = 'transaction_analysis';
    
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
    
    emissionFactor = co2Emissions / (amount || 1);
    
    return {
      co2Emissions: Math.round(co2Emissions * 100) / 100,
      emissionFactor: Math.round(emissionFactor * 1000) / 1000,
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
      if (description.toLowerCase().includes('solar') || description.toLowerCase().includes('wind')) {
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
    } else if (description.toLowerCase().includes('hazardous')) {
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
    
    // Estimate fuel consumption based on amount (assuming fuel cost)
    const fuelPrice = 80; // Average diesel price per liter
    const fuelConsumption = amount / fuelPrice;
    
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
    const distanceMatch = description.match(/(\d+)\s*km/i);
    if (distanceMatch) {
      const distance = parseInt(distanceMatch[1]);
      const transportFactor = distance * 0.0001; // 0.1 kg CO2 per km per kg
      return baseEmissions + (amount * transportFactor);
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
      // ESG Scope breakdown
      esgScopes: {
        scope1: {
          total: 0,
          breakdown: {
            directFuel: 0,
            directTransport: 0,
            directManufacturing: 0,
            fugitiveEmissions: 0
          },
          description: 'Direct emissions from owned or controlled sources'
        },
        scope2: {
          total: 0,
          breakdown: {
            electricity: 0,
            heating: 0,
            cooling: 0,
            steam: 0
          },
          description: 'Indirect emissions from purchased energy'
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
            other: 0
          },
          description: 'All other indirect emissions in the value chain'
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
      } else if (category === 'transportation') {
        esgScopes.scope1.breakdown.directTransport += co2Emissions;
      } else if (category === 'equipment' || category === 'maintenance') {
        esgScopes.scope1.breakdown.directManufacturing += co2Emissions;
      } else if (description && description.toLowerCase().includes('fugitive')) {
        esgScopes.scope1.breakdown.fugitiveEmissions += co2Emissions;
      }
    }
    
    // Scope 2: Indirect emissions from purchased energy
    else if (this.isScope2Emission(transaction)) {
      esgScopes.scope2.total += co2Emissions;
      
      if (category === 'energy' && (subcategory === 'grid' || subcategory === 'renewable')) {
        esgScopes.scope2.breakdown.electricity += co2Emissions;
      } else if (description && description.toLowerCase().includes('heating')) {
        esgScopes.scope2.breakdown.heating += co2Emissions;
      } else if (description && description.toLowerCase().includes('cooling')) {
        esgScopes.scope2.breakdown.cooling += co2Emissions;
      } else if (description && description.toLowerCase().includes('steam')) {
        esgScopes.scope2.breakdown.steam += co2Emissions;
      }
    }
    
    // Scope 3: All other indirect emissions
    else {
      esgScopes.scope3.total += co2Emissions;
      
      if (category === 'raw_materials') {
        esgScopes.scope3.breakdown.purchasedGoods += co2Emissions;
      } else if (category === 'transportation' && !this.isScope1Emission(transaction)) {
        esgScopes.scope3.breakdown.transportation += co2Emissions;
      } else if (category === 'waste_management') {
        esgScopes.scope3.breakdown.wasteDisposal += co2Emissions;
      } else if (description && description.toLowerCase().includes('travel')) {
        esgScopes.scope3.breakdown.businessTravel += co2Emissions;
      } else if (description && description.toLowerCase().includes('commuting')) {
        esgScopes.scope3.breakdown.employeeCommuting += co2Emissions;
      } else if (description && description.toLowerCase().includes('lease')) {
        esgScopes.scope3.breakdown.leasedAssets += co2Emissions;
      } else if (description && description.toLowerCase().includes('investment')) {
        esgScopes.scope3.breakdown.investments += co2Emissions;
      } else {
        esgScopes.scope3.breakdown.other += co2Emissions;
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
    
    // Penalty for high transportation emissions
    if (assessment.breakdown.transportation.co2Emissions > 100) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(assessment, msmeData) {
    const recommendations = [];
    
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
}

module.exports = new CarbonCalculationService();