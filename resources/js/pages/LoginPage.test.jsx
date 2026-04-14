import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import LoginPage from './LoginPage.jsx';

describe('LoginPage', () => {
    it('renders sign in heading', () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <LoginPage />
                </AuthProvider>
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    });
});
