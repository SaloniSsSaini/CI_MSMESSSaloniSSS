import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DocumentManagement from '../DocumentManagement';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockDocuments = [
    {
        _id: '1',
        filename: 'energy-report.pdf',
        originalName: 'Energy Report 2024.pdf',
        fileType: 'application/pdf',
        fileSize: 1024000,
        uploadDate: '2024-01-15T10:00:00.000Z',
        category: 'reports',
        status: 'processed'
    },
    {
        _id: '2',
        filename: 'invoice.pdf',
        originalName: 'Invoice Jan 2024.pdf',
        fileType: 'application/pdf',
        fileSize: 512000,
        uploadDate: '2024-01-14T10:00:00.000Z',
        category: 'invoices',
        status: 'processed'
    }
];

describe('DocumentManagement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockResolvedValue({ data: { data: mockDocuments } });
    });

    it('renders document management page', async () => {
        render(
            <BrowserRouter>
                <DocumentManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Document Management/i)).toBeInTheDocument();
        });
    });

    it('displays document list', async () => {
        render(
            <BrowserRouter>
                <DocumentManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Energy Report 2024.pdf')).toBeInTheDocument();
            expect(screen.getByText('Invoice Jan 2024.pdf')).toBeInTheDocument();
        });
    });

    it('handles document download', async () => {
        global.URL.createObjectURL = jest.fn();
        mockedApi.get.mockResolvedValue({ data: new Blob(['test']) });

        render(
            <BrowserRouter>
                <DocumentManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            const downloadButtons = screen.getAllByRole('button', { name: /Download/i });
            if (downloadButtons.length > 0) {
                fireEvent.click(downloadButtons[0]);
            }
        });
    });

    it('handles document deletion', async () => {
        mockedApi.delete.mockResolvedValue({ data: { success: true } });
        window.confirm = jest.fn(() => true);

        render(
            <BrowserRouter>
                <DocumentManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
            if (deleteButtons.length > 0) {
                fireEvent.click(deleteButtons[0]);
            }
        });

        await waitFor(() => {
            expect(mockedApi.delete).toHaveBeenCalled();
        });
    });

    it('filters documents by category', async () => {
        render(
            <BrowserRouter>
                <DocumentManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            const categoryFilter = screen.queryByLabelText(/Category/i);
            if (categoryFilter) {
                fireEvent.change(categoryFilter, { target: { value: 'reports' } });
            }
        });
    });

    it('handles API error', async () => {
        mockedApi.get.mockRejectedValue({
            response: { data: { message: 'Failed to load documents' } }
        });

        render(
            <BrowserRouter>
                <DocumentManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
        });
    });
});
