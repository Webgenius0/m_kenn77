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

interface Payment {
    id: number;
    amount: number;
    status: string;
    method: string;
    created_at: string;
}

interface Booking {
    id: number;
    booking_number: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string | null;
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    pets: number;
    nights: number;
    price_per_night: string | number;
    subtotal: string | number;
    discount: string | number;
    total: string | number;
    currency: string;
    status: string;
    hospitable_synced: boolean;
    coupon_code: string | null;
    special_requests: string | null;
    created_at: string;
    property: Property;
    user?: User | null;
    payment?: Payment | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PaginatedBookings {
    data: Booking[];
    meta: PaginationMeta;
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

interface Stats {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    revenue: number;
    this_month_revenue: number;
}

interface Filters {
    status?: string;
    search?: string;
    property_id?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    bookings: PaginatedBookings;
    stats: Stats;
    filters: Filters;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    pending:   { label: 'Pending',   bg: '#fef3c7', color: '#92400e', icon: 'pending' },
    confirmed: { label: 'Confirmed', bg: '#d1fae5', color: '#065f46', icon: 'check_circle' },
    cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', icon: 'cancel' },
    completed: { label: 'Completed', bg: '#dbeafe', color: '#1e40af', icon: 'task_alt' },
    refunded:  { label: 'Refunded',  bg: '#f3f4f6', color: '#374151', icon: 'currency_exchange' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_STYLES[status] ?? { label: status, bg: '#f3f4f6', color: '#374151', icon: 'circle' };
    return (
        <span
            className="d-inline-flex align-items-center gap-1 fw-semibold"
            style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '13px', lineHeight: 1 }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

function formatCurrency(amount: string | number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BookingsIndex({ bookings, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status ?? 'all');

    const applyFilters = (overrides: Partial<Filters> = {}) => {
        router.get('/admin/bookings', {
            search,
            status: selectedStatus,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        applyFilters({ status });
    };

    const handleDelete = (id: number, bookingNumber: string) => {
        import('sweetalert2').then(({ default: Swal }) => {
            Swal.fire({
                title: `Delete Booking #${bookingNumber}?`,
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Yes, delete it',
            }).then((result) => {
                if (result.isConfirmed) {
                    router.delete(`/admin/bookings/${id}`);
                }
            });
        });
    };

    const statCards = [
        { label: 'Total Bookings', value: stats.total, icon: 'calendar_month', color: '#4f46e5', bg: '#eef2ff' },
        { label: 'Pending', value: stats.pending, icon: 'pending', color: '#d97706', bg: '#fef3c7' },
        { label: 'Confirmed', value: stats.confirmed, icon: 'check_circle', color: '#059669', bg: '#d1fae5' },
        { label: 'Completed', value: stats.completed, icon: 'task_alt', color: '#2563eb', bg: '#dbeafe' },
        { label: 'Cancelled', value: stats.cancelled, icon: 'cancel', color: '#dc2626', bg: '#fee2e2' },
        { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: 'payments', color: '#059669', bg: '#d1fae5' },
        { label: 'This Month Revenue', value: formatCurrency(stats.this_month_revenue), icon: 'trending_up', color: '#4f46e5', bg: '#eef2ff' },
    ];

    const statusTabs = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'refunded'];

    return (
        <>
            <Head title="Bookings" />
            <div className="main-content-container overflow-hidden" style={{ minHeight: '75vh' }}>

                {/* Page Header */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">Property Bookings</h3>
                        <p className="fs-16 text-muted mb-0">Track and manage all property booking details</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                    {statCards.map((card, i) => (
                        <div key={i} className="col-6 col-md-4 col-xl-3">
                            <div className="card border-0 rounded-10 h-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                <div className="card-body p-3 d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 48, height: 48, flexShrink: 0, backgroundColor: card.bg }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: card.color }}>{card.icon}</span>
                                    </div>
                                    <div>
                                        <div className="fw-bold fs-18 lh-1 mb-1">{card.value}</div>
                                        <div className="text-muted fs-13">{card.label}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Table Card */}
                <div className="card bg-white rounded-10 border border-white mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                    {/* Filters */}
                    <div className="p-3 border-bottom">
                        <div className="d-flex flex-wrap align-items-center gap-3">

                            {/* Search */}
                            <form onSubmit={handleSearchSubmit} className="d-flex gap-2" style={{ flex: '1 1 280px', minWidth: 200 }}>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0">
                                        <span className="material-symbols-outlined fs-18 text-muted">search</span>
                                    </span>
                                    <input
                                        id="booking-search"
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder="Search by booking #, guest name or email…"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-primary px-3">Search</button>
                                </div>
                            </form>

                            {/* Status Filter Tabs */}
                            <div className="d-flex gap-1 flex-wrap">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab}
                                        id={`filter-tab-${tab}`}
                                        type="button"
                                        className={`btn btn-sm px-3 py-1 rounded-pill ${selectedStatus === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => handleStatusChange(tab)}
                                        style={{ textTransform: 'capitalize', fontSize: '13px' }}
                                    >
                                        {tab === 'all' ? 'All' : STATUS_STYLES[tab]?.label ?? tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="default-table-area mx-minus-1 table-contact-list">
                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="fw-medium ps-3" scope="col">Booking #</th>
                                        <th className="fw-medium" scope="col">Guest</th>
                                        <th className="fw-medium" scope="col">Property</th>
                                        <th className="fw-medium" scope="col">Check-in / Check-out</th>
                                        <th className="fw-medium" scope="col">Guests</th>
                                        <th className="fw-medium" scope="col">Total</th>
                                        <th className="fw-medium" scope="col">Status</th>
                                        <th className="fw-medium" scope="col">Sync</th>
                                        <th className="fw-medium text-end pe-3" scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.data.length > 0 ? bookings.data.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="ps-3">
                                                <div className="fw-semibold text-primary fs-14">#{booking.booking_number}</div>
                                                <div className="text-muted fs-12">{formatDate(booking.created_at)}</div>
                                            </td>
                                            <td>
                                                <div className="fw-medium fs-14">{booking.guest_name}</div>
                                                <div className="text-muted fs-12">{booking.guest_email}</div>
                                            </td>
                                            <td>
                                                <div className="fw-medium fs-14">{booking.property?.name ?? '—'}</div>
                                                {booking.property?.location && (
                                                    <div className="text-muted fs-12 d-flex align-items-center gap-1">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span>
                                                        {booking.property.location}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fs-13">
                                                    <span className="fw-medium">{formatDate(booking.check_in)}</span>
                                                    <span className="text-muted mx-1">→</span>
                                                    <span className="fw-medium">{formatDate(booking.check_out)}</span>
                                                </div>
                                                <div className="text-muted fs-12">{booking.nights} night{booking.nights !== 1 ? 's' : ''}</div>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 fs-12 text-muted">
                                                    <span title="Adults">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span> {booking.adults}
                                                    </span>
                                                    {booking.children > 0 && (
                                                        <span title="Children">
                                                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>child_care</span> {booking.children}
                                                        </span>
                                                    )}
                                                    {booking.pets > 0 && (
                                                        <span title="Pets">
                                                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>pets</span> {booking.pets}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-semibold fs-14">{formatCurrency(booking.total, booking.currency)}</div>
                                                {Number(booking.discount) > 0 && (
                                                    <div className="text-success fs-12">
                                                        -{formatCurrency(booking.discount, booking.currency)} off
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge status={booking.status} />
                                            </td>
                                            <td>
                                                {booking.hospitable_synced ? (
                                                    <span
                                                        className="d-inline-flex align-items-center gap-1 fw-semibold"
                                                        style={{
                                                            backgroundColor: '#d1fae5',
                                                            color: '#065f46',
                                                            padding: '3px 10px',
                                                            borderRadius: '999px',
                                                            fontSize: '12px',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        title="Synced with Hospitable"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '13px', lineHeight: 1 }}>sync</span>
                                                        Synced
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="d-inline-flex align-items-center gap-1 fw-semibold"
                                                        style={{
                                                            backgroundColor: '#f3f4f6',
                                                            color: '#4b5563',
                                                            padding: '3px 10px',
                                                            borderRadius: '999px',
                                                            fontSize: '12px',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        title="Not Synced"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '13px', lineHeight: 1 }}>sync_disabled</span>
                                                        Not Synced
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-end gap-2 pe-3">
                                                    <Link
                                                        href={`/admin/bookings/${booking.id}`}
                                                        className="btn btn-sm btn-outline-primary px-2 py-1"
                                                        title="View booking details"
                                                        id={`view-booking-${booking.id}`}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>visibility</span>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger px-2 py-1"
                                                        title="Delete booking"
                                                        id={`delete-booking-${booking.id}`}
                                                        onClick={() => handleDelete(booking.id, booking.booking_number)}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={9} className="text-center py-5">
                                                <span className="material-symbols-outlined text-muted mb-2 d-block" style={{ fontSize: '48px' }}>calendar_month</span>
                                                <div className="text-muted fs-16">No bookings found</div>
                                                <div className="text-muted fs-14 mt-1">Try adjusting your filters</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {bookings.meta && bookings.meta.last_page > 1 && (
                        <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="text-muted fs-13">
                                Showing {bookings.meta.from}–{bookings.meta.to} of {bookings.meta.total} bookings
                            </div>
                            <div className="d-flex gap-1">
                                {bookings.links?.prev && (
                                    <Link href={bookings.links.prev} className="btn btn-sm btn-outline-secondary" id="pagination-prev">
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                                    </Link>
                                )}
                                {Array.from({ length: bookings.meta.last_page }, (_, i) => i + 1).map((page) => (
                                    <Link
                                        key={page}
                                        href={`/admin/bookings?page=${page}`}
                                        className={`btn btn-sm ${page === bookings.meta.current_page ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        id={`pagination-page-${page}`}
                                    >
                                        {page}
                                    </Link>
                                ))}
                                {bookings.links?.next && (
                                    <Link href={bookings.links.next} className="btn btn-sm btn-outline-secondary" id="pagination-next">
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
