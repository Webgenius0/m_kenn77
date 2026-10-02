import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface PropertyImage {
    id: number;
    image_path: string;
    is_primary?: boolean;
}

interface Property {
    id: number;
    name: string;
    title: string | null;
    location: string | null;
    price_per_night?: number | string;
    images?: PropertyImage[];
}

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
}

interface Coupon {
    id: number;
    code: string;
    discount_amount?: number | string;
}

interface Booking {
    id: number;
    booking_number: string;
    guest_name: string | null;
    guest_email: string | null;
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
    property?: Property | null;
    user?: User | null;
    coupon?: Coupon | null;
    payments?: Payment[];
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
    updated_at: string;
    payload?: any;
    booking?: Booking | null;
}

interface Props {
    payment: Payment;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    completed: { label: 'Completed', bg: '#d1fae5', color: '#065f46', icon: 'check_circle' },
    paid:      { label: 'Paid',      bg: '#d1fae5', color: '#065f46', icon: 'check_circle' },
    pending:   { label: 'Pending',   bg: '#fef3c7', color: '#92400e', icon: 'pending' },
    refunded:  { label: 'Refunded',  bg: '#f3e8ff', color: '#6b21a8', icon: 'currency_exchange' },
    failed:    { label: 'Failed',    bg: '#fee2e2', color: '#991b1b', icon: 'cancel' },
    cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', icon: 'block' },
};

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

export default function PaymentShow({ payment }: Props) {
    const page = usePage();
    const { setting } = page.props as any;

    const [copied, setCopied] = useState<boolean>(false);
    const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
    const [newStatus, setNewStatus] = useState<string>(payment.status === 'paid' ? 'completed' : payment.status);
    const [notes, setNotes] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    const booking = payment.booking;
    const property = booking?.property;
    const propertyImg = property?.images?.find((img) => img.is_primary)?.image_path || property?.images?.[0]?.image_path;

    const logo = setting?.light_logo ? `/${setting.light_logo}` : '/backend/assets/images/seller1.png';
    const systemName = setting?.system_name || 'Property Rentals & Bookings';
    const systemEmail = setting?.email || 'support@m-kenn77.com';
    const systemPhone = setting?.phone || '';
    const systemAddress = setting?.address || '';

    const copyTxn = () => {
        if (payment.transaction_id && navigator.clipboard) {
            navigator.clipboard.writeText(payment.transaction_id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleStatusSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        router.put(`/admin/payments/${payment.id}/status`, {
            status: newStatus,
            notes,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsUpdating(false);
                setStatusModalOpen(false);
            },
        });
    };

    // Prints ONLY the payment receipt through an isolated hidden iframe
    const handlePrint = () => {
        const printContent = document.getElementById('payment-receipt-printable');
        if (!printContent) {
            window.print();
            return;
        }

        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);

        const doc = printFrame.contentWindow?.document;
        if (!doc) {
            window.print();
            return;
        }

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <title>Payment Receipt #${payment.id}</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
                <style>
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        background: #ffffff !important;
                        color: #1e293b !important;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        padding: 30px;
                        margin: 0;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    .receipt-card {
                        max-width: 820px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 32px;
                        background: #ffffff;
                    }
                    .stamp-paid {
                        display: inline-block;
                        padding: 6px 14px;
                        border: 2px solid #059669;
                        color: #059669;
                        border-radius: 6px;
                        font-weight: 800;
                        font-size: 13px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        background: rgba(5, 150, 105, 0.06);
                    }
                    .stamp-pending {
                        display: inline-block;
                        padding: 6px 14px;
                        border: 2px solid #d97706;
                        color: #d97706;
                        border-radius: 6px;
                        font-weight: 800;
                        font-size: 13px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        background: rgba(217, 119, 6, 0.06);
                    }
                    .stamp-refunded {
                        display: inline-block;
                        padding: 6px 14px;
                        border: 2px solid #7c3aed;
                        color: #7c3aed;
                        border-radius: 6px;
                        font-weight: 800;
                        font-size: 13px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        background: rgba(124, 58, 237, 0.06);
                    }
                    .table-custom {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 16px;
                        margin-bottom: 24px;
                    }
                    .table-custom th {
                        background-color: #f8fafc;
                        color: #475569;
                        padding: 12px 14px;
                        font-size: 12px;
                        text-transform: uppercase;
                        font-weight: 700;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .table-custom td {
                        padding: 12px 14px;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 13px;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        window.focus();
                        window.print();
                        setTimeout(function() {
                            window.frameElement?.remove();
                        }, 1200);
                    };
                </script>
            </body>
            </html>
        `);
        doc.close();
    };

    const cfg = STATUS_CONFIG[payment.status?.toLowerCase()] ?? {
        label: payment.status,
        bg: '#f3f4f6',
        color: '#374151',
        icon: 'circle',
    };

    // Extract helpful details from payload if present
    const payload = payment.payload;
    const paymentIntent = payload?.payment_intent || payload?.id;
    const customerEmail = payload?.customer_email || payload?.customer_details?.email || booking?.guest_email;
    const customerName = payload?.customer_details?.name || booking?.guest_name;
    const adminNotes = Array.isArray(payload?.admin_notes) ? payload.admin_notes : [];

    return (
        <>
            <Head title={`Payment #${payment.id} Details - ${payment.transaction_id || ''}`} />

            {/* Print style block for browser Ctrl+P shortcut fallback */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #payment-receipt-printable,
                    #payment-receipt-printable * {
                        visibility: visible !important;
                    }
                    #payment-receipt-printable {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        display: block !important;
                        margin: 0 !important;
                        padding: 24px !important;
                        background: #ffffff !important;
                        z-index: 9999999 !important;
                    }
                    .sidebar-area,
                    .main-navbar,
                    .header-area,
                    .footer-area,
                    .btn,
                    .modal,
                    .main-content-container,
                    .no-print {
                        display: none !important;
                    }
                }
            `}} />

            <div className="main-content-container overflow-hidden pb-4" style={{ minHeight: '80vh' }}>

                {/* Back and Page Header */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-2">
                    <div className="d-flex align-items-center gap-3">
                        <Link
                            href="/admin/payments"
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-2 rounded-circle"
                            title="Back to Payments"
                        >
                            <span className="material-symbols-outlined fs-20">arrow_back</span>
                        </Link>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h3 className="mb-0 fs-20 fw-bold">Payment Transaction Audit</h3>
                                <span
                                    className="d-inline-flex align-items-center gap-1 fw-bold fs-12 px-2 py-1 rounded-pill"
                                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cfg.icon}</span>
                                    {cfg.label}
                                </span>
                            </div>
                            <span className="fs-13 text-muted">
                                Recorded on {formatDate(payment.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-primary d-flex align-items-center gap-1 fs-14 px-3 py-2"
                            onClick={handlePrint}
                            title="Print Official Payment Receipt (Receipt Only)"
                        >
                            <span className="material-symbols-outlined fs-18">print</span>
                            Print Receipt
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary d-flex align-items-center gap-1 fs-14 px-3 py-2"
                            onClick={() => setStatusModalOpen(true)}
                        >
                            <span className="material-symbols-outlined fs-18">edit</span>
                            Adjust Status
                        </button>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Left Main Column: Payment & Gateway Details */}
                    <div className="col-12 col-lg-8">
                        {/* Transaction Card */}
                        <div className="card border-0 rounded-10 shadow-sm bg-white mb-4">
                            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                                <h5 className="fs-16 fw-bold mb-0 d-flex align-items-center gap-2">
                                    <span className="material-symbols-outlined text-primary fs-20">receipt</span>
                                    Transaction Specifications
                                </h5>
                                <span className="fs-12 text-muted">ID: #{payment.id}</span>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-3">
                                    <div className="col-sm-6">
                                        <div className="fs-12 text-muted mb-1 text-uppercase fw-semibold">Gateway Transaction ID</div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fs-14 fw-bold font-monospace text-dark text-break">
                                                {payment.transaction_id || 'N/A'}
                                            </span>
                                            {payment.transaction_id && (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link p-0 text-muted"
                                                    onClick={copyTxn}
                                                    title="Copy Transaction ID"
                                                >
                                                    <span className="material-symbols-outlined fs-18">
                                                        {copied ? 'check' : 'content_copy'}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-sm-6">
                                        <div className="fs-12 text-muted mb-1 text-uppercase fw-semibold">Payment Gateway / Method</div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge px-2 py-1 text-uppercase fw-bold text-white fs-12" style={{
                                                backgroundColor: payment.payment_method === 'stripe' ? '#635bff' : (payment.payment_method === 'paypal' ? '#003087' : '#4b5563')
                                            }}>
                                                {payment.payment_method || 'CARD'}
                                            </span>
                                            <span className="fs-13 text-muted">Direct Online Settlement</span>
                                        </div>
                                    </div>

                                    <div className="col-sm-6">
                                        <div className="fs-12 text-muted mb-1 text-uppercase fw-semibold">Gross Charged Amount</div>
                                        <div className="fs-22 fw-bold text-success">
                                            {formatCurrency(payment.amount, payment.currency)}
                                            <span className="fs-13 text-muted fw-normal ms-2 text-uppercase">
                                                {payment.currency || 'USD'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-sm-6">
                                        <div className="fs-12 text-muted mb-1 text-uppercase fw-semibold">Settlement Timestamp</div>
                                        <div className="fs-14 text-dark fw-medium">
                                            {payment.paid_at ? formatDate(payment.paid_at) : 'Not Yet Settled'}
                                        </div>
                                    </div>
                                </div>

                                {paymentIntent && (
                                    <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2 fs-13">
                                        <span className="text-muted">Payment Intent / Session:</span>
                                        <span className="font-monospace text-dark fw-semibold text-break">{paymentIntent}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gateway Telemetry */}
                        <div className="card border-0 rounded-10 shadow-sm bg-white mb-4">
                            <div className="card-header bg-white border-bottom p-3">
                                <h5 className="fs-16 fw-bold mb-0 d-flex align-items-center gap-2">
                                    <span className="material-symbols-outlined text-primary fs-20">data_object</span>
                                    Gateway Telemetry Details
                                </h5>
                            </div>
                            <div className="card-body p-3">
                                {payload ? (
                                    <div className="row g-2 fs-13">
                                        <div className="col-sm-6">
                                            <div className="p-2 bg-light rounded border">
                                                <span className="text-muted d-block fs-11 text-uppercase">Payment Status</span>
                                                <span className="fw-semibold text-dark">{payload.payment_status || payload.status || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="p-2 bg-light rounded border">
                                                <span className="text-muted d-block fs-11 text-uppercase">Client Email</span>
                                                <span className="fw-semibold text-dark">{customerEmail || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="p-2 bg-light rounded border">
                                                <span className="text-muted d-block fs-11 text-uppercase">Client Name</span>
                                                <span className="fw-semibold text-dark">{customerName || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="col-sm-6">
                                            <div className="p-2 bg-light rounded border">
                                                <span className="text-muted d-block fs-11 text-uppercase">Mode / Channel</span>
                                                <span className="fw-semibold text-dark">{payload.mode || 'Payment'}</span>
                                            </div>
                                        </div>
                                        {payload.customer_details?.address && (
                                            <div className="col-12">
                                                <div className="p-2 bg-light rounded border">
                                                    <span className="text-muted d-block fs-11 text-uppercase">Billing Country & Details</span>
                                                    <span className="fw-semibold text-dark">
                                                        {payload.customer_details.address.country || 'N/A'} {payload.customer_details.address.postal_code || ''}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-muted text-center py-4 fs-13">
                                        No gateway telemetry recorded for this transaction.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin Notes & Status Audit Trail */}
                        {adminNotes.length > 0 && (
                            <div className="card border-0 rounded-10 shadow-sm bg-white mb-4">
                                <div className="card-header bg-white border-bottom p-3">
                                    <h5 className="fs-16 fw-bold mb-0 d-flex align-items-center gap-2">
                                        <span className="material-symbols-outlined text-primary fs-20">history_edu</span>
                                        Administrative Audit Trail
                                    </h5>
                                </div>
                                <div className="card-body p-3">
                                    <div className="list-group list-group-flush">
                                        {adminNotes.map((noteItem: any, idx: number) => (
                                            <div key={idx} className="list-group-item px-0 py-2 border-0 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="fw-bold fs-13 text-dark">
                                                        {noteItem.updated_by}
                                                        <span className="badge bg-secondary-subtle text-secondary ms-2 fs-11">
                                                            Status: {noteItem.status}
                                                        </span>
                                                    </span>
                                                    <span className="fs-12 text-muted">{formatDate(noteItem.timestamp)}</span>
                                                </div>
                                                <p className="fs-13 text-muted mb-0">{noteItem.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Linked Booking & Property */}
                    <div className="col-12 col-lg-4">
                        {/* Booking Summary */}
                        <div className="card border-0 rounded-10 shadow-sm bg-white mb-4">
                            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                                <h5 className="fs-16 fw-bold mb-0 d-flex align-items-center gap-2">
                                    <span className="material-symbols-outlined text-primary fs-20">book_online</span>
                                    Linked Booking
                                </h5>
                                {booking && (
                                    <Link
                                        href={`/admin/bookings/${booking.id}`}
                                        className="btn btn-sm btn-outline-primary fs-12 px-2 py-1"
                                    >
                                        View Booking
                                    </Link>
                                )}
                            </div>
                            <div className="card-body p-3">
                                {booking ? (
                                    <>
                                        <div className="mb-3">
                                            <div className="fs-12 text-muted">Booking Reference</div>
                                            <div className="fs-15 fw-bold text-dark">{booking.booking_number}</div>
                                            <div className="fs-12 text-muted">
                                                Status: <span className="text-uppercase fw-semibold">{booking.status}</span>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between border-top py-2 fs-13">
                                            <span className="text-muted">Check-In</span>
                                            <span className="fw-semibold text-dark">{formatDate(booking.check_in)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top py-2 fs-13">
                                            <span className="text-muted">Check-Out</span>
                                            <span className="fw-semibold text-dark">{formatDate(booking.check_out)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top py-2 fs-13">
                                            <span className="text-muted">Nights</span>
                                            <span className="fw-semibold text-dark">{booking.nights} night(s)</span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top py-2 fs-13">
                                            <span className="text-muted">Guests</span>
                                            <span className="fw-semibold text-dark">
                                                {booking.adults} Adults{booking.children ? `, ${booking.children} Kids` : ''}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between border-top py-2 fs-13 fw-bold">
                                            <span>Booking Total</span>
                                            <span className="text-success">{formatCurrency(booking.total, booking.currency)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted fs-13 mb-0">No booking linked to this transaction.</p>
                                )}
                            </div>
                        </div>

                        {/* Property Summary */}
                        {property && (
                            <div className="card border-0 rounded-10 shadow-sm bg-white mb-4">
                                <div className="card-header bg-white border-bottom p-3">
                                    <h5 className="fs-16 fw-bold mb-0 d-flex align-items-center gap-2">
                                        <span className="material-symbols-outlined text-primary fs-20">apartment</span>
                                        Property Details
                                    </h5>
                                </div>
                                <div className="card-body p-3">
                                    {propertyImg && (
                                        <img
                                            src={propertyImg.startsWith('http') ? propertyImg : `/${propertyImg}`}
                                            alt={property.name}
                                            className="w-100 rounded-3 mb-3 object-fit-cover"
                                            style={{ height: 140 }}
                                        />
                                    )}
                                    <h6 className="fs-15 fw-bold text-dark mb-1">{property.title || property.name}</h6>
                                    <p className="fs-12 text-muted mb-2 d-flex align-items-center gap-1">
                                        <span className="material-symbols-outlined fs-14">location_on</span>
                                        {property.location || 'Location not specified'}
                                    </p>
                                    <Link
                                        href={`/admin/properties/${property.id}`}
                                        className="btn btn-sm btn-outline-secondary w-100 fs-12"
                                    >
                                        View Property Page
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Customer / Guest Card */}
                        <div className="card border-0 rounded-10 shadow-sm bg-white mb-4">
                            <div className="card-header bg-white border-bottom p-3">
                                <h5 className="fs-16 fw-bold mb-0 d-flex align-items-center gap-2">
                                    <span className="material-symbols-outlined text-primary fs-20">person</span>
                                    Customer Contact Info
                                </h5>
                            </div>
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold fs-16"
                                        style={{ width: 44, height: 44 }}
                                    >
                                        {(booking?.guest_name || booking?.user?.name || 'G').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="fw-bold fs-14 text-dark">
                                            {booking?.guest_name || booking?.user?.name || 'Guest User'}
                                        </div>
                                        <div className="fs-12 text-muted">
                                            {booking?.guest_email || booking?.user?.email || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {booking?.guest_phone && (
                                    <div className="d-flex justify-content-between border-top py-2 fs-13">
                                        <span className="text-muted">Phone Number</span>
                                        <span className="fw-semibold text-dark">{booking.guest_phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                {statusModalOpen && (
                    <div
                        className="modal fade show d-block"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                        tabIndex={-1}
                        role="dialog"
                    >
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow rounded-10">
                                <form onSubmit={handleStatusSubmit}>
                                    <div className="modal-header border-bottom py-3">
                                        <h5 className="modal-title fs-16 fw-bold">
                                            Adjust Payment Status
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setStatusModalOpen(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body p-4">
                                        <div className="mb-3">
                                            <div className="fs-12 text-muted mb-1">Transaction Reference</div>
                                            <div className="fw-bold font-monospace fs-14 text-dark">
                                                {payment.transaction_id || `TXN-${payment.id}`}
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fs-13 fw-semibold">Updated Status</label>
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
                                                placeholder="Explain why the status was adjusted..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer border-top py-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setStatusModalOpen(false)}
                                            disabled={isUpdating}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-sm btn-primary"
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? 'Saving...' : 'Apply Status Change'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dedicated Printable Receipt Container (Printed in isolated iframe or via @media print) */}
                <div id="payment-receipt-printable" className="d-none">
                    <ReceiptCard
                        payment={payment}
                        booking={booking}
                        property={property}
                        logo={logo}
                        systemName={systemName}
                        systemAddress={systemAddress}
                        systemEmail={systemEmail}
                        systemPhone={systemPhone}
                    />
                </div>

            </div>
        </>
    );
}

function ReceiptCard({
    payment,
    booking,
    property,
    logo,
    systemName,
    systemAddress,
    systemEmail,
    systemPhone,
}: {
    payment: Payment;
    booking?: Booking | null;
    property?: Property | null;
    logo: string;
    systemName: string;
    systemAddress?: string;
    systemEmail?: string;
    systemPhone?: string;
}) {
    const isSettled = ['completed', 'paid'].includes(payment.status?.toLowerCase());
    const isPending = payment.status?.toLowerCase() === 'pending';
    const isRefunded = payment.status?.toLowerCase() === 'refunded';

    return (
        <div className="receipt-card bg-white p-4 p-md-5 rounded-4 border shadow-sm" style={{ maxWidth: '820px', margin: '0 auto' }}>
            {/* Header */}
            <div className="receipt-header d-flex justify-content-between align-items-start pb-4 mb-4 border-bottom flex-wrap gap-3">
                <div>
                    <img
                        src={logo}
                        alt={systemName}
                        style={{ maxHeight: '48px', maxWidth: '180px', objectFit: 'contain' }}
                        className="mb-2 d-block"
                    />
                    <h4 className="fw-bold mb-1 fs-18 text-dark">{systemName}</h4>
                    {systemAddress && <div className="text-muted fs-12">{systemAddress}</div>}
                    <div className="text-muted fs-12">
                        {systemEmail} {systemPhone ? `• ${systemPhone}` : ''}
                    </div>
                </div>

                <div className="text-md-end">
                    <div className="text-uppercase fw-bold fs-20 text-dark mb-1 letter-spacing-1">
                        Payment Receipt
                    </div>
                    <div className="fs-13 text-muted mb-2 font-monospace">
                        Receipt #: <strong>REC-{payment.id}-{booking?.booking_number || 'TXN'}</strong>
                    </div>
                    <div>
                        {isSettled ? (
                            <span className="stamp-paid">PAID & SETTLED</span>
                        ) : isPending ? (
                            <span className="stamp-pending">PENDING</span>
                        ) : isRefunded ? (
                            <span className="stamp-refunded">REFUNDED</span>
                        ) : (
                            <span className="stamp-paid" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                                {payment.status?.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="fs-12 text-muted mt-2">
                        Settlement Date: <strong>{formatDate(payment.paid_at || payment.created_at)}</strong>
                    </div>
                </div>
            </div>

            {/* Billed To & Transaction Details */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-muted text-uppercase fw-bold fs-11 d-block mb-2">Billed To (Guest)</span>
                        <h5 className="fs-15 fw-bold text-dark mb-1">
                            {booking?.guest_name || booking?.user?.name || 'Valued Guest'}
                        </h5>
                        <div className="fs-13 text-muted mb-1">
                            Email: <span className="text-dark">{booking?.guest_email || booking?.user?.email || 'N/A'}</span>
                        </div>
                        {booking?.guest_phone && (
                            <div className="fs-13 text-muted">
                                Phone: <span className="text-dark">{booking.guest_phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 h-100 border">
                        <span className="text-muted text-uppercase fw-bold fs-11 d-block mb-2">Payment Details</span>
                        <div className="fs-13 text-muted mb-1">
                            Transaction ID: <span className="font-monospace text-dark fw-bold text-break">{payment.transaction_id || 'N/A'}</span>
                        </div>
                        <div className="fs-13 text-muted mb-1">
                            Gateway: <span className="text-dark fw-bold text-uppercase">{payment.payment_method || 'Online'}</span>
                        </div>
                        <div className="fs-13 text-muted">
                            Currency: <span className="text-dark fw-bold text-uppercase">{payment.currency || 'USD'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reservation Summary */}
            {booking && (
                <div className="p-3 rounded-3 border mb-4 bg-white">
                    <span className="text-muted text-uppercase fw-bold fs-11 d-block mb-2">Booking & Stay Information</span>
                    <div className="row g-2 fs-13">
                        <div className="col-12 col-sm-6">
                            <span className="text-muted">Booking Reference:</span>{' '}
                            <strong className="text-dark">{booking.booking_number}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                            <span className="text-muted">Property:</span>{' '}
                            <strong className="text-dark">{property?.title || property?.name || 'Property Accommodation'}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                            <span className="text-muted">Check-In:</span>{' '}
                            <strong className="text-dark">{formatDate(booking.check_in)}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                            <span className="text-muted">Check-Out:</span>{' '}
                            <strong className="text-dark">{formatDate(booking.check_out)}</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                            <span className="text-muted">Duration:</span>{' '}
                            <strong className="text-dark">{booking.nights} night(s)</strong>
                        </div>
                        <div className="col-12 col-sm-6">
                            <span className="text-muted">Guests:</span>{' '}
                            <strong className="text-dark">{booking.adults} Adults{booking.children ? `, ${booking.children} Kids` : ''}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Line Items Table */}
            <div className="table-responsive mb-4">
                <table className="table table-custom align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th style={{ minWidth: 240 }}>Description</th>
                            <th className="text-center" style={{ minWidth: 100 }}>Rate / Night</th>
                            <th className="text-center" style={{ minWidth: 80 }}>Nights</th>
                            <th className="text-end" style={{ minWidth: 120 }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong className="text-dark">{property?.title || property?.name || 'Accommodation Booking'}</strong>
                                <div className="fs-12 text-muted">
                                    Reservation for {booking?.nights || 1} night(s)
                                </div>
                            </td>
                            <td className="text-center">
                                {booking?.price_per_night ? formatCurrency(booking.price_per_night, payment.currency) : '—'}
                            </td>
                            <td className="text-center">{booking?.nights || 1}</td>
                            <td className="text-end fw-semibold">
                                {booking?.subtotal ? formatCurrency(booking.subtotal, payment.currency) : formatCurrency(payment.amount, payment.currency)}
                            </td>
                        </tr>

                        {Number(booking?.discount || 0) > 0 && (
                            <tr>
                                <td colSpan={3} className="text-end text-muted">
                                    Discount {booking?.coupon ? `(Coupon: ${booking.coupon.code})` : ''}
                                </td>
                                <td className="text-end text-danger fw-semibold">
                                    -{formatCurrency(booking?.discount || 0, payment.currency)}
                                </td>
                            </tr>
                        )}

                        <tr style={{ borderTop: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                            <td colSpan={3} className="text-end fw-bold fs-15 text-dark">
                                Total Amount Paid:
                            </td>
                            <td className="text-end fw-bold fs-16 text-success">
                                {formatCurrency(payment.amount, payment.currency)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 text-muted fs-12">
                <div>
                    <div>This electronic receipt serves as official proof of payment.</div>
                    <div>Thank you for choosing {systemName}!</div>
                </div>
                <div className="text-end font-monospace">
                    Status: <strong className="text-uppercase text-dark">{payment.status}</strong>
                </div>
            </div>
        </div>
    );
}
