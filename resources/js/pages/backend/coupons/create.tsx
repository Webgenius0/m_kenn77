import { Head, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

type CouponType = "general" | "early_bird" | "long_stay" | "last_minute" | "day_based";

type CouponForm = {
    title: string;
    subtitle: string;
    coupon_image: File | null;
    type: CouponType;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number | string;
    minimum_nights: number | string;
    minimum_booking_amount: number | string;
    advance_booking_days: number | string;
    applicable_days: string[];
    starts_at: string;
    ends_at: string;
    status: boolean;
};

const weekDays = [
    ["monday", "Monday"],
    ["tuesday", "Tuesday"],
    ["wednesday", "Wednesday"],
    ["thursday", "Thursday"],
    ["friday", "Friday"],
    ["saturday", "Saturday"],
    ["sunday", "Sunday"],
];

const couponTypes: [CouponType, string][] = [
    ["general", "General Promo"],
    ["early_bird", "Early Bird"],
    ["long_stay", "Long Stay"],
    ["last_minute", "Last Minute"],
    ["day_based", "Day Based"],
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<CouponForm>({
        title: "",
        subtitle: "",
        coupon_image: null,
        type: "general",
        code: "",
        discount_type: "percentage",
        discount_value: 0,
        minimum_nights: "",
        minimum_booking_amount: "",
        advance_booking_days: "",
        applicable_days: [],
        starts_at: "",
        ends_at: "",
        status: true,
    });
    const needsAdvanceBooking = data.type === "early_bird" || data.type === "last_minute";
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post("/admin/coupons", { forceFormData: true });
    };
    const fieldError = (field: keyof CouponForm) =>
        errors[field] && <div className="text-danger mt-1">{errors[field]}</div>;

    return (
        <>
            <Head title="Create Coupon" />
            <div className="card bg-white border border-white rounded-10 p-20">
                <h3 className="mb-20">Create Coupon</h3>
                <form onSubmit={submit}>
                    <div className="row">
                        <div className="col-lg-8">
                            <div className="row">
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Title</label>
                                    <input className="form-control" value={data.title} onChange={(event) => setData("title", event.target.value)} />
                                    {fieldError("title")}
                                </div>
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Coupon type</label>
                                    <select className="form-select" value={data.type} onChange={(event) => setData("type", event.target.value as CouponType)}>
                                        {couponTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                    </select>
                                    {fieldError("type")}
                                </div>
                            </div>
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Subtitle</label>
                                <input className="form-control" value={data.subtitle} onChange={(event) => setData("subtitle", event.target.value)} />
                                {fieldError("subtitle")}
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Coupon code</label>
                                    <input className="form-control text-uppercase" value={data.code} onChange={(event) => setData("code", event.target.value.toUpperCase())} />
                                    {fieldError("code")}
                                </div>
                                <div className="col-md-3 mb-20">
                                    <label className="label fs-16 mb-2">Discount type</label>
                                    <select className="form-select" value={data.discount_type} onChange={(event) => setData("discount_type", event.target.value as CouponForm["discount_type"])}>
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed amount</option>
                                    </select>
                                    {fieldError("discount_type")}
                                </div>
                                <div className="col-md-3 mb-20">
                                    <label className="label fs-16 mb-2">Discount value</label>
                                    <input type="number" min="0" max={data.discount_type === "percentage" ? 100 : undefined} step="0.01" className="form-control" value={data.discount_value} onChange={(event) => setData("discount_value", event.target.value === "" ? "" : Number(event.target.value))} />
                                    {fieldError("discount_value")}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Minimum nights</label>
                                    <input type="number" min="0" className="form-control" value={data.minimum_nights} onChange={(event) => setData("minimum_nights", event.target.value === "" ? "" : Number(event.target.value))} />
                                    {fieldError("minimum_nights")}
                                </div>
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Minimum booking amount</label>
                                    <input type="number" min="0" step="0.01" className="form-control" value={data.minimum_booking_amount} onChange={(event) => setData("minimum_booking_amount", event.target.value === "" ? "" : Number(event.target.value))} />
                                    <small className="text-warning">Leave blank for no minimum amount.</small>
                                    {fieldError("minimum_booking_amount")}
                                </div>
                            </div>
                            {needsAdvanceBooking && (
                                <div className="mb-20">
                                    <label className="label fs-16 mb-2">Advance booking days</label>
                                    <input type="number" min="0" className="form-control" value={data.advance_booking_days} onChange={(event) => setData("advance_booking_days", event.target.value === "" ? "" : Number(event.target.value))} />
                                    <small className="text-warning">{data.type === "early_bird" ? "The stay must be booked at least this many days ahead." : "The stay must be booked within this many days of check-in."}</small>
                                    {fieldError("advance_booking_days")}
                                </div>
                            )}
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Applicable days</label>
                                <div className="d-flex flex-wrap gap-3">
                                    {weekDays.map(([value, label]) => (
                                        <label key={value} className="d-flex align-items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={data.applicable_days.includes(value)}
                                                onChange={(event) => setData(
                                                    "applicable_days",
                                                    event.target.checked
                                                        ? [...data.applicable_days, value]
                                                        : data.applicable_days.filter((day) => day !== value),
                                                )}
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                <small className="text-warning">Leave all days unselected to apply to every night.</small>
                                {fieldError("applicable_days")}
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Starts at</label>
                                    <input type="datetime-local" className="form-control" value={data.starts_at} onChange={(event) => setData("starts_at", event.target.value)} />
                                    {fieldError("starts_at")}
                                </div>
                                <div className="col-md-6 mb-20">
                                    <label className="label fs-16 mb-2">Ends at</label>
                                    <input type="datetime-local" className="form-control" value={data.ends_at} onChange={(event) => setData("ends_at", event.target.value)} />
                                    {fieldError("ends_at")}
                                </div>
                            </div>
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Status</label>
                                <select className="form-select" value={data.status ? "1" : "0"} onChange={(event) => setData("status", event.target.value === "1")}>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                                {fieldError("status")}
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <ImageUpload label="Coupon image" file={data.coupon_image} onChange={(file) => setData("coupon_image", file)} />
                            {fieldError("coupon_image")}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary text-white" disabled={processing}>Create coupon</button>
                </form>
            </div>
        </>
    );
}
