import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface DestinationType {
    id: number;
    name: string;
    slug: string;
    title: string | null;
    description: string | null;
    image: string | null;
}

export default function Index({ destinationTypes }: { destinationTypes: DestinationType[] }) {
    const deleteDestinationType = (id: number) => {
        Swal.fire({
            title: "Delete destination type?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            confirmButtonText: "Yes, delete it",
        }).then((result) => {
            if (result.isConfirmed) router.delete(`/admin/destination-types/${id}`);
        });
    };

    return (
        <>
            <Head title="Destination Types" />
            <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">Destination Types</h3>
                        <p className="fs-16">Manage the types used to organize destinations.</p>
                    </div>
                    <Link href="/admin/destination-types/create" className="btn btn-primary text-white">+ Add destination type</Link>
                </div>
                <div className="card bg-white rounded-10 border border-white mb-4">
                    <div className="p-20"><h3>Destination types</h3></div>
                    <div className="default-table-area mx-minus-1 table-contact-list">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead><tr><th className="fw-medium" scope="col">Image</th><th className="fw-medium" scope="col">Name</th><th className="fw-medium" scope="col">Slug</th><th className="fw-medium" scope="col">Title</th><th className="fw-medium" scope="col">Action</th></tr></thead>
                                <tbody>
                                    {destinationTypes.length > 0 ? destinationTypes.map((destinationType) => (
                                        <tr key={destinationType.id}>
                                            <td>{destinationType.image && <img src={destinationType.image} alt={destinationType.name} style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 6 }} />}</td>
                                            <td className="text-body">{destinationType.name}</td>
                                            <td className="text-body">{destinationType.slug}</td>
                                            <td className="text-body">{destinationType.title || "-"}</td>
                                            <td><div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                                                <Link href={`/admin/destination-types/${destinationType.id}/edit`} className="bg-transparent p-0 border-0 hover-text-success" aria-label="Edit destination type"><i className="material-symbols-outlined fs-16 fw-normal text-primary">Edit</i></Link>
                                                <button className="bg-transparent p-0 border-0 hover-text-danger" aria-label="Delete destination type" onClick={() => deleteDestinationType(destinationType.id)}><i className="material-symbols-outlined fs-16 fw-normal text-body">delete</i></button>
                                            </div></td>
                                        </tr>
                                    )) : <tr><td colSpan={5} className="text-center">No destination types found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
