import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface Review {
    id: number;
    name: string;
    designation: string | null;
    image: string | null;
    message: string;
    source: string | null;
    created_at: string;
}

export default function Index({ reviews }: { reviews: Review[] }) {
    const deleteReview = (id: number) => {
        Swal.fire({
            title: "Delete Review?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete review",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/reviews/${id}`);
            }
        });
    };

    return (
        <>
            <Head title="Reviews" />

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                <div>
                    <h3 className="mb-0">Reviews</h3>
                    <p className="fs-16">Manage customer testimonials and reviews.</p>
                </div>
                <Link href="/admin/reviews/create" className="btn btn-primary text-white">
                    + Add Review
                </Link>
            </div>

            <div className="card bg-white rounded-10 border border-white mb-4">
                <div className="p-20">
                    <h3>All Reviews</h3>
                </div>
                <div className="default-table-area mx-minus-1 table-contact-list">
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th className="fw-medium" scope="col">Avatar</th>
                                    <th className="fw-medium" scope="col">Name</th>
                                    <th className="fw-medium" scope="col">Designation</th>
                                    <th className="fw-medium" scope="col">Message</th>
                                    <th className="fw-medium" scope="col">Source</th>
                                    <th className="fw-medium" scope="col">Added</th>
                                    <th className="fw-medium" scope="col">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <tr key={review.id}>
                                            <td>
                                                {review.image ? (
                                                    <img
                                                        src={review.image}
                                                        alt={review.name}
                                                        style={{
                                                            width: 48,
                                                            height: 48,
                                                            objectFit: "cover",
                                                            borderRadius: "50%",
                                                            border: "2px solid #e2e8f0",
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: "50%",
                                                            background: "#e2e8f0",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: 18,
                                                            color: "#94a3b8",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {review.name?.charAt(0)?.toUpperCase() ?? "?"}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-body fw-medium">{review.name}</td>
                                            <td className="text-body">{review.designation ?? "—"}</td>
                                            <td className="text-body" style={{ maxWidth: 260 }}>
                                                <span
                                                    style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {review.message}
                                                </span>
                                            </td>
                                            <td className="text-body">{review.source ?? "—"}</td>
                                            <td className="text-body">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div className="d-flex justify-content-end" style={{ gap: "12px" }}>
                                                    <Link
                                                        href={`/admin/reviews/${review.id}/edit`}
                                                        className="bg-transparent p-0 border-0 hover-text-success"
                                                        aria-label="Edit review"
                                                    >
                                                        <i className="material-symbols-outlined fs-16 fw-normal text-primary">
                                                            edit
                                                        </i>
                                                    </Link>
                                                    <button
                                                        className="bg-transparent p-0 border-0 hover-text-danger"
                                                        aria-label="Delete review"
                                                        onClick={() => deleteReview(review.id)}
                                                    >
                                                        <i className="material-symbols-outlined fs-16 fw-normal text-body">
                                                            delete
                                                        </i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">
                                            No reviews found. <Link href="/admin/reviews/create" className="text-primary">Add the first one.</Link>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="flex-grow-1"></div>
        </>
    );
}
