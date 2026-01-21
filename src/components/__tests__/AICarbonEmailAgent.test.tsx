import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AICarbonEmailAgent from '../AICarbonEmailAgent';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockEmails = [
    {
        _id: '1',
        subject: 'Electricity Bill - January 2024',
        content: 'Your electricity consumption was 500 kWh, total bill $250',
        sender: 'utility@electric.com',
        timestamp: '2024-01-15T10:00:00.000Z',
        carbonData: {
            type: 'energy',
            amount: 500,
            unit: 'kWh',
            co2Emissions: 250
        }
    }
];

describe('AICarbonEmailAgent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockResolvedValue({ data: { data: mockEmails } });
        mockedApi.post.mockResolvedValue({ data: { success: true, data: mockEmails } });
    });

    it('renders AI email agent page', async () => {
        render(
            <BrowserRouter>
                <AICarbonEmailAgent />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Email Analysis/i)).toBeInTheDocument();
        });
    });

    it('displays analyzed emails', async () => {
        render(
            <BrowserRouter>
                <AICarbonEmailAgent />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Electricity Bill/i)).toBeInTheDocument();
        });
    });

    it('handles email analysis request', async () => {
        render(
            <BrowserRouter>
                <AICarbonEmailAgent />
            </BrowserRouter>
        );

        await waitFor(() => {
            const analyzeButton = screen.queryByRole('button', { name: /Analyze/i });
            if (analyzeButton) {
                fireEvent.click(analyzeButton);
            }
        });
    });

    it('handles API error', async () => {
        mockedApi.get.mockRejectedValue({
            response: { data: { message: 'Failed to analyze emails' } }
        });

        render(
            <BrowserRouter>
                <AICarbonEmailAgent />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed/i) || screen.getByText(/Error/i)).toBeInTheDocument();
        });
    });
});
