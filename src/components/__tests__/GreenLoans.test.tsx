import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import GreenLoans from '../GreenLoans';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockLoans = [
    {
        _id: '1',
        bank: { name: 'Green Bank', _id: 'bank1' },
        loanType: 'Solar Panel Installation',
        interestRate: 5.5,
        maxAmount: 500000,
        tenure: 60,
        eligibility: ['MSME registered', 'Good credit score'],
        features: ['No processing fee', 'Flexible repayment'],
        status: 'active'
    }
];

const mockApplications = [
    {
        _id: 'app1',
        loanType: 'Solar Panel Installation',
        amount: 300000,
        status: 'pending',
        applicationDate: '2024-01-15T10:00:00.000Z'
    }
];

describe('GreenLoans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockImplementation((url) => {
            if (url === '/green-loans') {
                return Promise.resolve({ data: { data: mockLoans } });
            }
            if (url === '/green-loans/applications') {
                return Promise.resolve({ data: { data: mockApplications } });
            }
            return Promise.reject(new Error('Unknown endpoint'));
        });
    });

    it('renders green loans page successfully', async () => {
        render(
            <BrowserRouter>
                <GreenLoans />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Green Loans/i)).toBeInTheDocument();
        });
    });

    it('displays available loans', async () => {
        render(
            <BrowserRouter>
                <GreenLoans />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Solar Panel Installation')).toBeInTheDocument();
            expect(screen.getByText(/5.5%/)).toBeInTheDocument();
        });
    });

    it('handles loan application', async () => {
        mockedApi.post.mockResolvedValue({ data: { success: true } });

        render(
            <BrowserRouter>
                <GreenLoans />
            </BrowserRouter>
        );

        await waitFor(() => {
            const applyButtons = screen.getAllByRole('button', { name: /Apply/i });
            if (applyButtons.length > 0) {
                fireEvent.click(applyButtons[0]);
            }
        });

        await waitFor(() => {
            expect(mockedApi.post).toHaveBeenCalled();
        });
    });

    it('handles API error', async () => {
        mockedApi.get.mockRejectedValue({
            response: { data: { message: 'Failed to load loans' } }
        });

        render(
            <BrowserRouter>
                <GreenLoans />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
        });
    });
});
