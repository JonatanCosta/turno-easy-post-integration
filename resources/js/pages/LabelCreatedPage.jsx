import { Link, useLocation } from 'react-router-dom';

export default function LabelCreatedPage() {
    const location = useLocation();
    const label = location.state?.label;

    if (!label) {
        return (
            <div className="mx-auto max-w-lg text-center">
                <p className="text-secondary/70">No label data. Start from Shipping Labels.</p>
                <Link to="/shipping-labels" className="mt-4 inline-block font-medium text-primary hover:text-primary/85">
                    Go to Shipping Labels
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg rounded-2xl border border-primary/25 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-secondary">Label ready</h1>
            <p className="mt-2 text-sm text-secondary/70">
                {label.carrier} · {label.tracking_code ?? 'Tracking pending'}
            </p>
            {label.label_url ? (
                <a
                    href={label.label_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                >
                    Print / download
                </a>
            ) : null}
            <div className="mt-8">
                <Link to="/shipping-labels" className="text-sm text-secondary/60 hover:text-secondary">
                    Back to history
                </Link>
            </div>
        </div>
    );
}
