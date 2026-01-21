import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import GIFTSchemes from '../GIFTSchemes';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockSchemes = [
    {
        _id: '1',
        name: 'Green Energy Grant',
        description: 'Government grant for renewable energy adoption',
        eligibilityCriteria: ['MSME registered', 'Manufacturing sector'],
        benefits: ['Up to $50,000 grant', 'Tax exemption'],
        applicationProcess: 'Online application through portal',
        documents: ['Business registration', 'Energy audit'],
        deadline: '2024-12-31T23:59:59.000Z',
        contactInfo: 'greenergy@gov.in',
        status: 'active'
    },
    {
        _id: '2',
        name: 'Carbon Reduction Incentive',
        description: 'Incentive for carbon footprint reduction',
        eligibilityCriteria: ['Minimum 10% reduction in emissions'],
        benefits: ['Financial rewards', 'Carbon credits'],
        applicationProcess: 'Submit reduction proof',
        documents: ['Carbon assessment report'],
        deadline: '2024-06-30T23:59:59.000Z',
        contactInfo: 'carbon@gov.in',
        status: 'active'
    }
];

describe('GIFTSchemes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state initially', () => {
        mockedApi.get.mockReturnValue(new Promise(() => { }));
        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders schemes successfully', async () => {
        mockedApi.get.mockResolvedValue({ data: { data: mockSchemes } });

        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Green Energy Grant')).toBeInTheDocument();
            expect(screen.getByText('Carbon Reduction Incentive')).toBeInTheDocument();
        });
    });

    it('displays scheme details correctly', async () => {
        mockedApi.get.mockResolvedValue({ data: { data: mockSchemes } });

        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Government grant for renewable energy adoption')).toBeInTheDocument();
            expect(screen.getByText(/Up to \$50,000 grant/)).toBeInTheDocument();
        });
    });

    it('handles API error gracefully', async () => {
        mockedApi.get.mockRejectedValue({ response: { data: { message: 'Failed to load schemes' } } });

        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to load schemes/)).toBeInTheDocument();
        });
    });

    it('navigates to application form on Apply click', async () => {
        mockedApi.get.mockResolvedValue({ data: { data: mockSchemes } });

        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );

        await waitFor(() => {
            const applyButtons = screen.getAllByText('Apply');
            fireEvent.click(applyButtons[0]);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/gift-application-form', expect.any(Object));
    });

    it('filters schemes by status', async () => {
        const allSchemes = [
            ...mockSchemes,
            {
                _id: '3',
                name: 'Expired Scheme',
                description: 'This scheme has expired',
                eligibilityCriteria: [],
                benefits: [],
                applicationProcess: '',
                documents: [],
                deadline: '2023-01-01T00:00:00.000Z',
                contactInfo: 'expired@gov.in',
                status: 'expired'
            }
        ];

        mockedApi.get.mockResolvedValue({ data: { data: allSchemes } });

        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText(/Apply/)).toHaveLength(2); // Only 2 active schemes
        });
    });

    it('displays empty state when no schemes available', async () => {
        mockedApi.get.mockResolvedValue({ data: { data: [] } });

        render(
            <BrowserRouter>
                <GIFTSchemes />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No schemes available/i)).toBeInTheDocument();
        });
    });
});
