import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface Coupon {
    id: number;
    title: string | null;
    subtitle: string | null;
    coupon_image: string | null;
    type: "general" | "early_bird" | "long_stay" | "last_minute" | "day_based";
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    minimum_nights: number | null;
    minimum_booking_amount: number | null;
    advance_booking_days: number | null;
    applicable_days: string[] | null;
    starts_at: string | null;
    ends_at: string | null;
    status: boolean;
}

interface Props {
    coupons: Coupon[];
}

const couponTypeLabels: Record<Coupon["type"], string> = {
    general: "General Promo",
    early_bird: "Early Bird",
    long_stay: "Long Stay",
    last_minute: "Last Minute",
    day_based: "Day Based",
};

export default function Index({ coupons }: Props) {
    const deleteCoupon = (id: number) => {
        Swal.fire({
            title: "Delete coupon?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            confirmButtonText: "Yes, delete coupon",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/coupons/${id}`);
            }
        });
    };

    return (
        <>
            <Head title="Coupons" />
            <div
                className="main-content-container overflow-hidden"
                style={{ minHeight: "75vh" }}
            >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">Coupons</h3>
                        <p className="fs-16">Create and manage promotional discounts.</p>
                    </div>
                    <Link href="/admin/coupons/create" className="btn btn-primary text-white">+ Add coupon</Link>
                </div>
                <div className="card bg-white rounded-10 border border-white mb-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-20">
                        <h3>Coupons</h3>
                    </div>
                    <div className="default-table-area mx-minus-1 table-contact-list">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th className="fw-medium pe-0 rtl-pe" scope="col">ID</th>
                                        <th className="fw-medium" scope="col">Coupon</th>
                                        <th className="fw-medium" scope="col">Coupon type</th>
                                        <th className="fw-medium" scope="col">Code</th>
                                        <th className="fw-medium" scope="col">Discount</th>
                                        <th className="fw-medium" scope="col">Minimum nights</th>
                                        <th className="fw-medium" scope="col">Minimum amount</th>
                                        <th className="fw-medium" scope="col">Validity</th>
                                        <th className="fw-medium" scope="col">Status</th>
                                        <th className="fw-medium" scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.length > 0 ? (
                                        coupons.map((coupon) => (
                                            <tr key={coupon.id}>
                                                <td className="text-body pe-0 rtl-pe">{coupon.id}</td>
                                                <td className="text-body">
                                                    <div className="d-flex align-items-center gap-2">
                                                        {coupon.coupon_image && <img src={coupon.coupon_image} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />}
                                                        <div>
                                                            <div className="fw-medium">{coupon.title || "Untitled coupon"}</div>
                                                            <small className="text-muted">{coupon.subtitle}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-body">{couponTypeLabels[coupon.type]}</td>
                                                <td className="text-body"><code>{coupon.code}</code></td>
                                                <td className="text-body">{coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}</td>
                                                <td className="text-body">{coupon.minimum_nights || "Any"}</td>
                                                <td className="text-body">{coupon.minimum_booking_amount === null ? "Not set" : `$${coupon.minimum_booking_amount}`}</td>
                                                <td className="text-body">{coupon.starts_at ? new Date(coupon.starts_at).toLocaleDateString() : "Always"} - {coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString() : "Open"}</td>
                                                <td>
                                                    <span className={coupon.status ? "text-success bg-success bg-opacity-10 fs-15 fw-normal d-inline-block default-badge" : "text-danger bg-danger bg-opacity-10 fs-15 fw-normal d-inline-block default-badge"}>
                                                        {coupon.status ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                                                        <Link href={`/admin/coupons/${coupon.id}/edit`} className="bg-transparent p-0 border-0 hover-text-success" aria-label="Edit coupon">
                                                            <i className="material-symbols-outlined fs-16 fw-normal text-primary">Edit</i>
                                                        </Link>
                                                        <button className="bg-transparent p-0 border-0 hover-text-danger" aria-label="Delete coupon" onClick={() => deleteCoupon(coupon.id)}>
                                                            <i className="material-symbols-outlined fs-16 fw-normal text-body">delete</i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="text-center">No coupons found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
