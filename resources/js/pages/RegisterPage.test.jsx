import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import RegisterPage from './RegisterPage.jsx';

describe('RegisterPage', () => {
    it('renders create account heading and plan hint', () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <RegisterPage />
                </AuthProvider>
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
        expect(screen.getByText(/free plan/i)).toBeInTheDocument();
    });

    it('links to the login page', () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <RegisterPage />
                </AuthProvider>
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });
});
