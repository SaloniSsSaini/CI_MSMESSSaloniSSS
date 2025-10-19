import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Nature as EcoIcon,
  Factory as FactoryIcon,
  LocalShipping as LocalShippingIcon,
  ElectricalServices as ElectricalServicesIcon,
  Water as WaterIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Carbon footprint calculation schema
const carbonFootprintSchema = yup.object({
  // Energy Consumption
  electricityConsumption: yup.number().required('Electricity consumption is required').min(0),
  electricitySource: yup.string().required('Electricity source is required'),
  fuelConsumption: yup.number().required('Fuel consumption is required').min(0),
  fuelType: yup.string().required('Fuel type is required'),
  
  // Water Usage
  waterConsumption: yup.number().required('Water consumption is required').min(0),
  wastewaterTreatment: yup.boolean(),
  
  // Waste Management
  solidWasteGenerated: yup.number().required('Solid waste generated is required').min(0),
  wasteRecyclingRate: yup.number().required('Waste recycling rate is required').min(0).max(100),
  hazardousWasteGenerated: yup.number().required('Hazardous waste generated is required').min(0),
  
  // Transportation
  vehicleFleet: yup.number().required('Number of vehicles is required').min(0),
  averageDistance: yup.number().required('Average distance per vehicle is required').min(0),
  fuelEfficiency: yup.number().required('Fuel efficiency is required').min(0),
  
  // Raw Materials
  rawMaterialConsumption: yup.number().required('Raw material consumption is required').min(0),
  materialType: yup.string().required('Material type is required'),
  supplierDistance: yup.number().required('Supplier distance is required').min(0),
  
  // Manufacturing Process
  productionVolume: yup.number().required('Production volume is required').min(0),
  processEfficiency: yup.number().required('Process efficiency is required').min(0).max(100),
  equipmentAge: yup.number().required('Equipment age is required').min(0),
  
  // Environmental Controls
  hasAirPollutionControl: yup.boolean(),
  hasWaterPollutionControl: yup.boolean(),
  hasNoiseControl: yup.boolean(),
  hasEnergyEfficientEquipment: yup.boolean(),
  
  // Additional data for ESG calculations
  numberOfEmployees: yup.number().required('Number of employees is required').min(1)
});

type CarbonFootprintForm = yup.InferType<typeof carbonFootprintSchema>;

const steps = [
  'Energy Consumption',
  'Water & Waste',
  'Transportation',
  'Raw Materials',
  'Manufacturing Process',
  'Environmental Controls',
  'Results'
];

const CarbonFootprint: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [carbonFootprint, setCarbonFootprint] = useState<any>(null);
  const [msmeData, setMsmeData] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    watch
  } = useForm<CarbonFootprintForm>({
    resolver: yupResolver(carbonFootprintSchema),
    defaultValues: {
      electricitySource: 'grid',
      fuelType: 'diesel',
      materialType: 'steel',
      wastewaterTreatment: false,
      hasAirPollutionControl: false,
      hasWaterPollutionControl: false,
      hasNoiseControl: false,
      hasEnergyEfficientEquipment: false,
      numberOfEmployees: 10
    }
  });

  useEffect(() => {
    // Load MSME registration data
    const savedData = localStorage.getItem('msmeRegistration');
    if (savedData) {
      setMsmeData(JSON.parse(savedData));
    }
  }, []);

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      if (activeStep === steps.length - 2) {
        // Calculate carbon footprint
        await calculateCarbonFootprint();
      }
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getFieldsForStep = (step: number): (keyof CarbonFootprintForm)[] => {
    switch (step) {
      case 0:
        return ['electricityConsumption', 'electricitySource', 'fuelConsumption', 'fuelType'];
      case 1:
        return ['waterConsumption', 'wastewaterTreatment', 'solidWasteGenerated', 'wasteRecyclingRate', 'hazardousWasteGenerated'];
      case 2:
        return ['vehicleFleet', 'averageDistance', 'fuelEfficiency'];
      case 3:
        return ['rawMaterialConsumption', 'materialType', 'supplierDistance'];
      case 4:
        return ['productionVolume', 'processEfficiency', 'equipmentAge'];
      case 5:
        return ['hasAirPollutionControl', 'hasWaterPollutionControl', 'hasNoiseControl', 'hasEnergyEfficientEquipment', 'numberOfEmployees'];
      default:
        return [];
    }
  };

  const calculateCarbonFootprint = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock carbon footprint calculation
    const formData = watch();
    const totalCO2 = calculateTotalCO2(formData);
    
    const energyCO2 = calculateEnergyCO2(formData);
    const waterCO2 = calculateWaterCO2(formData);
    const wasteCO2 = calculateWasteCO2(formData);
    const transportCO2 = calculateTransportCO2(formData);
    const materialsCO2 = calculateMaterialsCO2(formData);
    const manufacturingCO2 = calculateManufacturingCO2(formData);

    setCarbonFootprint({
      totalCO2,
      breakdown: {
        energy: energyCO2,
        water: waterCO2,
        waste: wasteCO2,
        transportation: transportCO2,
        materials: materialsCO2,
        manufacturing: manufacturingCO2
      },
      esgScopes: calculateESGScopes(formData, {
        energy: energyCO2,
        water: waterCO2,
        waste: wasteCO2,
        transportation: transportCO2,
        materials: materialsCO2,
        manufacturing: manufacturingCO2
      }),
      recommendations: generateRecommendations(formData, totalCO2),
      score: calculateCarbonScore(totalCO2, formData)
    });
    
    setIsCalculating(false);
  };

  const calculateTotalCO2 = (data: CarbonFootprintForm): number => {
    return calculateEnergyCO2(data) + 
           calculateWaterCO2(data) + 
           calculateWasteCO2(data) + 
           calculateTransportCO2(data) + 
           calculateMaterialsCO2(data) + 
           calculateManufacturingCO2(data);
  };

  const calculateEnergyCO2 = (data: CarbonFootprintForm): number => {
    const electricityFactor = data.electricitySource === 'renewable' ? 0.1 : 0.8;
    const fuelFactor = data.fuelType === 'diesel' ? 2.68 : 2.31;
    
    return (data.electricityConsumption * electricityFactor) + 
           (data.fuelConsumption * fuelFactor);
  };

  const calculateWaterCO2 = (data: CarbonFootprintForm): number => {
    return data.waterConsumption * 0.0004; // kg CO2 per liter
  };

  const calculateWasteCO2 = (data: CarbonFootprintForm): number => {
    const recyclingFactor = data.wasteRecyclingRate / 100;
    return (data.solidWasteGenerated * (1 - recyclingFactor) * 0.5) + 
           (data.hazardousWasteGenerated * 2.0);
  };

  const calculateTransportCO2 = (data: CarbonFootprintForm): number => {
    const totalDistance = data.vehicleFleet * data.averageDistance * 12; // Monthly to yearly
    const fuelConsumption = totalDistance / data.fuelEfficiency;
    return fuelConsumption * 2.68; // Diesel emission factor
  };

  const calculateMaterialsCO2 = (data: CarbonFootprintForm): number => {
    const materialFactors: { [key: string]: number } = {
      steel: 1.85,
      aluminum: 8.24,
      plastic: 2.53,
      paper: 0.93,
      glass: 0.85
    };
    
    const materialFactor = materialFactors[data.materialType] || 1.0;
    const transportFactor = data.supplierDistance * 0.0001;
    
    return data.rawMaterialConsumption * (materialFactor + transportFactor);
  };

  const calculateManufacturingCO2 = (data: CarbonFootprintForm): number => {
    const efficiencyFactor = data.processEfficiency / 100;
    const ageFactor = Math.max(0.5, 1 - (data.equipmentAge * 0.02));
    
    return data.productionVolume * 0.1 * (1 - efficiencyFactor) * ageFactor;
  };

  const calculateESGScopes = (data: CarbonFootprintForm, breakdown: any) => {
    // Scope 1: Direct emissions (fuel combustion, company vehicles, manufacturing processes)
    const scope1 = {
      total: 0,
      breakdown: {
        directFuel: data.fuelConsumption * (data.fuelType === 'diesel' ? 2.68 : 2.31),
        directTransport: data.vehicleFleet * data.averageDistance * 12 * 2.68 / data.fuelEfficiency,
        directManufacturing: breakdown.manufacturing * 0.3, // 30% of manufacturing is direct
        fugitiveEmissions: 0 // Assume no fugitive emissions for now
      },
      description: 'Direct emissions from owned or controlled sources'
    };
    scope1.total = Object.values(scope1.breakdown).reduce((sum: number, val: any) => sum + val, 0);

    // Scope 2: Indirect energy emissions (purchased electricity, heating, cooling, steam)
    const scope2 = {
      total: 0,
      breakdown: {
        electricity: data.electricityConsumption * (data.electricitySource === 'renewable' ? 0.1 : 0.8),
        heating: 0, // Assume no separate heating
        cooling: 0, // Assume no separate cooling
        steam: 0    // Assume no steam usage
      },
      description: 'Indirect emissions from purchased energy'
    };
    scope2.total = Object.values(scope2.breakdown).reduce((sum: number, val: any) => sum + val, 0);

    // Scope 3: Other indirect emissions (purchased goods, transportation, waste disposal, etc.)
    const scope3 = {
      total: 0,
      breakdown: {
        purchasedGoods: breakdown.materials * 0.8, // 80% of materials are purchased goods
        transportation: breakdown.transportation * 0.2, // 20% of transport is outsourced
        wasteDisposal: breakdown.waste * 0.5, // 50% of waste disposal is outsourced
        businessTravel: 0, // Assume no business travel for MSME
        employeeCommuting: data.numberOfEmployees * 0.1, // Estimate commuting emissions
        leasedAssets: 0, // Assume no leased assets
        investments: 0, // Assume no investment-related emissions
        other: breakdown.water * 0.3 // 30% of water treatment is outsourced
      },
      description: 'All other indirect emissions in the value chain'
    };
    scope3.total = Object.values(scope3.breakdown).reduce((sum: number, val: any) => sum + val, 0);

    return { scope1, scope2, scope3 };
  };

  const calculateCarbonScore = (totalCO2: number, data: CarbonFootprintForm): number => {
    // Base score calculation
    let score = 100;
    
    // Penalize high CO2 emissions
    score -= Math.min(50, totalCO2 / 100);
    
    // Bonus for environmental controls
    if (data.hasAirPollutionControl) score += 5;
    if (data.hasWaterPollutionControl) score += 5;
    if (data.hasNoiseControl) score += 3;
    if (data.hasEnergyEfficientEquipment) score += 7;
    if (data.wastewaterTreatment) score += 5;
    
    // Bonus for renewable energy
    if (data.electricitySource === 'renewable') score += 10;
    
    // Bonus for high recycling rate
    score += data.wasteRecyclingRate * 0.2;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const generateRecommendations = (data: CarbonFootprintForm, totalCO2: number): string[] => {
    const recommendations: string[] = [];
    
    if (data.electricitySource !== 'renewable') {
      recommendations.push('Switch to renewable energy sources (solar/wind) to reduce electricity-related emissions');
    }
    
    if (data.wasteRecyclingRate < 70) {
      recommendations.push('Improve waste recycling rate to at least 70% to reduce landfill emissions');
    }
    
    if (!data.hasEnergyEfficientEquipment) {
      recommendations.push('Upgrade to energy-efficient equipment and machinery');
    }
    
    if (data.processEfficiency < 80) {
      recommendations.push('Optimize manufacturing processes to improve efficiency');
    }
    
    if (data.equipmentAge > 10) {
      recommendations.push('Consider replacing old equipment with modern, efficient alternatives');
    }
    
    if (data.supplierDistance > 500) {
      recommendations.push('Source raw materials from local suppliers to reduce transportation emissions');
    }
    
    if (totalCO2 > 1000) {
      recommendations.push('Implement carbon offset programs to neutralize remaining emissions');
    }
    
    return recommendations;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <ElectricalServicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Energy Consumption
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="electricityConsumption"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Electricity Consumption (kWh)"
                    error={!!errors.electricityConsumption}
                    helperText={errors.electricityConsumption?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="electricitySource"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.electricitySource}>
                    <InputLabel>Electricity Source</InputLabel>
                    <Select {...field} label="Electricity Source">
                      <MenuItem value="grid">Grid (Coal-based)</MenuItem>
                      <MenuItem value="renewable">Renewable Energy</MenuItem>
                      <MenuItem value="mixed">Mixed (Grid + Renewable)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="fuelConsumption"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Fuel Consumption (Liters)"
                    error={!!errors.fuelConsumption}
                    helperText={errors.fuelConsumption?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="fuelType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.fuelType}>
                    <InputLabel>Fuel Type</InputLabel>
                    <Select {...field} label="Fuel Type">
                      <MenuItem value="diesel">Diesel</MenuItem>
                      <MenuItem value="petrol">Petrol</MenuItem>
                      <MenuItem value="lpg">LPG</MenuItem>
                      <MenuItem value="cng">CNG</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <WaterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Water Usage & Waste Management
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="waterConsumption"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Water Consumption (Liters)"
                    error={!!errors.waterConsumption}
                    helperText={errors.waterConsumption?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="wastewaterTreatment"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Has Wastewater Treatment System"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="solidWasteGenerated"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Solid Waste Generated (kg)"
                    error={!!errors.solidWasteGenerated}
                    helperText={errors.solidWasteGenerated?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="wasteRecyclingRate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Waste Recycling Rate (%)"
                    error={!!errors.wasteRecyclingRate}
                    helperText={errors.wasteRecyclingRate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="hazardousWasteGenerated"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Hazardous Waste Generated (kg)"
                    error={!!errors.hazardousWasteGenerated}
                    helperText={errors.hazardousWasteGenerated?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Transportation
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="vehicleFleet"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Number of Vehicles"
                    error={!!errors.vehicleFleet}
                    helperText={errors.vehicleFleet?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="averageDistance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Average Monthly Distance per Vehicle (km)"
                    error={!!errors.averageDistance}
                    helperText={errors.averageDistance?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="fuelEfficiency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Fuel Efficiency (km/liter)"
                    error={!!errors.fuelEfficiency}
                    helperText={errors.fuelEfficiency?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Raw Materials
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="rawMaterialConsumption"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Raw Material Consumption (kg)"
                    error={!!errors.rawMaterialConsumption}
                    helperText={errors.rawMaterialConsumption?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="materialType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.materialType}>
                    <InputLabel>Primary Material Type</InputLabel>
                    <Select {...field} label="Primary Material Type">
                      <MenuItem value="steel">Steel</MenuItem>
                      <MenuItem value="aluminum">Aluminum</MenuItem>
                      <MenuItem value="plastic">Plastic</MenuItem>
                      <MenuItem value="paper">Paper</MenuItem>
                      <MenuItem value="glass">Glass</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="supplierDistance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Average Supplier Distance (km)"
                    error={!!errors.supplierDistance}
                    helperText={errors.supplierDistance?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <FactoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Manufacturing Process
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="productionVolume"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Monthly Production Volume (units)"
                    error={!!errors.productionVolume}
                    helperText={errors.productionVolume?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="processEfficiency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Process Efficiency (%)"
                    error={!!errors.processEfficiency}
                    helperText={errors.processEfficiency?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="equipmentAge"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Average Equipment Age (years)"
                    error={!!errors.equipmentAge}
                    helperText={errors.equipmentAge?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Environmental Controls
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="hasAirPollutionControl"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Air Pollution Control Systems"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="hasWaterPollutionControl"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Water Pollution Control Systems"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="hasNoiseControl"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Noise Control Measures"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="hasEnergyEfficientEquipment"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Energy Efficient Equipment"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="numberOfEmployees"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Number of Employees"
                    error={!!errors.numberOfEmployees}
                    helperText={errors.numberOfEmployees?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 6:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <EcoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Carbon Footprint Results
              </Typography>
            </Grid>
            
            {isCalculating ? (
              <Grid item xs={12}>
                <Box textAlign="center" py={4}>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="h6">
                    Calculating your carbon footprint...
                  </Typography>
                </Box>
              </Grid>
            ) : carbonFootprint ? (
              <>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Carbon Footprint
                      </Typography>
                      <Typography variant="h2" color="primary">
                        {carbonFootprint.totalCO2.toFixed(2)} kg CO₂
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        per month
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Carbon Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h2" color="primary">
                          {carbonFootprint.score}
                        </Typography>
                        <Chip 
                          label={carbonFootprint.score >= 80 ? 'Excellent' : 
                                 carbonFootprint.score >= 60 ? 'Good' : 'Needs Improvement'}
                          color={carbonFootprint.score >= 80 ? 'success' : 
                                 carbonFootprint.score >= 60 ? 'warning' : 'error'}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={carbonFootprint.score} 
                        color={carbonFootprint.score >= 80 ? 'success' : 
                               carbonFootprint.score >= 60 ? 'warning' : 'error'}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        ESG Scope Breakdown
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Box textAlign="center" sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="h6" color="error">
                              {carbonFootprint.esgScopes?.scope1?.total?.toFixed(2) || '0.00'} kg CO₂
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Scope 1
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Direct Emissions
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box textAlign="center" sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="h6" color="warning.main">
                              {carbonFootprint.esgScopes?.scope2?.total?.toFixed(2) || '0.00'} kg CO₂
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Scope 2
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Indirect Energy
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Box textAlign="center" sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="h6" color="info.main">
                              {carbonFootprint.esgScopes?.scope3?.total?.toFixed(2) || '0.00'} kg CO₂
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Scope 3
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Value Chain
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Category Breakdown
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(carbonFootprint.breakdown).map(([category, value]) => (
                          <Grid item xs={12} sm={6} md={4} key={category}>
                            <Box textAlign="center">
                              <Typography variant="h6">
                                {(value as number).toFixed(2)} kg CO₂
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                {category}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recommendations
                      </Typography>
                      {carbonFootprint.recommendations.map((recommendation: string, index: number) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <DeleteIcon color="primary" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                          <Typography variant="body2">
                            {recommendation}
                          </Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            ) : null}
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  if (!msmeData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please complete MSME registration first to access carbon footprint assessment.
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Carbon Footprint Assessment
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" paragraph>
        Measure your company's carbon footprint across all manufacturing processes
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit(() => {})}>
        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        {activeStep < steps.length - 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
            >
              {activeStep === steps.length - 2 ? 'Calculate' : 'Next'}
            </Button>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default CarbonFootprint;