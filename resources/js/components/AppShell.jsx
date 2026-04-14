import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function IconHome({ className = 'h-5 w-5 shrink-0' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
        </svg>
    );
}

function IconIntegrations({ className = 'h-5 w-5 shrink-0' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
        </svg>
    );
}

function IconLabels({ className = 'h-5 w-5 shrink-0' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
        </svg>
    );
}

function IconSignOut({ className = 'h-5 w-5 shrink-0' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
        </svg>
    );
}

const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        isActive
            ? 'bg-primary/10 text-primary'
            : 'text-secondary/75 hover:bg-zinc-100 hover:text-secondary'
    }`;

export default function AppShell({ children }) {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen bg-zinc-50">
            <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white p-4 shadow-sm">
                <div className="mb-6 border-b border-zinc-100 pb-6">
                    <div className="flex justify-center">
                        <img
                            src="/images/turno-tm-logo.webp"
                            alt="Turno"
                            className="h-9 w-auto max-w-full object-contain"
                        />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-secondary/50">Workspace</p>
                    <p className="truncate font-semibold text-secondary">{user?.name}</p>
                    <p className="truncate text-xs text-secondary/60">{user?.plan?.name ?? 'Plan'}</p>
                </div>
                <nav className="flex flex-1 flex-col gap-1">
                    <NavLink to="/" end className={linkClass}>
                        <IconHome />
                        Home
                    </NavLink>
                    <NavLink to="/shipping-labels" className={linkClass}>
                        <IconLabels />
                        Shipping Labels
                    </NavLink>
                    <NavLink to="/integrations" className={linkClass}>
                        <IconIntegrations />
                        Integrations
                    </NavLink>
                </nav>
                <button
                    type="button"
                    onClick={() => logout()}
                    className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-secondary/80 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                    <IconSignOut />
                    Sign out
                </button>
            </aside>
            <main className="flex-1 overflow-auto bg-zinc-50 p-8">{children}</main>
        </div>
    );
}
