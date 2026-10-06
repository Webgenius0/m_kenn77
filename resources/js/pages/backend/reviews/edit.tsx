import { Head, router, useForm } from "@inertiajs/react";
import ImageUpload from "@/pages/widget/image-upload";

interface Review {
    id: number;
    name: string;
    designation: string | null;
    image: string | null;
    message: string;
    source: string | null;
}

type ReviewForm = {
    name: string;
    designation: string;
    image: File | null;
    message: string;
    source: string;
};

export default function Edit({ review }: { review: Review }) {
    const { data, setData, processing, errors } = useForm<ReviewForm>({
        name: review.name ?? "",
        designation: review.designation ?? "",
        image: null,
        message: review.message ?? "",
        source: review.source ?? "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            `/admin/reviews/${review.id}`,
            { ...data, _method: "put" } as any,
            { forceFormData: true }
        );
    };

    return (
        <>
            <Head title="Edit Review" />

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 mt-1">
                <div>
                    <h3 className="mb-0">Edit Review</h3>
                    <p className="fs-16">Update the customer testimonial details.</p>
                </div>
            </div>

            <div className="card bg-white border border-white rounded-10 p-20">
                <form onSubmit={submit}>
                    <div className="row">
                        {/* Left column */}
                        <div className="col-lg-8">
                            <div className="mb-20">
                                <label className="label fs-16 mb-2">
                                    Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. John Smith"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                />
                                {errors.name && (
                                    <div className="text-danger mt-1">{errors.name}</div>
                                )}
                            </div>

                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Designation</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. CEO, Verified Guest"
                                    value={data.designation}
                                    onChange={(e) => setData("designation", e.target.value)}
                                />
                                {errors.designation && (
                                    <div className="text-danger mt-1">{errors.designation}</div>
                                )}
                            </div>

                            <div className="mb-20">
                                <label className="label fs-16 mb-2">Source</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Google, TripAdvisor, Airbnb"
                                    value={data.source}
                                    onChange={(e) => setData("source", e.target.value)}
                                />
                                {errors.source && (
                                    <div className="text-danger mt-1">{errors.source}</div>
                                )}
                            </div>

                            <div className="mb-20">
                                <label className="label fs-16 mb-2">
                                    Review Message <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={5}
                                    placeholder="Enter the customer's review..."
                                    value={data.message}
                                    onChange={(e) => setData("message", e.target.value)}
                                />
                                {errors.message && (
                                    <div className="text-danger mt-1">{errors.message}</div>
                                )}
                            </div>
                        </div>

                        {/* Right column — image upload */}
                        <div className="col-lg-4">
                            <ImageUpload
                                label="Reviewer Photo"
                                file={data.image}
                                imageUrl={review.image ?? undefined}
                                onChange={(file) => setData("image", file)}
                            />
                            {errors.image && (
                                <div className="text-danger mt-1">{errors.image}</div>
                            )}
                        </div>
                    </div>

                    <div className="d-flex gap-2 mt-2">
                        <button
                            type="submit"
                            className="btn btn-primary text-white"
                            disabled={processing}
                        >
                            {processing ? "Saving…" : "Update Review"}
                        </button>
                        <a href="/admin/reviews" className="btn btn-secondary text-white">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </>
    );
}
