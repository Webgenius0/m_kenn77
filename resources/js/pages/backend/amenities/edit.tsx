import { Head, router, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

interface Amenity {
    id: number;
    name: string;
    icon: string | null;
    is_active: boolean;
}

type AmenityForm = { name: string; icon: File | null; is_active: boolean };

export default function Edit({ amenity }: { amenity: Amenity }) {
    const { data, setData, processing, errors } = useForm<AmenityForm>({
        name: amenity.name,
        icon: null,
        is_active: amenity.is_active,
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.post(`/admin/amenities/${amenity.id}`, { ...data, _method: "put" }, { forceFormData: true });
    };

    return (
        <>
            <Head title="Edit Amenity" />
            <div className="card bg-white border border-white rounded-10 p-20">
                <h3 className="mb-20">Edit amenity</h3>
                <form onSubmit={submit}>
                    <div className="row">
                        <div className="col-lg-7">
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Amenity Name</label>
                                <input className="form-control" placeholder="e.g: Wi-Fi, Television" value={data.name} onChange={e => setData("name", e.target.value)} />
                                {errors.name && <div className="text-danger mt-1">{errors.name}</div>}
                            </div>
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Status</label>
                                <select className="form-select" value={String(data.is_active)} onChange={e => setData("is_active", e.target.value === "true")}>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                                {errors.is_active && <div className="text-danger mt-1">{errors.is_active}</div>}
                            </div>
                        </div>
                        <div className="col-lg-5">
                            <ImageUpload label="Amenity icon" file={data.icon} imageUrl={amenity.icon || undefined} onChange={file => setData("icon", file)} />
                            {errors.icon && <div className="text-danger mt-1">{errors.icon}</div>}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary text-white" disabled={processing}>Update amenity</button>
                </form>
            </div>
        </>
    );
}
