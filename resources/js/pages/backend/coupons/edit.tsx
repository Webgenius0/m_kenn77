import { Head, router, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

type Coupon = { id: number; title: string | null; subtitle: string | null; image: string | null; type: string; code: string; value: number; min_night: number; starts_at: string | null; ends_at: string | null; is_active: boolean };
type CouponForm = { title: string; subtitle: string; image: File | null; type: string; code: string; value: number | string; min_night: number | string; starts_at: string; ends_at: string; is_active: boolean };

const dateValue = (value: string | null) => value ? value.slice(0, 16) : "";

export default function Edit({ coupon }: { coupon: Coupon }) {
    const { data, setData, processing, errors } = useForm<CouponForm>({
        title: coupon.title || "", subtitle: coupon.subtitle || "", image: null, type: coupon.type,
        code: coupon.code, value: Number(coupon.value), min_night: coupon.min_night,
        starts_at: dateValue(coupon.starts_at), ends_at: dateValue(coupon.ends_at), is_active: coupon.is_active,
    });
    const submit = (event: React.FormEvent) => { event.preventDefault(); router.post(`/admin/coupons/${coupon.id}`, { ...data, _method: "put" }, { forceFormData: true }); };
    const fieldError = (field: keyof CouponForm) => errors[field] && <div className="text-danger mt-1">{errors[field]}</div>;

    return <><Head title="Edit Coupon" /><div className="card bg-white border border-white rounded-10 p-20"><h3 className="mb-20">Edit Coupon</h3><form onSubmit={submit}>
        <div className="row"><div className="col-lg-8">
            <div className="row"><div className="col-md-6 mb-20"><label className="label fs-16 mb-2">Title</label><input className="form-control" value={data.title} onChange={e => setData("title", e.target.value)} />{fieldError("title")}</div><div className="col-md-6 mb-20"><label className="label fs-16 mb-2">Subtitle</label><input className="form-control" value={data.subtitle} onChange={e => setData("subtitle", e.target.value)} />{fieldError("subtitle")}</div></div>
            <div className="row"><div className="col-md-6 mb-20"><label className="label fs-16 mb-2">Coupon code</label><input className="form-control text-uppercase" value={data.code} onChange={e => setData("code", e.target.value.toUpperCase())} />{fieldError("code")}</div><div className="col-md-3 mb-20"><label className="label fs-16 mb-2">Type</label><select className="form-select" value={data.type} onChange={e => setData("type", e.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></div><div className="col-md-3 mb-20"><label className="label fs-16 mb-2">Value</label><input type="number" min="0" step="0.01" className="form-control" value={data.value} onChange={e => setData("value", e.target.value === "" ? "" : Number(e.target.value))} />{fieldError("value")}</div></div>
            <div className="row"><div className="col-md-4 mb-20"><label className="label fs-16 mb-2">Minimum nights</label><input type="number" min="0" className="form-control" value={data.min_night} onChange={e => setData("min_night", e.target.value === "" ? "" : Number(e.target.value))} />{fieldError("min_night")}</div><div className="col-md-4 mb-20"><label className="label fs-16 mb-2">Starts at</label><input type="datetime-local" className="form-control" value={data.starts_at} onChange={e => setData("starts_at", e.target.value)} />{fieldError("starts_at")}</div><div className="col-md-4 mb-20"><label className="label fs-16 mb-2">Ends at</label><input type="datetime-local" className="form-control" value={data.ends_at} onChange={e => setData("ends_at", e.target.value)} />{fieldError("ends_at")}</div></div>
            <div className="mb-20"><label className="label fs-16 mb-2">Status</label><select className="form-select" value={data.is_active ? "1" : "0"} onChange={e => setData("is_active", e.target.value === "1")}><option value="1">Active</option><option value="0">Inactive</option></select></div>
        </div><div className="col-lg-4"><ImageUpload label="Coupon image" file={data.image} imageUrl={coupon.image || undefined} onChange={file => setData("image", file)} />{fieldError("image")}</div></div>
        <button type="submit" className="btn btn-primary text-white" disabled={processing}>Update coupon</button>
    </form></div></>;
}
