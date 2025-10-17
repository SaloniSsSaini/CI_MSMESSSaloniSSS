import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CarbonFootprint from '../CarbonFootprint';
import { act } from '@testing-library/react';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('CarbonFootprint', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows registration prompt when no MSME data exists', () => {
    renderWithProviders(<CarbonFootprint />);
    
    expect(screen.getByText('Please complete MSME registration first to access carbon footprint assessment.')).toBeInTheDocument();
  });

  test('renders carbon footprint assessment form when MSME data exists', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    expect(screen.getByText('Carbon Footprint Assessment')).toBeInTheDocument();
    expect(screen.getByText('Energy Consumption')).toBeInTheDocument();
  });

  test('validates energy consumption fields', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Electricity consumption is required')).toBeInTheDocument();
      expect(screen.getByText('Electricity source is required')).toBeInTheDocument();
      expect(screen.getByText('Fuel consumption is required')).toBeInTheDocument();
      expect(screen.getByText('Fuel type is required')).toBeInTheDocument();
    });
  });

  test('validates water and waste fields', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    // Fill energy step
    fireEvent.change(screen.getByLabelText('Monthly Electricity Consumption (kWh)'), { target: { value: '1000' } });
    fireEvent.mouseDown(screen.getByLabelText('Electricity Source'));
    fireEvent.click(screen.getByText('Grid (Coal-based)'));
    fireEvent.change(screen.getByLabelText('Monthly Fuel Consumption (Liters)'), { target: { value: '500' } });
    fireEvent.mouseDown(screen.getByLabelText('Fuel Type'));
    fireEvent.click(screen.getByText('Diesel'));
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Water Usage & Waste Management')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Water consumption is required')).toBeInTheDocument();
      expect(screen.getByText('Solid waste generated is required')).toBeInTheDocument();
      expect(screen.getByText('Waste recycling rate is required')).toBeInTheDocument();
      expect(screen.getByText('Hazardous waste generated is required')).toBeInTheDocument();
    });
  });

  test('validates transportation fields', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    // Fill energy and water steps
    fireEvent.change(screen.getByLabelText('Monthly Electricity Consumption (kWh)'), { target: { value: '1000' } });
    fireEvent.mouseDown(screen.getByLabelText('Electricity Source'));
    fireEvent.click(screen.getByText('Grid (Coal-based)'));
    fireEvent.change(screen.getByLabelText('Monthly Fuel Consumption (Liters)'), { target: { value: '500' } });
    fireEvent.mouseDown(screen.getByLabelText('Fuel Type'));
    fireEvent.click(screen.getByText('Diesel'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Monthly Water Consumption (Liters)'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Monthly Solid Waste Generated (kg)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Waste Recycling Rate (%)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Monthly Hazardous Waste Generated (kg)'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Transportation')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Number of vehicles is required')).toBeInTheDocument();
      expect(screen.getByText('Average monthly distance per vehicle is required')).toBeInTheDocument();
      expect(screen.getByText('Fuel efficiency is required')).toBeInTheDocument();
    });
  });

  test('validates raw materials fields', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    // Fill previous steps
    fireEvent.change(screen.getByLabelText('Monthly Electricity Consumption (kWh)'), { target: { value: '1000' } });
    fireEvent.mouseDown(screen.getByLabelText('Electricity Source'));
    fireEvent.click(screen.getByText('Grid (Coal-based)'));
    fireEvent.change(screen.getByLabelText('Monthly Fuel Consumption (Liters)'), { target: { value: '500' } });
    fireEvent.mouseDown(screen.getByLabelText('Fuel Type'));
    fireEvent.click(screen.getByText('Diesel'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Monthly Water Consumption (Liters)'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Monthly Solid Waste Generated (kg)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Waste Recycling Rate (%)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Monthly Hazardous Waste Generated (kg)'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Number of Vehicles'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Average Monthly Distance per Vehicle (km)'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Fuel Efficiency (km/liter)'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Raw Materials')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Raw material consumption is required')).toBeInTheDocument();
      expect(screen.getByText('Material type is required')).toBeInTheDocument();
      expect(screen.getByText('Supplier distance is required')).toBeInTheDocument();
    });
  });

  test('validates manufacturing process fields', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    // Fill previous steps
    fireEvent.change(screen.getByLabelText('Monthly Electricity Consumption (kWh)'), { target: { value: '1000' } });
    fireEvent.mouseDown(screen.getByLabelText('Electricity Source'));
    fireEvent.click(screen.getByText('Grid (Coal-based)'));
    fireEvent.change(screen.getByLabelText('Monthly Fuel Consumption (Liters)'), { target: { value: '500' } });
    fireEvent.mouseDown(screen.getByLabelText('Fuel Type'));
    fireEvent.click(screen.getByText('Diesel'));
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Monthly Water Consumption (Liters)'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Monthly Solid Waste Generated (kg)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Waste Recycling Rate (%)'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Monthly Hazardous Waste Generated (kg)'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Number of Vehicles'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Average Monthly Distance per Vehicle (km)'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Fuel Efficiency (km/liter)'), { target: { value: '10' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Monthly Raw Material Consumption (kg)'), { target: { value: '1000' } });
    fireEvent.mouseDown(screen.getByLabelText('Primary Material Type'));
    fireEvent.click(screen.getByText('Steel'));
    fireEvent.change(screen.getByLabelText('Average Supplier Distance (km)'), { target: { value: '100' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Manufacturing Process')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Production volume is required')).toBeInTheDocument();
      expect(screen.getByText('Process efficiency is required')).toBeInTheDocument();
      expect(screen.getByText('Equipment age is required')).toBeInTheDocument();
    });
  });

  test('calculates carbon footprint with valid data', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    // Fill all steps with valid data
    const steps = [
      { electricityConsumption: '1000', electricitySource: 'Grid (Coal-based)', fuelConsumption: '500', fuelType: 'Diesel' },
      { waterConsumption: '10000', solidWasteGenerated: '100', wasteRecyclingRate: '50', hazardousWasteGenerated: '10' },
      { vehicleFleet: '2', averageDistance: '1000', fuelEfficiency: '10' },
      { rawMaterialConsumption: '1000', materialType: 'Steel', supplierDistance: '100' },
      { productionVolume: '1000', processEfficiency: '80', equipmentAge: '5' }
    ];
    
    // Fill all steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      Object.entries(step).forEach(([key, value]) => {
        const field = screen.getByLabelText(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        if (field.tagName === 'INPUT') {
          fireEvent.change(field, { target: { value } });
        } else if (field.tagName === 'DIV' && field.getAttribute('role') === 'button') {
          fireEvent.mouseDown(field);
          fireEvent.click(screen.getByText(value));
        }
      });
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText(/Environmental Controls|Manufacturing Process|Raw Materials|Transportation|Water Usage & Waste Management/)).toBeInTheDocument();
      });
    }
    
    // Fill environmental controls
    fireEvent.click(screen.getByLabelText('Air Pollution Control Systems'));
    fireEvent.click(screen.getByLabelText('Water Pollution Control Systems'));
    fireEvent.click(screen.getByLabelText('Noise Control Measures'));
    fireEvent.click(screen.getByLabelText('Energy Efficient Equipment'));
    
    // Calculate
    fireEvent.click(screen.getByText('Calculate'));
    
    await waitFor(() => {
      expect(screen.getByText('Calculating your carbon footprint...')).toBeInTheDocument();
    });
    
    // Wait for calculation to complete
    await waitFor(() => {
      expect(screen.getByText('Carbon Footprint Results')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('navigates between steps correctly', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonFootprint />);
    
    // Fill first step
    fireEvent.change(screen.getByLabelText('Monthly Electricity Consumption (kWh)'), { target: { value: '1000' } });
    fireEvent.mouseDown(screen.getByLabelText('Electricity Source'));
    fireEvent.click(screen.getByText('Grid (Coal-based)'));
    fireEvent.change(screen.getByLabelText('Monthly Fuel Consumption (Liters)'), { target: { value: '500' } });
    fireEvent.mouseDown(screen.getByLabelText('Fuel Type'));
    fireEvent.click(screen.getByText('Diesel'));
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Water Usage & Waste Management')).toBeInTheDocument();
    });
    
    // Go back
    fireEvent.click(screen.getByText('Back'));
    
    await waitFor(() => {
      expect(screen.getByText('Energy Consumption')).toBeInTheDocument();
    });
  });
});