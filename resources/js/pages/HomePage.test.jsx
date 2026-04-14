import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import HomePage from './HomePage.jsx';

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

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('token', 'test-token');
        mockHttpGet.mockImplementation(async (url) => {
            if (url === '/auth/me') {
                return { data: { id: 1, name: 'Alex', email: 'alex@example.com' } };
            }
            throw new Error(`unexpected GET ${url}`);
        });
    });

    it('loads the user and greets by name', async () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <HomePage />
                </AuthProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText(/Hello, Alex/i)).toBeInTheDocument();
        });
    });

    it('shows shortcuts to integrations and labels', async () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <HomePage />
                </AuthProvider>
            </MemoryRouter>,
        );

        await waitFor(() => expect(mockHttpGet).toHaveBeenCalledWith('/auth/me'));

        expect(screen.getByRole('heading', { name: /^home$/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /integrations/i })).toHaveAttribute('href', '/integrations');
        expect(screen.getByRole('link', { name: /shipping labels/i })).toHaveAttribute('href', '/shipping-labels');
    });
});
