import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import CarbonTrading from '../CarbonTrading';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockCarbonCredits = {
    _id: '1',
    msme: 'test-msme',
    totalCredits: 100.50,
    availableCredits: 50.25,
    retiredCredits: 50.25,
    pricePerCredit: 25.00,
    status: 'active'
};

const mockMarketListings = [
    {
        _id: '1',
        seller: 'Company A',
        credits: 20.00,
        pricePerCredit: 24.50,
        totalValue: 490.00,
        status: 'active'
    },
    {
        _id: '2',
        seller: 'Company B',
        credits: 15.00,
        pricePerCredit: 26.00,
        totalValue: 390.00,
        status: 'active'
    }
];

const mockTradeHistory = [
    {
        _id: '1',
        type: 'buy' as const,
        credits: 10.00,
        pricePerCredit: 25.00,
        totalAmount: 250.00,
        status: 'completed',
        createdAt: '2024-01-15T10:00:00.000Z'
    }
];

describe('CarbonTrading', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockImplementation((url) => {
            switch (url) {
                case '/carbon-credits/balance':
                    return Promise.resolve({ data: { data: mockCarbonCredits } });
                case '/carbon-trading/market':
                    return Promise.resolve({ data: { data: mockMarketListings } });
                case '/carbon-trading/history':
                    return Promise.resolve({ data: { data: mockTradeHistory } });
                case '/carbon-trading/price-history':
                    return Promise.resolve({ data: { data: [] } });
                default:
                    return Promise.reject(new Error('Unknown endpoint'));
            }
        });
    });

    it('renders carbon trading dashboard successfully', async () => {
        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Carbon Credit Trading')).toBeInTheDocument();
            expect(screen.getByText('100.50')).toBeInTheDocument(); // Total credits
            expect(screen.getByText('50.25')).toBeInTheDocument(); // Available credits
        });
    });

    it('displays market listings', async () => {
        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Company A')).toBeInTheDocument();
            expect(screen.getByText('Company B')).toBeInTheDocument();
        });
    });

    it('opens buy dialog when clicking Buy button', async () => {
        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            const buyButtons = screen.getAllByRole('button', { name: /Buy/i });
            fireEvent.click(buyButtons[1]); // Click the second Buy button (first is "Buy Credits")
        });

        expect(screen.getByText('Buy Carbon Credits')).toBeInTheDocument();
    });

    it('handles buy transaction successfully', async () => {
        mockedApi.post.mockResolvedValue({ data: { success: true } });

        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            const buyButtons = screen.getAllByRole('button', { name: /Buy/i });
            fireEvent.click(buyButtons[1]);
        });

        // Fill in the form
        const input = screen.getByLabelText('Number of Credits');
        fireEvent.change(input, { target: { value: '5' } });

        // Click Buy button in dialog
        const confirmButton = screen.getByRole('button', { name: /^Buy$/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockedApi.post).toHaveBeenCalledWith('/carbon-trading/buy', expect.any(Object));
            expect(screen.getByText(/Successfully purchased/)).toBeInTheDocument();
        });
    });

    it('opens sell dialog when clicking Sell Credits button', async () => {
        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            const sellButton = screen.getByRole('button', { name: /Sell Credits/i });
            fireEvent.click(sellButton);
        });

        expect(screen.getByText('Sell Carbon Credits')).toBeInTheDocument();
    });

    it('handles sell transaction successfully', async () => {
        mockedApi.post.mockResolvedValue({ data: { success: true } });

        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            const sellButton = screen.getByRole('button', { name: /Sell Credits/i });
            fireEvent.click(sellButton);
        });

        // Fill in the form
        const creditsInput = screen.getByLabelText('Number of Credits');
        const priceInput = screen.getByLabelText('Price per Credit');

        fireEvent.change(creditsInput, { target: { value: '10' } });
        fireEvent.change(priceInput, { target: { value: '25' } });

        // Click sell button
        const confirmButton = screen.getByRole('button', { name: /List for Sale/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockedApi.post).toHaveBeenCalledWith('/carbon-trading/sell', expect.any(Object));
            expect(screen.getByText(/Successfully listed/)).toBeInTheDocument();
        });
    });

    it('switches between tabs correctly', async () => {
        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            const priceHistoryTab = screen.getByRole('tab', { name: /Price History/i });
            fireEvent.click(priceHistoryTab);
            expect(screen.getByText('Price History')).toBeInTheDocument();
        });

        const tradeHistoryTab = screen.getByRole('tab', { name: /Trade History/i });
        fireEvent.click(tradeHistoryTab);

        await waitFor(() => {
            expect(screen.getByText('Trade History')).toBeInTheDocument();
        });
    });

    it('displays trade history correctly', async () => {
        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        const tradeHistoryTab = screen.getByRole('tab', { name: /Trade History/i });
        fireEvent.click(tradeHistoryTab);

        await waitFor(() => {
            expect(screen.getByText('BUY')).toBeInTheDocument();
            expect(screen.getByText('completed')).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        mockedApi.get.mockRejectedValue({
            response: { data: { message: 'Failed to fetch data' } }
        });

        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
        });
    });

    it('disables sell button when no available credits', async () => {
        const noCredits = { ...mockCarbonCredits, availableCredits: 0 };
        mockedApi.get.mockImplementation((url) => {
            if (url === '/carbon-credits/balance') {
                return Promise.resolve({ data: { data: noCredits } });
            }
            return Promise.resolve({ data: { data: [] } });
        });

        render(
            <BrowserRouter>
                <CarbonTrading />
            </BrowserRouter>
        );

        await waitFor(() => {
            const sellButton = screen.getByRole('button', { name: /Sell Credits/i });
            expect(sellButton).toBeDisabled();
        });
    });
});
