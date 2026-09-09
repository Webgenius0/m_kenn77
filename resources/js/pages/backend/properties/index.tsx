import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface Amenity {
    id: number;
    name: string;
    quantity?: number;
}

interface DestinationType {
    id: number;
    name: string;
}

interface Property {
    id: number;
    name: string;
    slug: string;
    title: string | null;
    city: string | null;
    price_per_night: number | string | null;
    is_active: boolean;
    is_featured: boolean;
    destination_type?: DestinationType | null;
    amenities?: Amenity[];
}

export default function Index({ properties }: { properties: Property[] }) {
    const deleteProperty = (id: number) => {
        Swal.fire({
            title: "Delete property?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            confirmButtonText: "Yes, delete it",
        }).then((result) => {
            if (result.isConfirmed) router.delete(`/admin/properties/${id}`);
        });
    };

    return (
        <>
            <Head title="Properties" />
            <div className="main-content-container overflow-hidden" style={{ minHeight: "75vh" }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                    <div>
                        <h3 className="mb-0">Properties</h3>
                        <p className="fs-16">Manage the properties, amenities and pricing in your dashboard.</p>
                    </div>
                    <Link href="/admin/properties/create" className="btn btn-primary text-white">+ Add property</Link>
                </div>

                <div className="card bg-white rounded-10 border border-white mb-4">
                    <div className="p-20"><h3>Properties</h3></div>
                    <div className="default-table-area mx-minus-1 table-contact-list">
                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th className="fw-medium" scope="col">Property</th>
                                        <th className="fw-medium" scope="col">Type</th>
                                        <th className="fw-medium" scope="col">Location</th>
                                        <th className="fw-medium" scope="col">Price</th>
                                        <th className="fw-medium" scope="col">Status</th>
                                        <th className="fw-medium" scope="col">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.length > 0 ? properties.map((property) => (
                                        <tr key={property.id}>
                                            <td className="text-body">
                                                <div>
                                                    <div className="fw-medium">{property.name}</div>
                                                    <small className="text-muted">{property.slug}</small>
                                                </div>
                                            </td>
                                            <td className="text-body">{property.destination_type?.name || "-"}</td>
                                            <td className="text-body">{property.city || "-"}</td>
                                            <td className="text-body">{property.price_per_night ? `$${property.price_per_night}` : "-"}</td>
                                            <td>
                                                <span className={property.is_active ? "text-success bg-success bg-opacity-10 fs-15 fw-normal d-inline-block default-badge" : "text-danger bg-danger bg-opacity-10 fs-15 fw-normal d-inline-block default-badge"}>
                                                    {property.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                                                    <Link href={`/admin/properties/${property.id}/edit`} className="bg-transparent p-0 border-0 hover-text-success" aria-label="Edit property">
                                                        <i className="material-symbols-outlined fs-16 fw-normal text-primary">Edit</i>
                                                    </Link>
                                                    <button className="bg-transparent p-0 border-0 hover-text-danger" aria-label="Delete property" onClick={() => deleteProperty(property.id)}>
                                                        <i className="material-symbols-outlined fs-16 fw-normal text-body">delete</i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="text-center">No properties found</td>
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
