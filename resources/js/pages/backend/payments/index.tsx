import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Property {
    id: number;
    name: string;
    title: string | null;
    location: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

interface Booking {
    id: number;
    booking_number: string;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone: string | null;
    check_in: string;
    check_out: string;
    total: string | number;
    currency: string;
    status: string;
    property?: Property | null;
    user?: User | null;
}

interface Payment {
    id: number;
    booking_id: number;
    transaction_id: string | null;
    amount: string | number;
    currency: string;
    payment_method: string | null;
    status: string;
    paid_at: string | null;
    created_at: string;
    payload?: any;
    booking?: Booking | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginatedPayments {
    data: Payment[];
    meta: PaginationMeta;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

interface GatewayStat {
    count: number;
    amount: number;
}

interface Stats {
    total_count: number;
    total_amount: number;
    completed_count: number;
    completed_amount: number;
    pending_count: number;
    pending_amount: number;
    refunded_count: number;
    refunded_amount: number;
    failed_count: number;
    failed_amount: number;
    stripe_count: number;
    stripe_amount: number;
    paypal_count: number;
    paypal_amount: number;
    this_month_amount: number;
    prev_month_amount: number;
    growth_rate: number;
    is_positive: boolean;
}

interface Filters {
    status?: string;
    payment_method?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    payments: PaginatedPayments;
    stats: Stats;
    filters: Filters;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    completed: { label: 'Completed', bg: '#d1fae5', color: '#065f46', icon: 'check_circle' },
    paid:      { label: 'Paid',      bg: '#d1fae5', color: '#065f46', icon: 'check_circle' },
    pending:   { label: 'Pending',   bg: '#fef3c7', color: '#92400e', icon: 'pending' },
    refunded:  { label: 'Refunded',  bg: '#f3e8ff', color: '#6b21a8', icon: 'currency_exchange' },
    failed:    { label: 'Failed',    bg: '#fee2e2', color: '#991b1b', icon: 'cancel' },
    cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', icon: 'block' },
};

function StatusBadge({ status }: { status: string }) {
    const norm = status?.toLowerCase() || 'pending';
    const cfg = STATUS_CONFIG[norm] ?? { label: status, bg: '#f3f4f6', color: '#374151', icon: 'circle' };
    return (
        <span
            className="d-inline-flex align-items-center gap-1 fw-semibold"
            style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', lineHeight: 1 }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

function GatewayBadge({ method }: { method: string | null }) {
    const norm = (method || 'card').toLowerCase();

    if (norm === 'stripe') {
        return (
            <span
                className="d-inline-flex align-items-center gap-1 fw-bold text-white px-2 py-1 rounded-2"
                style={{ backgroundColor: '#635bff', fontSize: '11px', letterSpacing: '0.4px' }}
                title="Stripe Checkout"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>credit_card</span>
                STRIPE
            </span>
        );
    }

    if (norm === 'paypal') {
        return (
            <span
                className="d-inline-flex align-items-center gap-1 fw-bold text-white px-2 py-1 rounded-2"
                style={{ backgroundColor: '#003087', fontSize: '11px', letterSpacing: '0.4px' }}
                title="PayPal Gateway"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>account_balance_wallet</span>
                PAYPAL
            </span>
        );
    }

    return (
        <span
            className="d-inline-flex align-items-center gap-1 fw-medium text-dark bg-light border px-2 py-1 rounded-2"
            style={{ fontSize: '11px' }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>payments</span>
            {norm.toUpperCase()}
        </span>
    );
}

function formatCurrency(amount: string | number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
    }).format(Number(amount) || 0);
}

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

export default function PaymentsIndex({ payments, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status ?? 'all');
    const [selectedMethod, setSelectedMethod] = useState(filters.payment_method ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal state for quick status update
    const [statusModalPayment, setStatusModalPayment] = useState<Payment | null>(null);
    const [newStatus, setNewStatus] = useState<string>('completed');
    const [statusNotes, setStatusNotes] = useState<string>('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

    const applyFilters = (overrides: Partial<Filters> = {}) => {
        router.get('/admin/payments', {
            search,
            status: selectedStatus,
            payment_method: selectedMethod,
            date_from: dateFrom,
            date_to: dateTo,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        applyFilters({ status });
    };

    const handleMethodFilter = (method: string) => {
        setSelectedMethod(method);
        applyFilters({ payment_method: method });
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedStatus('all');
        setSelectedMethod('all');
        setDateFrom('');
        setDateTo('');
        router.get('/admin/payments', {}, { preserveState: false });
    };

    const copyToClipboard = (text: string, id: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const handleDelete = (id: number, txn: string) => {
        import('sweetalert2').then(({ default: Swal }) => {
            Swal.fire({
                title: 'Delete Payment Record?',
                text: `Payment transaction ${txn} will be removed permanently.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Yes, delete',
            }).then((res) => {
                if (res.isConfirmed) {
                    router.delete(`/admin/payments/${id}`, {
                        preserveScroll: true,
                    });
                }
            });
        });
    };

    const openStatusModal = (payment: Payment) => {
        setStatusModalPayment(payment);
        setNewStatus(payment.status === 'paid' ? 'completed' : payment.status);
        setStatusNotes('');
    };

    const handleUpdateStatusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusModalPayment) return;

        setIsUpdatingStatus(true);
        router.put(`/admin/payments/${statusModalPayment.id}/status`, {
            status: newStatus,
            notes: statusNotes,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsUpdatingStatus(false);
                setStatusModalPayment(null);
            },
        });
    };

    const statusTabs = [
        { key: 'all', label: 'All Transactions' },
        { key: 'completed', label: 'Completed' },
        { key: 'pending', label: 'Pending' },
        { key: 'refunded', label: 'Refunded' },
        { key: 'failed', label: 'Failed' },
    ];

    const kpiCards = [
        {
            title: 'Total Tracked Volume',
            value: formatCurrency(stats.completed_amount),
            sub: `${stats.completed_count} successful payments`,
            icon: 'account_balance_wallet',
            color: '#4f46e5',
            bg: '#eef2ff',
        },
        {
            title: 'This Month Received',
            value: formatCurrency(stats.this_month_amount),
            sub: `${stats.growth_rate >= 0 ? '+' : ''}${stats.growth_rate}% vs last month`,
            icon: 'trending_up',
            color: '#059669',
            bg: '#d1fae5',
        },
        {
            title: 'Pending In Flow',
            value: formatCurrency(stats.pending_amount),
            sub: `${stats.pending_count} awaiting gateway settlement`,
            icon: 'schedule',
            color: '#d97706',
            bg: '#fef3c7',
        },
        {
            title: 'Refunded / Disputed',
            value: formatCurrency(stats.refunded_amount),
            sub: `${stats.refunded_count} refunded transactions`,
            icon: 'currency_exchange',
            color: '#7c3aed',
            bg: '#f5f3ff',
        },
    ];

    return (
        <>
            <Head title="Payment Tracking Management" />
            <div className="main-content-container overflow-hidden pb-4" style={{ minHeight: '80vh' }}>

                {/* Page Title & Actions */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 mt-2">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="material-symbols-outlined fs-26 text-primary">payments</span>
                            <h2 className="fs-22 fw-bold mb-0">Payment Tracking Management</h2>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fs-12 fw-semibold">
                                Live Tracking
                            </span>
                        </div>
                        <p className="fs-14 text-muted mb-0">
                            Monitor incoming revenues, gateway settlements (Stripe & PayPal), transaction audits, and dispute tracking.
                        </p>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <a
                            href={`/admin/payments/export/csv?${new URLSearchParams(filters as any).toString()}`}
                            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 fs-14 fw-medium"
                            id="export-payments-csv"
                            title="Export filtered records to CSV"
                        >
                            <span className="material-symbols-outlined fs-18">download</span>
                            Export CSV
                        </a>
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fs-14 fw-medium"
                            id="refresh-payments"
                        >
                            <span className="material-symbols-outlined fs-18">refresh</span>
                            Sync
                        </button>
                    </div>
                </div>

                {/* Financial KPI Cards */}
                <div className="row g-3 mb-4">
                    {kpiCards.map((kpi, idx) => (
                        <div key={idx} className="col-12 col-sm-6 col-xl-3">
                            <div className="card border-0 rounded-10 h-100 shadow-sm" style={{ background: '#fff' }}>
                                <div className="card-body p-3 p-md-4">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="fs-13 text-muted fw-medium">{kpi.title}</span>
                                        <div
                                            className="d-flex align-items-center justify-content-center rounded-circle"
                                            style={{ width: 42, height: 42, backgroundColor: kpi.bg }}
                                        >
                                            <span className="material-symbols-outlined fs-22" style={{ color: kpi.color }}>
                                                {kpi.icon}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="fs-24 fw-bold text-dark mb-1">{kpi.value}</div>
                                    <div className="fs-12 text-muted d-flex align-items-center gap-1">
                                        {kpi.sub}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Gateway Distribution Strip */}
                <div className="card border-0 rounded-10 shadow-sm mb-4 bg-white">
                    <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <span className="fs-13 text-muted fw-bold text-uppercase letter-spacing-1">Payment Gateways:</span>
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge px-2 py-1 d-flex align-items-center gap-1 fw-bold text-white" style={{ backgroundColor: '#635bff', fontSize: '12px' }}>
                                    <span className="material-symbols-outlined fs-14">credit_card</span>
                                    Stripe: {formatCurrency(stats.stripe_amount)} ({stats.stripe_count} txns)
                                </span>
                                <span className="badge px-2 py-1 d-flex align-items-center gap-1 fw-bold text-white" style={{ backgroundColor: '#003087', fontSize: '12px' }}>
                                    <span className="material-symbols-outlined fs-14">account_balance_wallet</span>
                                    PayPal: {formatCurrency(stats.paypal_amount)} ({stats.paypal_count} txns)
                                </span>
                            </div>
                        </div>
                        <div className="fs-13 text-muted">
                            Total Processed: <strong>{stats.total_count} transactions</strong>
                        </div>
                    </div>
                </div>

                {/* Main Filter & Transactions Table */}
                <div className="card bg-white rounded-10 border-0 shadow-sm mb-4">
                    {/* Filters Bar */}
                    <div className="p-3 border-bottom">
                        <div className="row g-2 align-items-center">
                            {/* Search */}
                            <div className="col-12 col-md-4">
                                <form onSubmit={handleSearchSubmit}>
                                    <div className="input-group">
                                        <span className="input-group-text bg-transparent border-end-0 text-muted">
                                            <span className="material-symbols-outlined fs-18">search</span>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control border-start-0 ps-0 fs-14"
                                            placeholder="Search Transaction ID, booking #, guest name or email…"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            id="payment-search-input"
                                        />
                                        <button type="submit" className="btn btn-primary px-3 fs-14">Search</button>
                                    </div>
                                </form>
                            </div>

                            {/* Method Selector */}
                            <div className="col-6 col-md-2">
                                <select
                                    className="form-select fs-14"
                                    value={selectedMethod}
                                    onChange={(e) => handleMethodFilter(e.target.value)}
                                    id="filter-payment-method"
                                >
                                    <option value="all">All Gateways</option>
                                    <option value="stripe">Stripe</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="cash">Cash / Bank</option>
                                </select>
                            </div>

                            {/* Date From */}
                            <div className="col-6 col-md-2">
                                <input
                                    type="date"
                                    className="form-control fs-14"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        applyFilters({ date_from: e.target.value });
                                    }}
                                    title="From Date"
                                />
                            </div>

                            {/* Date To */}
                            <div className="col-6 col-md-2">
                                <input
                                    type="date"
                                    className="form-control fs-14"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        applyFilters({ date_to: e.target.value });
                                    }}
                                    title="To Date"
                                />
                            </div>

                            {/* Reset Button */}
                            <div className="col-6 col-md-2 text-end">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-100 fs-14 d-flex align-items-center justify-content-center gap-1"
                                    onClick={handleResetFilters}
                                >
                                    <span className="material-symbols-outlined fs-16">filter_alt_off</span>
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Status Tabs */}
                        <div className="d-flex gap-1 flex-wrap mt-3 pt-2 border-top">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    id={`tab-status-${tab.key}`}
                                    className={`btn btn-sm px-3 py-1 rounded-pill ${
                                        selectedStatus === tab.key ? 'btn-primary' : 'btn-outline-secondary'
                                    }`}
                                    onClick={() => handleStatusFilter(tab.key)}
                                    style={{ fontSize: '13px' }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="default-table-area table-responsive">
                        <table className="table align-middle mb-0" id="payments-table">
                            <thead className="table-light">
                                <tr className="text-muted fs-12 text-uppercase fw-semibold">
                                    <th className="ps-3 py-3" style={{ minWidth: 160 }}>Transaction ID</th>
                                    <th style={{ minWidth: 170 }}>Booking & Property</th>
                                    <th style={{ minWidth: 160 }}>Customer / Guest</th>
                                    <th style={{ minWidth: 110 }}>Gateway</th>
                                    <th style={{ minWidth: 120 }}>Amount</th>
                                    <th style={{ minWidth: 110 }}>Status</th>
                                    <th style={{ minWidth: 140 }}>Payment Date</th>
                                    <th className="text-end pe-3" style={{ minWidth: 130 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.data.length > 0 ? (
                                    payments.data.map((payment) => {
                                        const txnDisplay = payment.transaction_id || `TXN-${String(payment.id).padStart(6, '0')}`;
                                        const isCopied = copiedId === String(payment.id);
                                        const bookingNum = payment.booking?.booking_number || `#BK-${payment.booking_id}`;
                                        const guestName = payment.booking?.guest_name || payment.booking?.user?.name || 'Guest User';
                                        const guestEmail = payment.booking?.guest_email || payment.booking?.user?.email || 'N/A';
                                        const propertyTitle = payment.booking?.property?.title || payment.booking?.property?.name || 'Property Unit';

                                        return (
                                            <tr key={payment.id} className="hover-shadow-sm">
                                                {/* Transaction ID */}
                                                <td className="ps-3">
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span
                                                            className="badge bg-light text-dark border font-monospace fs-12 px-2 py-1 text-truncate"
                                                            style={{ maxWidth: 140 }}
                                                            title={txnDisplay}
                                                        >
                                                            {txnDisplay}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-link p-0 text-muted"
                                                            onClick={() => copyToClipboard(txnDisplay, String(payment.id))}
                                                            title="Copy Transaction ID"
                                                        >
                                                            <span className="material-symbols-outlined fs-16">
                                                                {isCopied ? 'check' : 'content_copy'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    <span className="fs-11 text-muted d-block mt-1">
                                                        ID: #{payment.id}
                                                    </span>
                                                </td>

                                                {/* Booking & Property */}
                                                <td>
                                                    <Link
                                                        href={`/admin/bookings/${payment.booking_id}`}
                                                        className="fw-bold text-primary hover-text text-decoration-none d-block fs-13"
                                                        title="View Booking"
                                                    >
                                                        {bookingNum}
                                                    </Link>
                                                    <span className="fs-12 text-muted text-truncate d-block" style={{ maxWidth: 160 }} title={propertyTitle}>
                                                        {propertyTitle}
                                                    </span>
                                                </td>

                                                {/* Customer */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-bold fs-12 flex-shrink-0"
                                                            style={{ width: 32, height: 32 }}
                                                        >
                                                            {guestName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <div className="fw-medium fs-13 text-dark text-truncate" style={{ maxWidth: 140 }}>
                                                                {guestName}
                                                            </div>
                                                            <div className="fs-11 text-muted text-truncate" style={{ maxWidth: 140 }}>
                                                                {guestEmail}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Gateway */}
                                                <td>
                                                    <GatewayBadge method={payment.payment_method} />
                                                </td>

                                                {/* Amount */}
                                                <td>
                                                    <div className="fw-bold fs-14 text-dark">
                                                        {formatCurrency(payment.amount, payment.currency)}
                                                    </div>
                                                    <span className="fs-11 text-muted text-uppercase">{payment.currency || 'USD'}</span>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    <StatusBadge status={payment.status} />
                                                </td>

                                                {/* Date */}
                                                <td>
                                                    <div className="fs-12 text-dark">
                                                        {formatDate(payment.paid_at || payment.created_at)}
                                                    </div>
                                                    <span className="fs-11 text-muted">
                                                        {payment.paid_at ? 'Settled' : 'Created'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="text-end pe-3">
                                                    <div className="d-inline-flex align-items-center gap-1">
                                                        {/* View Details */}
                                                        <Link
                                                            href={`/admin/payments/${payment.id}`}
                                                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center p-1"
                                                            title="Inspect Payment Audit & Payload"
                                                        >
                                                            <span className="material-symbols-outlined fs-16">visibility</span>
                                                        </Link>

                                                        {/* Quick Status Update */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center p-1"
                                                            title="Update Status"
                                                            onClick={() => openStatusModal(payment)}
                                                        >
                                                            <span className="material-symbols-outlined fs-16">edit_note</span>
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center p-1"
                                                            title="Delete Payment"
                                                            onClick={() => handleDelete(payment.id, txnDisplay)}
                                                        >
                                                            <span className="material-symbols-outlined fs-16">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center py-5">
                                            <div className="d-flex flex-column align-items-center justify-content-center">
                                                <span className="material-symbols-outlined text-muted mb-2" style={{ fontSize: '48px' }}>
                                                    receipt_long
                                                </span>
                                                <h5 className="fs-16 fw-semibold text-dark">No Payment Transactions Found</h5>
                                                <p className="fs-13 text-muted mb-3">
                                                    There are no payments matching your selected criteria or search term.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={handleResetFilters}
                                                >
                                                    Clear All Filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {payments.meta && payments.meta.total > 0 && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                            <span className="fs-13 text-muted">
                                Showing {payments.meta.from ?? 0}–{payments.meta.to ?? 0} of {payments.meta.total} records
                            </span>

                            {payments.meta.last_page > 1 && (
                                <div className="d-flex align-items-center gap-1">
                                    {payments.links.prev && (
                                        <Link
                                            href={payments.links.prev}
                                            className="btn btn-sm btn-outline-secondary px-2 py-1 fs-12"
                                            preserveScroll
                                        >
                                            Previous
                                        </Link>
                                    )}

                                    {Array.from({ length: payments.meta.last_page }, (_, i) => i + 1).map((page) => (
                                        <Link
                                            key={page}
                                            href={`/admin/payments?page=${page}&${new URLSearchParams(filters as any).toString()}`}
                                            className={`btn btn-sm px-2 py-1 fs-12 ${
                                                page === payments.meta.current_page ? 'btn-primary' : 'btn-outline-secondary'
                                            }`}
                                            preserveScroll
                                        >
                                            {page}
                                        </Link>
                                    ))}

                                    {payments.links.next && (
                                        <Link
                                            href={payments.links.next}
                                            className="btn btn-sm btn-outline-secondary px-2 py-1 fs-12"
                                            preserveScroll
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Status Modal */}
                {statusModalPayment && (
                    <div
                        className="modal fade show d-block"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                        tabIndex={-1}
                        role="dialog"
                    >
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow rounded-10">
                                <form onSubmit={handleUpdateStatusSubmit}>
                                    <div className="modal-header border-bottom py-3">
                                        <h5 className="modal-title fs-16 fw-bold">
                                            Update Payment Status
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setStatusModalPayment(null)}
                                        ></button>
                                    </div>
                                    <div className="modal-body p-4">
                                        <div className="mb-3">
                                            <div className="fs-12 text-muted mb-1">Transaction Reference</div>
                                            <div className="fw-bold font-monospace fs-14 text-dark">
                                                {statusModalPayment.transaction_id || `TXN-${statusModalPayment.id}`}
                                            </div>
                                            <div className="fs-13 text-muted mt-1">
                                                Amount: <strong>{formatCurrency(statusModalPayment.amount, statusModalPayment.currency)}</strong>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fs-13 fw-semibold">New Payment Status</label>
                                            <select
                                                className="form-select fs-14"
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                            >
                                                <option value="completed">Completed / Settled</option>
                                                <option value="pending">Pending</option>
                                                <option value="refunded">Refunded</option>
                                                <option value="failed">Failed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        <div className="mb-2">
                                            <label className="form-label fs-13 fw-semibold">Audit Notes (Optional)</label>
                                            <textarea
                                                className="form-control fs-14"
                                                rows={3}
                                                placeholder="e.g., Manual verification, bank wire confirmed, customer request for refund..."
                                                value={statusNotes}
                                                onChange={(e) => setStatusNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer border-top py-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setStatusModalPayment(null)}
                                            disabled={isUpdatingStatus}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-sm btn-primary"
                                            disabled={isUpdatingStatus}
                                        >
                                            {isUpdatingStatus ? 'Saving...' : 'Confirm Status Update'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
