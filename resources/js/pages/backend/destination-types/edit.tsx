import { Head, router, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

interface DestinationType { id: number; name: string; title: string | null; description: string | null; image: string | null; }
type DestinationTypeForm = { name: string; title: string; description: string; image: File | null };

export default function Edit({ destinationType }: { destinationType: DestinationType }) {
    const { data, setData, processing, errors } = useForm<DestinationTypeForm>({ name: destinationType.name, title: destinationType.title || "", description: destinationType.description || "", image: null });
    const submit = (event: React.FormEvent) => { event.preventDefault(); router.post(`/admin/destination-types/${destinationType.id}`, { ...data, _method: "put" }, { forceFormData: true }); };

    return <><Head title="Edit Destination Type" /><div className="card bg-white border border-white rounded-10 p-20"><h3 className="mb-20">Edit destination type</h3><form onSubmit={submit}>
        <div className="row"><div className="col-lg-7">
            <div className="mb-20"><label className="label fs-16 mb-2">Name</label><input className="form-control" value={data.name} onChange={e => setData("name", e.target.value)} />{errors.name && <div className="text-danger mt-1">{errors.name}</div>}</div>
            <div className="mb-20"><label className="label fs-16 mb-2">Title</label><input className="form-control" value={data.title} onChange={e => setData("title", e.target.value)} />{errors.title && <div className="text-danger mt-1">{errors.title}</div>}</div>
            <div className="mb-20"><label className="label fs-16 mb-2">Description</label><textarea className="form-control" rows={4} value={data.description} onChange={e => setData("description", e.target.value)} />{errors.description && <div className="text-danger mt-1">{errors.description}</div>}</div>
        </div><div className="col-lg-5"><ImageUpload label="Destination type image" file={data.image} imageUrl={destinationType.image || undefined} onChange={file => setData("image", file)} />{errors.image && <div className="text-danger mt-1">{errors.image}</div>}</div></div>
        <button type="submit" className="btn btn-primary text-white" disabled={processing}>Update destination type</button>
    </form></div></>;
}
