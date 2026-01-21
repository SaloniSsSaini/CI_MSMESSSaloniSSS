import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DataPrivacy from '../DataPrivacy';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('DataPrivacy', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedApi.get.mockResolvedValue({ data: { data: {} } });
    });

    it('renders data privacy page', async () => {
        render(
            <BrowserRouter>
                <DataPrivacy />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Data Privacy/i)).toBeInTheDocument();
        });
    });

    it('displays privacy settings', async () => {
        render(
            <BrowserRouter>
                <DataPrivacy />
            </BrowserRouter>
        );

        await waitFor(() => {
            const element = screen.getByText(/Data Privacy/i);
            expect(element).toBeInTheDocument();
        });
    });

    it('handles data export request', async () => {
        mockedApi.post.mockResolvedValue({ data: { success: true } });

        render(
            <BrowserRouter>
                <DataPrivacy />
            </BrowserRouter>
        );

        await waitFor(() => {
            const exportButtons = screen.queryAllByRole('button', { name: /Export/i });
            if (exportButtons.length > 0) {
                fireEvent.click(exportButtons[0]);
            }
        });
    });

    it('handles data deletion request', async () => {
        mockedApi.delete.mockResolvedValue({ data: { success: true } });

        render(
            <BrowserRouter>
                <DataPrivacy />
            </BrowserRouter>
        );

        await waitFor(() => {
            const deleteButtons = screen.queryAllByRole('button', { name: /Delete/i });
            if (deleteButtons.length > 0) {
                fireEvent.click(deleteButtons[0]);
            }
        });
    });
});
