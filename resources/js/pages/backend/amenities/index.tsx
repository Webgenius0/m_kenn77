import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface Amenity {
    id: number;
    name: string;
    icon: string | null;
    is_active: boolean;
}

export default function Index({ amenities }: { amenities: Amenity[] }) {
    const deleteAmenity = (id: number) => {
        Swal.fire({
            title: "Delete amenity?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            confirmButtonText: "Yes, delete it",
        }).then((result) => {
            if (result.isConfirmed) router.delete(`/admin/amenities/${id}`);
        });
    };

    return (
        <>
            <Head title="Amenities" />
            <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">Amenities</h3>
                        <p className="fs-16">Manage the amenities available for properties.</p>
                    </div>
                    <Link href="/admin/amenities/create" className="btn btn-primary text-white">+ Add amenity</Link>
                </div>

                <div className="card bg-white rounded-10 border border-white mb-4">
                    <div className="p-20"><h3>Amenities</h3></div>
                    <div className="default-table-area mx-minus-1 table-contact-list">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th className="fw-medium" scope="col">Name</th>
                                        <th className="fw-medium" scope="col">Icon</th>
                                        <th className="fw-medium" scope="col">Status</th>
                                        <th className="fw-medium" scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {amenities.length > 0 ? amenities.map((amenity) => (
                                        <tr key={amenity.id}>
                                            <td className="text-body">{amenity.name}</td>
                                            <td className="text-body">
                                                {amenity.icon ? <img src={amenity.icon} alt={amenity.name} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} /> : "-"}
                                            </td>
                                            <td>
                                                <span className={amenity.is_active ? "text-success bg-success bg-opacity-10 fs-15 fw-normal d-inline-block default-badge" : "text-danger bg-danger bg-opacity-10 fs-15 fw-normal d-inline-block default-badge"}>
                                                    {amenity.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                                                    <Link href={`/admin/amenities/${amenity.id}/edit`} className="bg-transparent p-0 border-0 hover-text-success" aria-label="Edit amenity">
                                                        <i className="material-symbols-outlined fs-16 fw-normal text-primary">Edit</i>
                                                    </Link>
                                                    <button className="bg-transparent p-0 border-0 hover-text-danger" aria-label="Delete amenity" onClick={() => deleteAmenity(amenity.id)}>
                                                        <i className="material-symbols-outlined fs-16 fw-normal text-body">delete</i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center">No amenities found</td>
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
