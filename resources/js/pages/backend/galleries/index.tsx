import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface Gallery {
    id: number;
    title: string;
    image: string | null;
    created_at: string;
}

export default function Index({ galleries }: { galleries: Gallery[] }) {
    const deleteGallery = (id: number) => {
        Swal.fire({
            title: "Delete gallery image?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            confirmButtonText: "Yes, delete image",
        }).then((result) => {
            if (result.isConfirmed) router.delete(`/admin/galleries/${id}`);
        });
    };

    return (
        <>
            <Head title="Gallery" />
            <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">Gallery</h3>
                        <p className="fs-16">Manage images displayed in your gallery.</p>
                    </div>
                    <Link href="/admin/galleries/create" className="btn btn-primary text-white">+ Add image</Link>
                </div>
                <div className="card bg-white rounded-10 border border-white mb-4">
                    <div className="p-20"><h3>Gallery images</h3></div>
                    <div className="default-table-area mx-minus-1 table-contact-list">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead><tr><th className="fw-medium" scope="col">Image</th><th className="fw-medium" scope="col">Title</th><th className="fw-medium" scope="col">Added</th><th className="fw-medium" scope="col">Action</th></tr></thead>
                                <tbody>
                                    {galleries.length > 0 ? galleries.map((gallery) => (
                                        <tr key={gallery.id}>
                                            <td>{gallery.image && <img src={gallery.image} alt={gallery.title} style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 6 }} />}</td>
                                            <td className="text-body">{gallery.title}</td>
                                            <td className="text-body">{new Date(gallery.created_at).toLocaleDateString()}</td>
                                            <td><div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                                                <Link href={`/admin/galleries/${gallery.id}/edit`} className="bg-transparent p-0 border-0 hover-text-success" aria-label="Edit gallery image"><i className="material-symbols-outlined fs-16 fw-normal text-primary">Edit</i></Link>
                                                <button className="bg-transparent p-0 border-0 hover-text-danger" aria-label="Delete gallery image" onClick={() => deleteGallery(gallery.id)}><i className="material-symbols-outlined fs-16 fw-normal text-body">delete</i></button>
                                            </div></td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="text-center">No gallery images found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
