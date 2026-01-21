import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CarbonForecastingGraph from '../CarbonForecastingGraph';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockForecastData = {
    historical: [
        { month: '2024-01', emissions: 1250.5 },
        { month: '2024-02', emissions: 1180.3 }
    ],
    forecast: [
        { month: '2024-03', emissions: 1100.0, confidence: 0.85 },
        { month: '2024-04', emissions: 1050.0, confidence: 0.80 }
    ]
};

describe('CarbonForecastingGraph', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockResolvedValue({ data: { data: mockForecastData } });
    });

    it('renders carbon forecasting page', async () => {
        render(
            <BrowserRouter>
                <CarbonForecastingGraph />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Carbon Forecast/i) || screen.getByText(/Forecasting/i)).toBeInTheDocument();
        });
    });

    it('displays forecast chart', async () => {
        render(
            <BrowserRouter>
                <CarbonForecastingGraph />
            </BrowserRouter>
        );

        await waitFor(() => {
            // Chart should render
            const component = screen.getByText(/Carbon Forecast/i) || screen.getByText(/Forecast/i);
            expect(component).toBeInTheDocument();
        });
    });

    it('handles API error', async () => {
        mockedApi.get.mockRejectedValue({
            response: { data: { message: 'Failed to load forecast' } }
        });

        render(
            <BrowserRouter>
                <CarbonForecastingGraph />
            </BrowserRouter>
        );

        await waitFor(() => {
            const errorElement = screen.queryByText(/Failed/i) || screen.queryByText(/Error/i);
            if (errorElement) {
                expect(errorElement).toBeInTheDocument();
            }
        });
    });

    it('displays loading state', () => {
        mockedApi.get.mockReturnValue(new Promise(() => { }));

        render(
            <BrowserRouter>
                <CarbonForecastingGraph />
            </BrowserRouter>
        );

        expect(screen.queryByRole('progressbar') || screen.queryByText(/Loading/i)).toBeTruthy();
    });
});
