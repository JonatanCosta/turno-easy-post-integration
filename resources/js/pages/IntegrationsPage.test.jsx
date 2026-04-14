import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import IntegrationsPage from './IntegrationsPage.jsx';

const { mockHttpGet } = vi.hoisted(() => ({
    mockHttpGet: vi.fn(),
}));

vi.mock('../api/http.js', () => ({
    default: {
        get: mockHttpGet,
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('IntegrationsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHttpGet.mockImplementation(async (url) => {
            if (url === '/integrations/shipping') {
                return {
                    data: {
                        data: [{ key: 'easypost', name: 'EasyPost', configured: false }],
                    },
                };
            }
            throw new Error(`unexpected GET ${url}`);
        });
    });

    it('loads providers and shows EasyPost status', async () => {
        render(
            <MemoryRouter>
                <IntegrationsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: /^integrations$/i })).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /^easypost$/i })).toBeInTheDocument();
        });

        expect(screen.getByText(/not connected/i)).toBeInTheDocument();
        expect(mockHttpGet).toHaveBeenCalledWith('/integrations/shipping');
    });

    it('shows load error when the list request fails', async () => {
        mockHttpGet.mockRejectedValueOnce(new Error('network'));

        render(
            <MemoryRouter>
                <IntegrationsPage />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/could not load integrations/i)).toBeInTheDocument();
        });
    });
});
