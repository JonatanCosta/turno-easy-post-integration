import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import http from '../api/http.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bootstrapped, setBootstrapped] = useState(false);

    const loadMe = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            setBootstrapped(true);

            return;
        }
        setBootstrapped(false);
        setLoading(true);
        try {
            const { data } = await http.get('/auth/me');
            setUser(data);
        } catch {
            setUser(null);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
            setBootstrapped(true);
        }
    }, []);

    useEffect(() => {
        loadMe();
    }, [loadMe]);

    const login = useCallback(async (email, password) => {
        const { data } = await http.post('/auth/login', { email, password });
        localStorage.setItem('token', data.access_token);
        await loadMe();
    }, [loadMe]);

    const register = useCallback(async (payload) => {
        const { data } = await http.post('/auth/register', payload);
        localStorage.setItem('token', data.access_token);
        await loadMe();
    }, [loadMe]);

    const logout = useCallback(async () => {
        try {
            await http.post('/auth/logout');
        } catch {
            //
        }
        localStorage.removeItem('token');
        setUser(null);
        setBootstrapped(true);
    }, []);

    const value = useMemo(
        () => ({ user, loading, bootstrapped, login, register, logout, loadMe }),
        [user, loading, bootstrapped, login, register, logout, loadMe],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return ctx;
}
