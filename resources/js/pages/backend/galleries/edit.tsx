import { Head, router, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

interface Gallery { id: number; title: string; image: string | null; }
type GalleryForm = { title: string; image: File | null };

export default function Edit({ gallery }: { gallery: Gallery }) {
    const { data, setData, processing, errors } = useForm<GalleryForm>({ title: gallery.title, image: null });
    const submit = (event: React.FormEvent) => { event.preventDefault(); router.post(`/admin/galleries/${gallery.id}`, { ...data, _method: "put" }, { forceFormData: true }); };

    return <><Head title="Edit Gallery Image" /><div className="card bg-white border border-white rounded-10 p-20"><h3 className="mb-20">Edit gallery image</h3><form onSubmit={submit}>
        <div className="row"><div className="col-lg-7"><div className="mb-20"><label className="label fs-16 mb-2">Title</label><input className="form-control" value={data.title} onChange={e => setData("title", e.target.value)} />{errors.title && <div className="text-danger mt-1">{errors.title}</div>}</div></div><div className="col-lg-5"><ImageUpload label="Gallery image" file={data.image} imageUrl={gallery.image || undefined} onChange={file => setData("image", file)} />{errors.image && <div className="text-danger mt-1">{errors.image}</div>}</div></div>
        <button type="submit" className="btn btn-primary text-white" disabled={processing}>Update image</button>
    </form></div></>;
}
