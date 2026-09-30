import { Head, Link, router, useForm } from '@inertiajs/react';

interface PropertyImage {
    id: number;
    image_path: string;
    is_primary: boolean;
}

interface DestinationType {
    id: number;
    name: string;
}

interface Property {
    id: number;
    name: string;
    title: string | null;
    location: string | null;
    address: string | null;
    price_per_night: number | string | null;
    max_guests: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    airbnb_property_url: string | null;
    destination_type?: DestinationType | null;
    images?: PropertyImage[];
}

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    created_at: string;
}

interface Payment {
    id: number;
    amount: number;
    status: string;
    payment_method?: string | null;
    transaction_id?: string | null;
    currency: string;
    created_at: string;
}

interface Coupon {
    id: number;
    code: string;
    discount_type: string;
    discount_value: number;
}

interface Booking {
    id: number;
    booking_number: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string | null;
    special_requests: string | null;
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
    hospitable_sync_error: string | null;
    coupon_code: string | null;
    created_at: string;
    updated_at: string;
    property?: Property | null;
    user?: User | null;
    payments?: Payment[];
    coupon?: Coupon | null;
}

interface Props {
    booking: Booking;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];

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
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
            }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', lineHeight: 1 }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

function formatCurrency(amount: string | number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(date: string) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: string }) {
    return (
        <div className="d-flex align-items-start gap-2 py-2 border-bottom" style={{ minHeight: 40 }}>
            {icon && (
                <span className="material-symbols-outlined text-muted mt-1" style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
            )}
            <div className="flex-grow-1 d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <span className="text-muted fs-13" style={{ minWidth: 120 }}>{label}</span>
                <span className="fw-medium fs-14 text-end">{value ?? '—'}</span>
            </div>
        </div>
    );
}

export default function BookingShow({ booking }: Props) {
    const { data, setData, put, processing } = useForm({ status: booking.status });

    const primaryImage = booking.property?.images?.find((img) => img.is_primary) ?? booking.property?.images?.[0];

    const handleStatusUpdate = () => {
        put(`/admin/bookings/${booking.id}/status`, {
            onSuccess: () => {
                import('sweetalert2').then(({ default: Swal }) => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Status Updated',
                        text: `Booking status changed to ${STATUS_STYLES[data.status]?.label ?? data.status}.`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                });
            },
        });
    };

    const handleDelete = () => {
        import('sweetalert2').then(({ default: Swal }) => {
            Swal.fire({
                title: `Delete Booking #${booking.booking_number}?`,
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Yes, delete it',
            }).then((result) => {
                if (result.isConfirmed) {
                    router.delete(`/admin/bookings/${booking.id}`);
                }
            });
        });
    };

    const nights = booking.nights;
    const checkInDate = new Date(booking.check_in);
    const checkOutDate = new Date(booking.check_out);
    const duration = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <>
            <Head title={`Booking #${booking.booking_number}`} />
            <div className="main-content-container overflow-hidden" style={{ minHeight: '75vh' }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div className="d-flex align-items-center gap-3">
                        <Link href="/admin/bookings" className="btn btn-sm btn-outline-secondary" id="back-to-bookings">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>arrow_back</span>
                        </Link>
                        <div>
                            <h3 className="mb-0 d-flex align-items-center gap-2">
                                Booking #{booking.booking_number}
                                <StatusBadge status={booking.status} />
                            </h3>
                            <p className="fs-14 text-muted mb-0">Created {formatDateTime(booking.created_at)}</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            id="delete-booking-btn"
                            onClick={handleDelete}
                        >
                            <span className="material-symbols-outlined me-1" style={{ fontSize: '16px', verticalAlign: 'middle' }}>delete</span>
                            Delete
                        </button>
                    </div>
                </div>

                <div className="row g-4">

                    {/* LEFT COLUMN */}
                    <div className="col-lg-8">

                        {/* Property Card */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">location_city</span>
                                <h5 className="mb-0 fw-semibold">Property Details</h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="d-flex align-items-stretch gap-0">
                                    {/* Property Image */}
                                    {primaryImage && (
                                        <div style={{ width: 180, flexShrink: 0 }}>
                                            <img
                                                src={`${primaryImage.image_path}`}
                                                alt={booking.property?.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0 0 0 10px' }}
                                            />
                                        </div>
                                    )}
                                    <div className="p-4 flex-grow-1">
                                        <div className="fw-bold fs-16 mb-1">
                                            {booking.property?.title || booking.property?.name}
                                        </div>
                                        {booking.property?.destination_type && (
                                            <span
                                                className="d-inline-flex align-items-center gap-1 fw-semibold mb-2"
                                                style={{
                                                    backgroundColor: '#e0e7ff',
                                                    color: '#3730a3',
                                                    padding: '3px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {booking.property.destination_type.name}
                                            </span>
                                        )}
                                        <div className="row g-2 mt-2">
                                            {booking.property?.location && (
                                                <div className="col-12">
                                                    <span className="d-flex align-items-center gap-1 text-muted fs-13">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
                                                        {booking.property.location}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="col-auto">
                                                <span className="d-flex align-items-center gap-1 fs-13">
                                                    <span className="material-symbols-outlined text-muted" style={{ fontSize: '15px' }}>bed</span>
                                                    {booking.property?.bedrooms ?? '—'} Bedrooms
                                                </span>
                                            </div>
                                            <div className="col-auto">
                                                <span className="d-flex align-items-center gap-1 fs-13">
                                                    <span className="material-symbols-outlined text-muted" style={{ fontSize: '15px' }}>bathroom</span>
                                                    {booking.property?.bathrooms ?? '—'} Bathrooms
                                                </span>
                                            </div>
                                            <div className="col-auto">
                                                <span className="d-flex align-items-center gap-1 fs-13">
                                                    <span className="material-symbols-outlined text-muted" style={{ fontSize: '15px' }}>group</span>
                                                    Max {booking.property?.max_guests ?? '—'} guests
                                                </span>
                                            </div>
                                        </div>
                                        {booking.property?.airbnb_property_url && (
                                            <a
                                                href={booking.property.airbnb_property_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary mt-3"
                                                id="view-on-airbnb"
                                            >
                                                <span className="material-symbols-outlined me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>open_in_new</span>
                                                View on Airbnb
                                            </a>
                                        )}
                                        <Link href={`/admin/properties/${booking.property?.id}`} className="btn btn-sm btn-outline-secondary mt-3 ms-2" id="view-property-admin">
                                            <span className="material-symbols-outlined me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>visibility</span>
                                            View Property
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking Dates & Guests */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                <h5 className="mb-0 fw-semibold">Stay Details</h5>
                            </div>
                            <div className="card-body">
                                {/* Date Timeline */}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
                                            <div className="text-muted fs-12 mb-1">CHECK-IN</div>
                                            <div className="fw-bold fs-20 text-primary">{checkInDate.getDate()}</div>
                                            <div className="text-muted fs-13">{checkInDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-4 d-flex align-items-center justify-content-center">
                                        <div className="text-center">
                                            <div className="text-muted fs-12 mb-1">DURATION</div>
                                            <div className="fw-bold fs-22">{duration}</div>
                                            <div className="text-muted fs-13">Night{duration !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                            <div className="text-muted fs-12 mb-1">CHECK-OUT</div>
                                            <div className="fw-bold fs-20 text-success">{checkOutDate.getDate()}</div>
                                            <div className="text-muted fs-13">{checkOutDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Guests */}
                                <div className="row g-3">
                                    <div className="col-4">
                                        <div className="d-flex align-items-center gap-2 p-3 rounded-3 border">
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '22px' }}>person</span>
                                            <div>
                                                <div className="fw-bold fs-16">{booking.adults}</div>
                                                <div className="text-muted fs-12">Adult{booking.adults !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="d-flex align-items-center gap-2 p-3 rounded-3 border">
                                            <span className="material-symbols-outlined text-warning" style={{ fontSize: '22px' }}>child_care</span>
                                            <div>
                                                <div className="fw-bold fs-16">{booking.children}</div>
                                                <div className="text-muted fs-12">Children</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="d-flex align-items-center gap-2 p-3 rounded-3 border">
                                            <span className="material-symbols-outlined text-success" style={{ fontSize: '22px' }}>pets</span>
                                            <div>
                                                <div className="fw-bold fs-16">{booking.pets}</div>
                                                <div className="text-muted fs-12">Pets</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Special Requests */}
                                {booking.special_requests && (
                                    <div className="mt-3 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px dashed #e2e8f0' }}>
                                        <div className="d-flex align-items-center gap-1 text-muted fs-12 mb-1">
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>sticky_note_2</span>
                                            Special Requests
                                        </div>
                                        <p className="mb-0 fs-14">{booking.special_requests}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment History */}
                        {booking.payments && booking.payments.length > 0 && (
                            <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                    <span className="material-symbols-outlined text-primary">payments</span>
                                    <h5 className="mb-0 fw-semibold">Payment History</h5>
                                </div>
                                <div className="table-responsive">
                                    <table className="table mb-0 align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="fw-medium ps-3">Transaction ID</th>
                                                <th className="fw-medium">Method</th>
                                                <th className="fw-medium">Amount</th>
                                                <th className="fw-medium">Status</th>
                                                <th className="fw-medium pe-3">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {booking.payments.map((payment) => (
                                                <tr key={payment.id}>
                                                    <td className="ps-3 fs-13 text-muted">{payment.transaction_id ?? `#${payment.id}`}</td>
                                                    <td className="fs-13" style={{ textTransform: 'capitalize' }}>{payment.payment_method ?? '—'}</td>
                                                    <td className="fw-semibold">{formatCurrency(payment.amount, payment.currency)}</td>
                                                    <td>
                                                        <span
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '2px 10px',
                                                                borderRadius: '999px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                backgroundColor: payment.status === 'paid' || payment.status === 'success' ? '#d1fae5' : '#fef3c7',
                                                                color: payment.status === 'paid' || payment.status === 'success' ? '#065f46' : '#92400e',
                                                            }}
                                                        >
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="pe-3 fs-13 text-muted">{formatDateTime(payment.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="col-lg-4">

                        {/* Status Update */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">edit_note</span>
                                <h5 className="mb-0 fw-semibold">Update Status</h5>
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label htmlFor="booking-status-select" className="form-label fw-medium fs-14">Booking Status</label>
                                    <select
                                        id="booking-status-select"
                                        className="form-select"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                                                {STATUS_STYLES[s]?.label ?? s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary w-100"
                                    id="update-status-btn"
                                    onClick={handleStatusUpdate}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Updating…
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined me-1" style={{ fontSize: '16px', verticalAlign: 'middle' }}>save</span>
                                            Save Status
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Pricing Summary */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                <h5 className="mb-0 fw-semibold">Price Breakdown</h5>
                            </div>
                            <div className="card-body">
                                <div className="d-flex justify-content-between fs-14 mb-2">
                                    <span className="text-muted">{formatCurrency(booking.price_per_night, booking.currency)} × {booking.nights} nights</span>
                                    <span className="fw-medium">{formatCurrency(booking.subtotal, booking.currency)}</span>
                                </div>
                                {Number(booking.discount) > 0 && (
                                    <div className="d-flex justify-content-between fs-14 mb-2 text-success">
                                        <span>
                                            Discount
                                            {booking.coupon_code && (
                                                <span
                                                    className="ms-2 fw-semibold"
                                                    style={{
                                                        backgroundColor: '#d1fae5',
                                                        color: '#065f46',
                                                        padding: '2px 8px',
                                                        borderRadius: '999px',
                                                        fontSize: '11px',
                                                    }}
                                                >
                                                    {booking.coupon_code}
                                                </span>
                                            )}
                                        </span>
                                        <span>−{formatCurrency(booking.discount, booking.currency)}</span>
                                    </div>
                                )}
                                <hr className="my-2" />
                                <div className="d-flex justify-content-between">
                                    <span className="fw-bold fs-15">Total</span>
                                    <span className="fw-bold fs-18 text-primary">{formatCurrency(booking.total, booking.currency)}</span>
                                </div>
                                <div className="text-muted fs-12 text-end">{booking.currency}</div>
                            </div>
                        </div>

                        {/* Guest Information */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">account_circle</span>
                                <h5 className="mb-0 fw-semibold">Guest Information</h5>
                            </div>
                            <div className="card-body">
                                {/* Avatar + name */}
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    {booking.user?.avatar ? (
                                        <img src={booking.user.avatar} alt={booking.guest_name} className="rounded-circle" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                                    ) : (
                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, flexShrink: 0, backgroundColor: '#eef2ff' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4f46e5' }}>person</span>
                                        </div>
                                    )}
                                    <div>
                                        <div className="fw-semibold fs-15">{booking.guest_name}</div>
                                        {booking.user && (
                                            <div className="text-muted fs-12">Registered Member</div>
                                        )}
                                    </div>
                                </div>
                                <InfoRow label="Email" icon="email" value={
                                    <a href={`mailto:${booking.guest_email}`} className="text-primary">{booking.guest_email}</a>
                                } />
                                {booking.guest_phone && (
                                    <InfoRow label="Phone" icon="call" value={
                                        <a href={`tel:${booking.guest_phone}`} className="text-primary">{booking.guest_phone}</a>
                                    } />
                                )}
                                {booking.user && (
                                    <div className="mt-3">
                                        <Link href={`/admin/user/show/${booking.user.id}`} className="btn btn-sm btn-outline-secondary w-100" id="view-user-profile">
                                            <span className="material-symbols-outlined me-1" style={{ fontSize: '14px', verticalAlign: 'middle' }}>person_search</span>
                                            View User Profile
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hospitable Sync Status */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">sync</span>
                                <h5 className="mb-0 fw-semibold">Hospitable Sync</h5>
                            </div>
                            <div className="card-body">
                                {booking.hospitable_synced ? (
                                    <div className="d-flex align-items-center gap-2 text-success">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                                        <span className="fw-medium">Synced with Hospitable</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="d-flex align-items-center gap-2 text-warning mb-2">
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>sync_problem</span>
                                            <span className="fw-medium">Not Synced</span>
                                        </div>
                                        {booking.hospitable_sync_error && (
                                            <div className="p-2 rounded-2 fs-12 text-danger" style={{ background: 'rgba(239,68,68,0.08)' }}>
                                                {booking.hospitable_sync_error}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Booking Meta */}
                        <div className="card border-0 rounded-10 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div className="card-header bg-transparent border-bottom d-flex align-items-center gap-2 py-3">
                                <span className="material-symbols-outlined text-primary">info</span>
                                <h5 className="mb-0 fw-semibold">Booking Info</h5>
                            </div>
                            <div className="card-body">
                                <InfoRow label="Booking #" icon="tag" value={`#${booking.booking_number}`} />
                                <InfoRow label="Created At" icon="schedule" value={formatDateTime(booking.created_at)} />
                                <InfoRow label="Last Updated" icon="update" value={formatDateTime(booking.updated_at)} />
                                {booking.coupon_code && (
                                    <InfoRow label="Coupon Used" icon="local_offer" value={
                                        <span
                                            className="fw-semibold"
                                            style={{
                                                backgroundColor: '#d1fae5',
                                                color: '#065f46',
                                                padding: '3px 10px',
                                                borderRadius: '999px',
                                                fontSize: '12px',
                                            }}
                                        >
                                            {booking.coupon_code}
                                        </span>
                                    } />
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
