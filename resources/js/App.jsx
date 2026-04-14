import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import CreateLabelPage from './pages/CreateLabelPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LabelCreatedPage from './pages/LabelCreatedPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import SelectIntegrationPage from './pages/SelectIntegrationPage.jsx';
import ShippingLabelDetailPage from './pages/ShippingLabelDetailPage.jsx';
import ShippingLabelsPage from './pages/ShippingLabelsPage.jsx';

function AuthBootSpinner() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    );
}

function RequireAuth() {
    const { user, loading, bootstrapped } = useAuth();
    const location = useLocation();

    if (!bootstrapped || loading) {
        return <AuthBootSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return (
        <AppShell>
            <Outlet />
        </AppShell>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shipping-labels" element={<ShippingLabelsPage />} />
                <Route path="/shipping-labels/generate" element={<SelectIntegrationPage />} />
                <Route path="/shipping-labels/generate/:integrationKey" element={<CreateLabelPage />} />
                <Route path="/shipping-labels/:labelId" element={<ShippingLabelDetailPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/shipping-labels/success" element={<LabelCreatedPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
