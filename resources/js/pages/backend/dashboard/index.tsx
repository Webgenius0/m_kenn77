import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import DashboardChart from '../../widget/chart';
import TimeLineChart from '../../widget/timeline-chart';

type BookingView = 'week' | 'month';

type Tenant = {
    id: number;
    name: string | null;
    avatar: string | null;
};

type FeaturedProperty = {
    id: number;
    name: string;
    location: string | null;
    image: string | null;
    bookings_count: number;
    revenue: number;
    price_per_night: number;
};

type TopProperty = {
    id: number;
    name: string;
    image: string;
    revenue: number;
    location: string | null;
} | null;

type DashboardMetrics = {
    activeBookings: {
        count: number;
        thisWeekCount: number;
        growthRate: number;
        isPositive: boolean;
    };
    activeTenants: {
        count: number;
        thisMonthCount: number;
        growthRate: number;
        isPositive: boolean;
    };
    monthlyRent: {
        amount: number;
        growthRate: number;
        isPositive: boolean;
    };
    propertyOverview: {
        occupiedUnits: number;
        vacantUnits: number;
        todaysSales: number;
        occupancyRate: number;
    };
};

type TimelineBooking = {
    bookingId: string;
    guest: string;
    property: string;
    status: string;
    amount: string;
};

type TimelineRange = {
    start: string;
    end: string;
    color?: string;
    booking: TimelineBooking;
};

type TimelineItem = {
    label: string;
    color?: string;
    ranges: TimelineRange[];
};

type PaymentTrackingRecent = {
    id: number;
    transaction_id: string;
    booking_id: number;
    booking_number: string;
    property_title: string;
    guest_name: string;
    guest_email: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    paid_at: string;
    created_at: string;
};

type PaymentTrackingData = {
    totalCollectedAmount: number;
    totalPaymentsCount: number;
    completedCount: number;
    completedAmount: number;
    pendingCount: number;
    pendingAmount: number;
    refundedCount: number;
    refundedAmount: number;
    thisMonthPaid: number;
    growthRate: number;
    isPositive: boolean;
    gateways: {
        stripe: { count: number; amount: number };
        paypal: { count: number; amount: number };
    };
    recentPayments: PaymentTrackingRecent[];
};

type DashboardProps = {
    metrics: DashboardMetrics;
    paymentTracking?: PaymentTrackingData;
    topProperty: TopProperty;
    newTenants: {
        count: number;
        growthRate: number;
        isPositive: boolean;
        users: Tenant[];
    };
    featuredProperties: FeaturedProperty[];
    timelineItems: TimelineItem[];
};

export default function Dashboard({
    metrics,
    paymentTracking,
    topProperty,
    newTenants,
    featuredProperties = [],
    timelineItems = [],
}: DashboardProps) {
    const [bookingView, setBookingView] = useState<BookingView>('month');

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const timelineStart =
        bookingView === 'week'
            ? new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 6))
            : monthStart;
    const timelineEnd = bookingView === 'week' ? today : monthEnd;

    const salesTimelineItems = (timelineItems || []).map((item) => ({
        label: item.label,
        color: item.color,
        ranges: (item.ranges || []).map((range) => ({
            start: new Date(range.start),
            end: new Date(range.end),
            color: range.color,
            booking: range.booking,
        })),
    }));

    return (
        <>
            <Head title="Dashboard" />
            <div className="main-content-container overflow-hidden">
                <div className="row">
                    {/* Bookings Timeline Chart */}
                    <div className="col-lg-6">
                        <div className="card bg-white p-20 rounded-10 border border-white mb-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <h3>Bookings</h3>
                                <div className="btn-group" role="group" aria-label="Sales timeline view">
                                    <button
                                        className={`btn btn-sm ${
                                            bookingView === 'week'
                                                ? 'btn-primary text-white'
                                                : 'btn-outline-secondary'
                                        }`}
                                        onClick={() => setBookingView('week')}
                                        type="button"
                                        style={{ padding: '10px 14px', fontSize: '14px' }}
                                    >
                                        Week
                                    </button>
                                    <button
                                        className={`btn btn-sm ${
                                            bookingView === 'month'
                                                ? 'btn-primary text-white'
                                                : 'btn-outline-secondary'
                                        }`}
                                        onClick={() => setBookingView('month')}
                                        type="button"
                                        style={{ padding: '10px 14px', fontSize: '14px' }}
                                    >
                                        Month
                                    </button>
                                </div>
                            </div>
                            <TimeLineChart
                                items={salesTimelineItems}
                                startDate={timelineStart}
                                endDate={timelineEnd}
                                height={270}
                            />
                        </div>
                    </div>

                    {/* Active Bookings & Active Tenants Cards */}
                    <div className="col-lg-6 col-xxl-3 col-xxxl-6">
                        <div className="row">
                            <div className="col-md-6 col-lg-12">
                                <div className="card bg-white p-20 rounded-10 border border-white mb-4">
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <h3 className="mb-10">Active Bookings</h3>
                                            <h2 className="fs-26 fw-medium mb-0 lh-1">
                                                {metrics?.activeBookings?.count ?? 0}
                                            </h2>
                                        </div>
                                        <div className="flex-shrink-0 ms-3">
                                            <div
                                                className="bg-primary text-white text-center rounded-circle d-block"
                                                style={{ width: '52px', height: '52px', lineHeight: '80px' }}
                                            >
                                                <i className="material-symbols-outlined fs-40">calendar_month</i>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="d-flex justify-content-between align-items-center"
                                        style={{ marginTop: '21px' }}
                                    >
                                        <p className="mb-0 fs-14">
                                            {metrics?.activeBookings?.thisWeekCount ?? 0} new booking
                                            {(metrics?.activeBookings?.thisWeekCount ?? 0) === 1 ? '' : 's'} this
                                            week
                                        </p>
                                        <span
                                            className={`d-flex align-content-center gap-1 ${
                                                metrics?.activeBookings?.isPositive
                                                    ? 'bg-success border-success'
                                                    : 'bg-danger border-danger'
                                            } bg-opacity-10 border`}
                                            style={{ padding: '3px 5px' }}
                                        >
                                            <i
                                                className={`material-symbols-outlined fs-14 ${
                                                    metrics?.activeBookings?.isPositive
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {metrics?.activeBookings?.isPositive
                                                    ? 'trending_up'
                                                    : 'trending_down'}
                                            </i>
                                            <span
                                                className={`lh-1 fs-14 ${
                                                    metrics?.activeBookings?.isPositive
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {Math.abs(metrics?.activeBookings?.growthRate ?? 0)}%
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6 col-lg-12">
                                <div className="card bg-white p-20 rounded-10 border border-white mb-4">
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <h3 className="mb-10">Active Tenants</h3>
                                            <h2 className="fs-26 fw-medium mb-0 lh-1">
                                                {metrics?.activeTenants?.count ?? 0}
                                            </h2>
                                        </div>
                                        <div className="flex-shrink-0 ms-3">
                                            <div
                                                className="bg-info text-white text-center rounded-circle d-block"
                                                style={{ width: '52px', height: '52px', lineHeight: '80px' }}
                                            >
                                                <i className="material-symbols-outlined fs-40">group</i>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="d-flex justify-content-between align-items-center"
                                        style={{ marginTop: '21px' }}
                                    >
                                        <p className="mb-0 fs-14">
                                            {metrics?.activeTenants?.thisMonthCount ?? 0} new tenant
                                            {(metrics?.activeTenants?.thisMonthCount ?? 0) === 1 ? '' : 's'} this
                                            month
                                        </p>
                                        <span
                                            className={`d-flex align-content-center gap-1 ${
                                                metrics?.activeTenants?.isPositive
                                                    ? 'bg-success border-success'
                                                    : 'bg-danger border-danger'
                                            } bg-opacity-10 border`}
                                            style={{ padding: '3px 5px' }}
                                        >
                                            <i
                                                className={`material-symbols-outlined fs-14 ${
                                                    metrics?.activeTenants?.isPositive
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {metrics?.activeTenants?.isPositive
                                                    ? 'trending_up'
                                                    : 'trending_down'}
                                            </i>
                                            <span
                                                className={`lh-1 fs-14 ${
                                                    metrics?.activeTenants?.isPositive
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {Math.abs(metrics?.activeTenants?.growthRate ?? 0)}%
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Rent & Property Overview Cards */}
                    <div className="col-xl-12 col-xxl-3 col-xxxl-12">
                        <div className="row">
                            <div className="col-md-6 col-xxxl-6 col-xxl-12">
                                <div className="card bg-white p-20 rounded-10 border border-white mb-4">
                                    <div className="d-flex">
                                        <div className="flex-grow-1">
                                            <h3 className="mb-10">Monthly Rent</h3>
                                            <h2 className="fs-26 fw-medium mb-0 lh-1">
                                                $
                                                {(metrics?.monthlyRent?.amount ?? 0).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </h2>
                                        </div>
                                        <div className="flex-shrink-0 ms-3">
                                            <div
                                                className="bg-warning text-white text-center rounded-circle d-block"
                                                style={{ width: '52px', height: '52px', lineHeight: '80px' }}
                                            >
                                                <i className="material-symbols-outlined fs-50">attach_money</i>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="d-flex justify-content-between align-items-center"
                                        style={{ marginTop: '23px' }}
                                    >
                                        <p className="mb-0 fs-14">
                                            {Math.abs(metrics?.monthlyRent?.growthRate ?? 0)}% collected{' '}
                                            {metrics?.monthlyRent?.isPositive ? 'above' : 'below'} last month
                                        </p>
                                        <span
                                            className={`d-flex align-content-center gap-1 ${
                                                metrics?.monthlyRent?.isPositive
                                                    ? 'bg-success border-success'
                                                    : 'bg-danger border-danger'
                                            } bg-opacity-10 border`}
                                            style={{ padding: '3px 5px' }}
                                        >
                                            <i
                                                className={`material-symbols-outlined fs-14 ${
                                                    metrics?.monthlyRent?.isPositive
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {metrics?.monthlyRent?.isPositive
                                                    ? 'trending_up'
                                                    : 'trending_down'}
                                            </i>
                                            <span
                                                className={`lh-1 fs-14 ${
                                                    metrics?.monthlyRent?.isPositive
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {Math.abs(metrics?.monthlyRent?.growthRate ?? 0)}%
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6 col-xxxl-6 col-xxl-12">
                                <div className="bg-primary-50 p-20 border rounded-10 border-primary-50 mb-4">
                                    <h3 className="text-white mb-12">Property Overview</h3>
                                    <div className="d-flex flex-wrap gap-2 justify-content-between mb-14">
                                        <div>
                                            <span className="fs-14 text-white mb-1 d-block">Occupied Units</span>
                                            <h2 className="fs-20 fw-medium lh-1 text-white mb-0">
                                                {metrics?.propertyOverview?.occupiedUnits ?? 0}
                                            </h2>
                                        </div>
                                        <div>
                                            <span className="fs-14 text-white mb-1 d-block">Vacant Units</span>
                                            <h2 className="fs-20 fw-medium lh-1 text-white mb-0">
                                                {metrics?.propertyOverview?.vacantUnits ?? 0}
                                            </h2>
                                        </div>
                                        <div>
                                            <span className="fs-14 text-white mb-1 d-block">Today's Sales</span>
                                            <h2 className="fs-20 fw-medium lh-1 text-white mb-0">
                                                {metrics?.propertyOverview?.todaysSales ?? 0}
                                            </h2>
                                        </div>
                                    </div>
                                    <span className="fs-14 text-white d-block" style={{ marginBottom: '-6px' }}>
                                        {metrics?.propertyOverview?.occupancyRate ?? 0}% portfolio occupancy
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-xxl-6 col-xxxl-12">
                        <div className="row">
                            {/* Top Property This Month */}
                            <div className="col-md-6">
                                <div className="card p-20 bg-light-40 rounded-10 border-light-40 mb-4 position-relative z-1">
                                    <h3 className="mb-20">Top Property This Month</h3>
                                    <h3
                                        className="mb-12 text-primary-50 text-truncate"
                                        title={topProperty ? topProperty.name : 'No property booked yet'}
                                        style={{ maxWidth: '75%' }}
                                    >
                                        {topProperty ? topProperty.name : 'No property booked yet'}
                                    </h3>
                                    <h2 className="lh-1 fs-26 fw-medium">
                                        $
                                        {topProperty
                                            ? topProperty.revenue >= 1000
                                                ? `${(topProperty.revenue / 1000).toFixed(1)}K`
                                                : topProperty.revenue.toLocaleString(undefined, {
                                                      minimumFractionDigits: 0,
                                                      maximumFractionDigits: 2,
                                                  })
                                            : '0'}
                                        <span className="fs-16 text-body ms-1">(Rental income)</span>
                                    </h2>
                                    {topProperty ? (
                                        <Link
                                            className="fw-medium fs-16 text-secondary hover-text d-inline-block"
                                            href={`/admin/properties/${topProperty.id}`}
                                            style={{ marginTop: '84px' }}
                                        >
                                            View property
                                        </Link>
                                    ) : (
                                        <Link
                                            className="fw-medium fs-16 text-secondary hover-text d-inline-block"
                                            href="/admin/properties"
                                            style={{ marginTop: '84px' }}
                                        >
                                            View properties
                                        </Link>
                                    )}
                                    <img
                                        alt="man"
                                        className="position-absolute bottom-1 end-1 rounded-circle"
                                        src={`${topProperty ? topProperty.image : ""}`}
                                        style={{
                                            width: '130px',
                                            height: '130px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* New Tenants This Month */}
                            <div className="col-md-6">
                                <div className="card p-20 bg-white rounded-10 border border-white mb-4 position-relative z-1">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-20">
                                        <h3>New Tenants This Month</h3>

                                        <span
                                            className={`d-flex align-content-center gap-1 ${
                                                newTenants.isPositive
                                                    ? 'bg-success border-success'
                                                    : 'bg-danger border-danger'
                                            } bg-opacity-10 border`}
                                            style={{ padding: '3px 5px' }}
                                        >
                                            <i
                                                className={`material-symbols-outlined fs-14 ${
                                                    newTenants.isPositive ? 'text-success' : 'text-danger'
                                                }`}
                                            >
                                                {newTenants.isPositive ? 'trending_up' : 'trending_down'}
                                            </i>

                                            <span
                                                className={`lh-1 fs-14 ${
                                                    newTenants.isPositive ? 'text-success' : 'text-danger'
                                                }`}
                                            >
                                                {Math.abs(newTenants.growthRate ?? 0)}%
                                            </span>
                                        </span>
                                    </div>

                                    <h2 className="lh-1 fs-26 fw-medium">
                                        {newTenants.count.toLocaleString()}
                                    </h2>

                                    <div style={{ marginTop: '55px' }}>
                                        <span className="fs-16 text-body d-block mb-10">Join Today</span>

                                        <ul className="p-0 mb-0 list-unstyled d-flex last-child-none global-right-list">
                                            {newTenants.users && newTenants.users.length > 0 ? (
                                                newTenants.users.slice(0, 5).map((tenant) => (
                                                    <li key={tenant.id} style={{ marginRight: '-20px' }}>
                                                        <img
                                                            alt={tenant.name || 'Tenant'}
                                                            title={tenant.name || 'Tenant'}
                                                            className="border border-3 border-white rounded-circle"
                                                            src={tenant.avatar || '/backend/assets/images/user12.jpg'}
                                                            style={{ width: '52px', height: '52px', objectFit: 'cover' }}
                                                        />
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-muted fs-14">No tenants joined yet</li>
                                            )}
                                            {newTenants.count > 5 && (
                                                <li
                                                    className="border border-3 border-white rounded-circle bg-primary text-center"
                                                    style={{
                                                        marginRight: '-20px',
                                                        width: '52px',
                                                        height: '52px',
                                                        lineHeight: '49px',
                                                    }}
                                                >
                                                    <span className="text-white fs-16 fw-medium">
                                                        +{newTenants.count - 5}
                                                    </span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Featured Properties Table */}
                    <div className="col-xxl-6 col-xxxl-12">
                        <div className="card bg-white p-20 rounded-10 border border-white mb-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-20">
                                <h3>Featured Properties</h3>
                            </div>
                            <div className="default-table-area without-header table-top-selling-products">
                                <div className="table-responsive">
                                    <table className="table align-middle">
                                        <tbody>
                                            {featuredProperties.length > 0 ? (
                                                featuredProperties.map((property, index) => (
                                                    <tr key={property.id}>
                                                        <td className="text-body fw-medium">
                                                            {String(index + 1).padStart(2, '0')}.
                                                        </td>
                                                        <td className="ps-0">
                                                            <div className="d-flex align-items-center">
                                                                <div className="flex-shrink-0">
                                                                    <img
                                                                        alt={property.name}
                                                                        className="rounded-circle"
                                                                        src={
                                                                            property.image ||
                                                                            '/backend/assets/images/product1.png'
                                                                        }
                                                                        style={{
                                                                            width: '50px',
                                                                            height: '50px',
                                                                            objectFit: 'cover',
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex-grow-1 ms-12">
                                                                    <Link
                                                                        href={`/admin/properties/${property.id}`}
                                                                        className="fw-normal hover-text text-decoration-none d-block"
                                                                    >
                                                                        <h3 className="fw-normal hover-text mb-0 fs-16">
                                                                            {property.name}
                                                                        </h3>
                                                                    </Link>
                                                                    <span className="fs-14 text-body fw-normal">
                                                                        {property.bookings_count} booking
                                                                        {property.bookings_count === 1 ? '' : 's'}{' '}
                                                                        this month
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-body">
                                                            {property.location || 'Location not set'}
                                                        </td>
                                                        <td className="text-body fw-medium">
                                                            $
                                                            {property.revenue.toLocaleString(undefined, {
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="text-center text-body py-4">
                                                        No featured properties booked this month.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-flex justify-content-center justify-content-sm-between align-items-center text-center flex-wrap gap-2 showing-wrap pt-15">
                                    <span className="fs-15">
                                        Showing {featuredProperties.length > 0 ? 1 : 0} to{' '}
                                        {featuredProperties.length} of {featuredProperties.length} entries
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Tracking Management System on Dashboard */}
                <div className="row">
                    <div className="col-12">
                        <div className="card bg-white p-20 rounded-10 border border-white mb-4 shadow-sm">
                            {/* Section Header */}
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <div
                                            className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary"
                                            style={{ width: 36, height: 36 }}
                                        >
                                            <span className="material-symbols-outlined fs-20">payments</span>
                                        </div>
                                        <h3 className="mb-0 fs-18 fw-bold">Payment Tracking Management System</h3>
                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fs-12 fw-semibold">
                                            Live Verification
                                        </span>
                                    </div>
                                    <p className="fs-13 text-muted mb-0">
                                        Real-time tracking of booking transactions, automated Stripe & PayPal gateway settlements, and customer payments.
                                    </p>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    <Link
                                        href="/admin/payments"
                                        className="btn btn-sm btn-primary d-flex align-items-center gap-1 fs-13 px-3 py-2 fw-medium"
                                        id="dashboard-open-payment-system"
                                    >
                                        <span>Full Payment Tracker</span>
                                        <span className="material-symbols-outlined fs-16">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Payment Metric Cards */}
                            <div className="row g-3 mb-4">
                                <div className="col-sm-6 col-xl-3">
                                    <div className="p-3 rounded-10 border bg-light-subtle">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fs-12 text-muted fw-semibold text-uppercase">Total Settled Volume</span>
                                            <span className="material-symbols-outlined text-success fs-20">verified</span>
                                        </div>
                                        <div className="fs-22 fw-bold text-dark mb-1">
                                            ${(paymentTracking?.completedAmount ?? 0).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                        <span className="fs-12 text-muted">
                                            {paymentTracking?.completedCount ?? 0} successful transaction{(paymentTracking?.completedCount ?? 0) === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-sm-6 col-xl-3">
                                    <div className="p-3 rounded-10 border bg-light-subtle">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fs-12 text-muted fw-semibold text-uppercase">Pending In Pipeline</span>
                                            <span className="material-symbols-outlined text-warning fs-20">hourglass_top</span>
                                        </div>
                                        <div className="fs-22 fw-bold text-dark mb-1">
                                            ${(paymentTracking?.pendingAmount ?? 0).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                        <span className="fs-12 text-muted">
                                            {paymentTracking?.pendingCount ?? 0} awaiting settlement
                                        </span>
                                    </div>
                                </div>

                                <div className="col-sm-6 col-xl-3">
                                    <div className="p-3 rounded-10 border bg-light-subtle">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fs-12 text-muted fw-semibold text-uppercase">Stripe Gateway</span>
                                            <span className="badge text-white px-2 py-1 fs-11 fw-bold" style={{ backgroundColor: '#635bff' }}>
                                                STRIPE
                                            </span>
                                        </div>
                                        <div className="fs-22 fw-bold text-dark mb-1">
                                            ${(paymentTracking?.gateways?.stripe?.amount ?? 0).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                        <span className="fs-12 text-muted">
                                            {paymentTracking?.gateways?.stripe?.count ?? 0} online payments
                                        </span>
                                    </div>
                                </div>

                                <div className="col-sm-6 col-xl-3">
                                    <div className="p-3 rounded-10 border bg-light-subtle">
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                            <span className="fs-12 text-muted fw-semibold text-uppercase">PayPal Gateway</span>
                                            <span className="badge text-white px-2 py-1 fs-11 fw-bold" style={{ backgroundColor: '#003087' }}>
                                                PAYPAL
                                            </span>
                                        </div>
                                        <div className="fs-22 fw-bold text-dark mb-1">
                                            ${(paymentTracking?.gateways?.paypal?.amount ?? 0).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                        <span className="fs-12 text-muted">
                                            {paymentTracking?.gateways?.paypal?.count ?? 0} PayPal payments
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions Table */}
                            <div className="default-table-area table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead className="table-light">
                                        <tr className="text-muted fs-12 text-uppercase fw-semibold">
                                            <th className="ps-2 py-2">Transaction ID</th>
                                            <th>Booking Reference</th>
                                            <th>Guest</th>
                                            <th>Gateway</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Settled Date</th>
                                            <th className="text-end pe-2">Audit Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentTracking?.recentPayments && paymentTracking.recentPayments.length > 0 ? (
                                            paymentTracking.recentPayments.map((payment) => (
                                                <tr key={payment.id} className="hover-shadow-sm">
                                                    <td className="ps-2">
                                                        <span
                                                            className="badge bg-light text-dark border font-monospace fs-12 px-2 py-1 text-truncate d-inline-block"
                                                            style={{ maxWidth: 160 }}
                                                            title={payment.transaction_id}
                                                        >
                                                            {payment.transaction_id}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link
                                                            href={`/admin/bookings/${payment.booking_id}`}
                                                            className="fw-bold text-primary hover-text text-decoration-none fs-13 d-block"
                                                        >
                                                            {payment.booking_number}
                                                        </Link>
                                                        <span className="fs-12 text-muted text-truncate d-block" style={{ maxWidth: 150 }} title={payment.property_title}>
                                                            {payment.property_title}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="fw-medium fs-13 text-dark text-truncate" style={{ maxWidth: 140 }}>
                                                            {payment.guest_name}
                                                        </div>
                                                        <div className="fs-11 text-muted text-truncate" style={{ maxWidth: 140 }}>
                                                            {payment.guest_email}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {payment.payment_method === 'stripe' ? (
                                                            <span
                                                                className="badge text-white px-2 py-1 fw-bold fs-11"
                                                                style={{ backgroundColor: '#635bff' }}
                                                            >
                                                                STRIPE
                                                            </span>
                                                        ) : payment.payment_method === 'paypal' ? (
                                                            <span
                                                                className="badge text-white px-2 py-1 fw-bold fs-11"
                                                                style={{ backgroundColor: '#003087' }}
                                                            >
                                                                PAYPAL
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-secondary px-2 py-1 text-uppercase fs-11">
                                                                {payment.payment_method || 'CARD'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold fs-14 text-dark">
                                                            ${payment.amount.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </div>
                                                        <span className="fs-11 text-muted">{payment.currency}</span>
                                                    </td>
                                                    <td>
                                                        {['completed', 'paid'].includes(payment.status.toLowerCase()) ? (
                                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fs-12 fw-semibold">
                                                                Completed
                                                            </span>
                                                        ) : payment.status.toLowerCase() === 'pending' ? (
                                                            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1 fs-12 fw-semibold">
                                                                Pending
                                                            </span>
                                                        ) : payment.status.toLowerCase() === 'refunded' ? (
                                                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 fs-12 fw-semibold">
                                                                Refunded
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 fs-12 fw-semibold">
                                                                {payment.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="fs-12 text-dark">
                                                            {payment.paid_at || payment.created_at}
                                                        </span>
                                                    </td>
                                                    <td className="text-end pe-2">
                                                        <Link
                                                            href={`/admin/payments/${payment.id}`}
                                                            className="btn btn-sm btn-outline-primary px-2 py-1 fs-12 d-inline-flex align-items-center gap-1"
                                                            title="Inspect Payment Details"
                                                        >
                                                            <span>Inspect</span>
                                                            <span className="material-symbols-outlined fs-14">arrow_forward</span>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4 text-muted fs-14">
                                                    No recent payment transactions recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}
