import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock localStorage
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock MSME data
export const mockMSMEData = {
  companyName: 'Test Company',
  companyType: 'micro',
  industry: 'manufacturing',
  udyamRegistrationNumber: 'UDYAM-KR-03-0593459',
  gstNumber: '12ABCDE1234F1Z5',
  panNumber: 'ABCDE1234F',
  email: 'test@example.com',
  phone: '9876543210',
  address: '123 Test Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  annualTurnover: 1000000,
  numberOfEmployees: 50,
  manufacturingUnits: 2,
  primaryProducts: 'Test Products',
  establishmentYear: 2020,
};

// Mock carbon assessment data
export const mockCarbonAssessmentData = {
  energy: {
    electricityConsumption: 1000,
    electricitySource: 'Grid (Coal-based)',
    fuelConsumption: 500,
    fuelType: 'Diesel',
  },
  water: {
    waterConsumption: 10000,
    solidWasteGenerated: 100,
    wasteRecyclingRate: 50,
    hazardousWasteGenerated: 10,
  },
  transportation: {
    vehicleFleet: 2,
    averageDistance: 1000,
    fuelEfficiency: 10,
  },
  rawMaterials: {
    rawMaterialConsumption: 1000,
    materialType: 'Steel',
    supplierDistance: 100,
  },
  manufacturing: {
    productionVolume: 1000,
    processEfficiency: 80,
    equipmentAge: 5,
  },
  environmentalControls: {
    airPollutionControl: true,
    waterPollutionControl: true,
    noiseControl: true,
    energyEfficientEquipment: true,
  },
};

// Mock recommendations data
export const mockRecommendationsData = [
  {
    id: '1',
    title: 'Switch to LED Lighting',
    category: 'Energy',
    priority: 'HIGH',
    cost: 'LOW',
    description: 'Replace traditional lighting with LED bulbs',
    benefits: ['Reduced energy consumption', 'Lower maintenance costs'],
    implementationSteps: ['Audit current lighting', 'Purchase LED bulbs', 'Install new lighting'],
    impactMetrics: { co2Reduction: 500, costSavings: 10000 },
    paybackPeriod: 12,
    environmentalImpact: 5,
  },
  {
    id: '2',
    title: 'Install Solar Panels',
    category: 'Energy',
    priority: 'HIGH',
    cost: 'HIGH',
    description: 'Install solar panels to generate renewable energy',
    benefits: ['Clean energy generation', 'Reduced electricity bills'],
    implementationSteps: ['Site assessment', 'Obtain permits', 'Install panels'],
    impactMetrics: { co2Reduction: 2000, costSavings: 50000 },
    paybackPeriod: 36,
    environmentalImpact: 5,
  },
];

// Mock carbon savings data
export const mockCarbonSavingsData = {
  totalSavings: 1500,
  periodSavings: 200,
  savingsPercentage: 15,
  implementedRecommendations: 3,
  potentialSavings: 5000,
  achievements: [
    { type: 'Energy Efficiency', description: 'Reduced energy consumption by 20%' },
    { type: 'Waste Reduction', description: 'Implemented recycling program' },
  ],
  recommendations: [
    { title: 'Switch to LED Lighting', impact: 500, status: 'implemented' },
    { title: 'Install Solar Panels', impact: 2000, status: 'pending' },
  ],
  history: [
    { month: 'Jan', savings: 100 },
    { month: 'Feb', savings: 150 },
    { month: 'Mar', savings: 200 },
  ],
  categoryBreakdown: {
    energy: 800,
    transportation: 300,
    waste: 200,
    water: 200,
  },
  targets: {
    annual: 2000,
    monthly: 200,
  },
  environmentalImpact: {
    treesPlanted: 25,
    carsOffRoad: 2,
  },
  costSavings: {
    total: 75000,
    monthly: 7500,
  },
  industryComparison: {
    yourPerformance: 15,
    industryAverage: 10,
  },
  sustainabilityScore: {
    current: 75,
    target: 90,
  },
};

// Helper function to create mock file
export const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['x'.repeat(size)], name, { type });
  return file;
};

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
